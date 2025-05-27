import Joi from "joi";
import { SettlementContract } from "../models/SettlementContract.js";
import { decrypt } from "../utils/crypto.js";
import { DormitoryPassService } from "../services/dormitoryPassService.js";
import Notification from "../models/Notification.js";

const SENSITIVE_FIELDS = [ /* ... (без змін) ... */
    "full_name_encrypted",
    "passport_series_encrypted",
    "passport_number_encrypted",
    "passport_issued_encrypted",
    "tax_id_encrypted",
    "resident_full_name_encrypted",
    "resident_phone_encrypted",
    "mother_phone_encrypted",
    "father_phone_encrypted",
    "parent_full_name_encrypted",
];
const decryptContractData = (contract) => { /* ... (без змін) ... */
    if (!contract) return null;
    const decryptedContract = { ...contract };
    SENSITIVE_FIELDS.forEach((encryptedFieldKey) => {
        const decryptedFieldKey = encryptedFieldKey.replace("_encrypted", "");
        const encryptedValue = decryptedContract[encryptedFieldKey];
        if (encryptedValue && typeof encryptedValue === "string") {
            try {
                if (encryptedFieldKey === "tax_id_encrypted") {
                    const encryptedTaxIdArray = JSON.parse(encryptedValue);
                    if (Array.isArray(encryptedTaxIdArray)) {
                        decryptedContract[decryptedFieldKey] = encryptedTaxIdArray.map(val => decrypt(val)).join('');
                    } else {
                        console.warn(`[Decrypt] tax_id_encrypted for contract ${contract.id} was not a valid array string:`, encryptedValue);
                        decryptedContract[decryptedFieldKey] = "[Помилка формату ІПН]";
                    }
                } else {
                    decryptedContract[decryptedFieldKey] = decrypt(encryptedValue);
                }
            } catch (e) {
                console.warn(
                    `[Decrypt] Failed to decrypt field ${encryptedFieldKey} for contract ${contract.id}:`,
                    e.message,
                    `Input: ${String(encryptedValue).substring(0, 20)}...`
                );
                decryptedContract[decryptedFieldKey] = "[Помилка дешифрування]";
            }
        } else {
            decryptedContract[decryptedFieldKey] = null;
            if (encryptedValue !== null && encryptedValue !== undefined) {
                console.warn(
                    `[Decrypt] Field ${encryptedFieldKey} for contract ${contract.id} is not a string or is empty, but exists. Value:`,
                    encryptedValue
                );
            }
        }
        if (decryptedContract.hasOwnProperty(decryptedFieldKey) && encryptedFieldKey !== decryptedFieldKey) {
            delete decryptedContract[encryptedFieldKey];
        }
    });
    return decryptedContract;
};

export const getSettlementAgreementsAdmin = async (req, res) => { /* ... (без змін) ... */
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().allow("").default(""),
            status: Joi.string().allow("").default(""),
            dormitory_id: Joi.number().integer().positive().allow(null, "").optional(),
            sortBy: Joi.string()
                .valid("id", "contract_date", "dormitory_name", "room_number", "status", "user_name_from_users_table", "created_at")
                .default("created_at"),
            sortOrder: Joi.string().valid("asc", "desc").default("desc"),
        });
        const { error, value: validatedQueryFilters } = schema.validate(req.query);
        if (error) {
            return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
        }
        let filters = { ...validatedQueryFilters };
        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            filters.dormitory_id = req.user.dormitory_id;
        }
        const result = await SettlementContract.findAllAdmin(filters);
        const decryptedAgreements = result.agreements.map((agreement) => decryptContractData(agreement));
        res.json({
            ...result,
            agreements: decryptedAgreements,
        });
    } catch (error) {
        console.error("[AdminSettlementContractCtrl] Помилка отримання договорів:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};
export const getSettlementAgreementByIdAdmin = async (req, res) => { /* ... (без змін) ... */
    try {
        const { id } = req.params;
        const contract = await SettlementContract.findByIdAdmin(id);
        if (!contract) {
            return res.status(404).json({ error: "Договір не знайдено" });
        }
        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (String(contract.dorm_number) !== String(req.user.dormitory_id)) {
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        }
        const decryptedContract = decryptContractData(contract);
        res.json(decryptedContract);
    } catch (error) {
        console.error("[AdminSettlementContractCtrl] Помилка отримання договору за ID:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const updateSettlementAgreementAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        const schema = Joi.object({
            status: Joi.string().valid("pending_review", "approved", "rejected", "archived").required(),
            admin_notes: Joi.string().allow(null, "").max(2000).optional(),
        });
        const { error } = schema.validate({ status, admin_notes });
        if (error) {
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        const contractBeforeUpdate = await SettlementContract.findByIdAdmin(id);
        if (!contractBeforeUpdate) {
            return res.status(404).json({ error: "Договір не знайдено" });
        }

        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (String(contractBeforeUpdate.dorm_number) !== String(req.user.dormitory_id)) {
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        }

        const updated = await SettlementContract.updateAdmin(id, { status, admin_notes, updated_by: req.user.userId });
        if (!updated) {
            return res.status(500).json({ error: "Не вдалося оновити договір" });
        }

        const contractAfterUpdate = await SettlementContract.findByIdAdmin(id); // Отримуємо оновлений контракт

        if (status === 'approved' && contractAfterUpdate) {
            try {
                // Важливо: передаємо дані з КОНТРАКТУ для генерації перепустки
                const passGeneratedId = await DormitoryPassService.ensurePassForContractDetails({
                    contractId: Number(contractAfterUpdate.id),
                    userId: Number(contractAfterUpdate.user_id),
                    dormitoryId: Number(contractAfterUpdate.dorm_number), // З контракту!
                    roomNumberText: String(contractAfterUpdate.room_number), // З контракту!
                    validFrom: contractAfterUpdate.settlement_start_date, // З контракту!
                    validUntil: contractAfterUpdate.settlement_end_date, // З контракту!
                    issuedBy: Number(req.user.userId)
                });

                if (passGeneratedId) {
                    await Notification.create({
                        user_id: contractAfterUpdate.user_id,
                        title: "Договір на поселення затверджено",
                        description: `Ваш договір на поселення (ID: ${contractAfterUpdate.id}) було затверджено. Перепустку згенеровано/оновлено.`,
                    });
                } else {
                    // Сповіщення, якщо перепустка не згенерована (наприклад, немає відповідної заявки)
                    // Це вже обробляється всередині ensurePassForContractDetails, тому тут можна нічого не робити,
                    // або додати логування, якщо потрібно.
                    console.warn(`[AdminSettlementContractCtrl] Pass not generated for approved contract ${id}, ensurePassForContractDetails returned null.`);
                }
            } catch (passError) {
                console.error(`[AdminSettlementContractCtrl] Failed to ensure pass for contract ${id}:`, passError);
                // Повідомити студента, що договір затверджено, але з перепусткою виникла проблема
                 await Notification.create({
                    user_id: contractAfterUpdate.user_id,
                    title: "Договір затверджено, але є нюанс",
                    description: `Ваш договір (ID: ${id}) затверджено. Виникла помилка при генерації перепустки. Зверніться до адміністрації.`,
                });
            }
        } else if (contractAfterUpdate && (status === 'rejected' || status === 'archived')) {
            await Notification.create({
                user_id: contractAfterUpdate.user_id,
                title: `Договір на поселення ${status === 'rejected' ? 'відхилено' : 'архівовано'}`,
                description: `Ваш договір на поселення (ID: ${contractAfterUpdate.id}) отримав статус "${status}". ${admin_notes ? ' Коментар: ' + admin_notes : ''}`,
            });
        }

        res.json({ message: "Договір успішно оновлено" });
    } catch (error) {
        console.error("[AdminSettlementContractCtrl] Помилка оновлення договору:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};