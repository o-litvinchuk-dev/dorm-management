// src/controllers/settlementContractController.js

import Joi from "joi";
import { SettlementContract } from "../models/SettlementContract.js";
import Faculties from "../models/Faculties.js";
import Group from "../models/Group.js";
import { encrypt, decrypt } from "../utils/crypto.js";

const ensureNullForDB = (value) => {
    if (value === "" || value === undefined || value === null) {
        return null;
    }
    return value;
};

const shortYearDateValidation = (value, helpers) => {
    if (!value || value.length !== 2 || !/^\d\d$/.test(value)) {
        return helpers.error('any.invalid', { custom: 'Рік має бути у форматі РР (дві цифри, наприклад, 25 для 2025)' });
    }
    const yearNum = parseInt(value, 10);
    if (yearNum < 0 || yearNum > 99) {
        return helpers.error('date.format.yy', { custom: 'Рік має бути від 00 до 99' });
    }
    return value;
};

const joiErrorMessages = {
    'string.pattern.base': 'Некоректний формат поля',
    'string.length': 'Довжина поля має бути {#limit} символів',
    'string.min': 'Поле має містити щонайменше {#limit} символів',
    'string.max': 'Поле не може перевищувати {#limit} символів',
    'string.empty': 'Поле не може бути порожнім',
    'any.required': 'Це поле є обов\'язковим',
    'number.base': 'Поле має бути числом',
    'number.integer': 'Поле має бути цілим числом',
    'number.positive': 'Поле має бути позитивним числом',
    'number.min': 'Значення має бути не менше {#limit}',
    'number.max': 'Значення має бути не більше {#limit}',
    'array.length': 'Масив має містити рівно {#limit} елементів',
    'date.format': 'Некоректний формат дати',
    'date.greater': 'Дата має бути пізніше {#limit.key}',
    'boolean.base': 'Поле має бути булевим значенням',
    'any.invalid': 'Некоректне значення',
    'any.custom': 'Некоректне значення',
    'object.missing': 'Необхідно вказати одне з полів: {#peersWithLabels}',
    'date.format.yy': 'Рік має бути від 00 до 99',
};

const optionalMinString = (min, minMessageKey = 'string.min.withLabel', label = 'Поле') => {
    return Joi.string().allow('', null).optional().when(Joi.string().min(1), {
        then: Joi.string().min(min).messages({ 'string.min': `"${label}" має містити щонайменше ${min} символів, якщо вказано` }),
    });
};

const settlementContractSchema = Joi.object({
    contractDay: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'День договору: XX' }),
    contractMonth: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'Місяць договору: XX' }),
    contractYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required().messages(joiErrorMessages),
    proxyNumber: Joi.string().min(1).required().messages(joiErrorMessages),
    proxyDay: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'День довіреності: XX' }),
    proxyMonth: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'Місяць довіреності: XX' }),
    proxyYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required().messages(joiErrorMessages),
    course: Joi.number().integer().min(1).max(6).required().messages(joiErrorMessages),
    faculty: Joi.number().integer().positive().required().messages(joiErrorMessages),
    group: Joi.number().integer().positive().required().messages(joiErrorMessages),
    fullName: Joi.string().required().messages(joiErrorMessages),
    passportSeries: Joi.string().required().messages(joiErrorMessages),
    passportNumber: Joi.string().required().messages(joiErrorMessages),
    passportIssued: Joi.string().required().messages(joiErrorMessages),
    taxId: Joi.array().items(Joi.string()).length(10).required().messages(joiErrorMessages),
    dormStreet: Joi.string().min(3).required().messages(joiErrorMessages),
    dormBuilding: Joi.string().min(1).required().messages(joiErrorMessages),
    dormNumber: Joi.string().pattern(/^\d+$/).required().messages(joiErrorMessages),
    roomNumber: Joi.string().pattern(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/).allow('', null).optional().messages({ ...joiErrorMessages, 'string.pattern.base': 'Номер кімнати: число з необов\'язковою літерою' }),
    startDay: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'День початку: XX' }),
    startMonth: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'Місяць початку: XX' }),
    startYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required().messages(joiErrorMessages),
    endDay: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'День закінчення: XX' }),
    endMonth: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'Місяць закінчення: XX' }),
    endYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required().messages(joiErrorMessages),
    applicationDateDay: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'День заяви: XX' }),
    applicationDateMonth: Joi.string().length(2).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'Місяць заяви: XX' }),
    applicationDateYear: Joi.string().custom(shortYearDateValidation, 'YY date validation').required().messages(joiErrorMessages),
    residentFullName: Joi.string().required().messages(joiErrorMessages),
    residentRegion: Joi.string().min(2).required().messages(joiErrorMessages),
    residentDistrict: Joi.string().min(2).required().messages(joiErrorMessages),
    residentCity: Joi.string().min(2).required().messages(joiErrorMessages),
    residentPostalCode: Joi.string().length(5).pattern(/^\d+$/).required().messages({ ...joiErrorMessages, 'string.pattern.base': 'Поштовий індекс: 5 цифр' }),
    residentPhone: Joi.string().required().messages(joiErrorMessages),
    motherPhone: Joi.string().allow('', null).optional(),
    fatherPhone: Joi.string().allow('', null).optional(),
    parentFullName: Joi.string().required().messages(joiErrorMessages),
    // FIX: Зроблено поля дати для додатків необов'язковими, оскільки вони дублюють основну дату договору і не надсилаються з фронтенду
    day: Joi.string().length(2).pattern(/^\d+$/).optional().allow('', null).messages({ ...joiErrorMessages, 'string.pattern.base': 'День додатку: XX' }),
    month: Joi.string().length(2).pattern(/^\d+$/).optional().allow('', null).messages({ ...joiErrorMessages, 'string.pattern.base': 'Місяць додатку: XX' }),
    year: Joi.string().custom(shortYearDateValidation, 'YY date validation').optional().allow('', null).messages(joiErrorMessages),
    address_appendix1: Joi.string().min(5).required().messages(joiErrorMessages),
    dormManagerName_appendix1: optionalMinString(5, 'string.min', 'ПІБ завідувача (Додаток 1)'),
    residentName_appendix1: optionalMinString(5, 'string.min', 'ПІБ мешканця (Додаток 1)'),
    premisesNumber_appendix2: Joi.string().pattern(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/).allow('', null).optional().messages({ ...joiErrorMessages, 'string.pattern.base': 'Номер приміщення (Додаток 2): число з необов\'язковою літерою' }),
    premisesArea_appendix2: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).allow('', null).optional().messages({ ...joiErrorMessages, 'string.pattern.base': 'Площа приміщення (Додаток 2): число, можливо з 1-2 знаками після коми'}),
    inventory: Joi.array().items(Joi.object({
        name: Joi.string().allow('', null).optional().max(100).messages({ ...joiErrorMessages, 'string.max': 'Назва предмету: макс. 100 символів' }),
        quantity: Joi.string().pattern(/^\d*$/).allow('', null).default('0').max(5).messages({ ...joiErrorMessages, 'string.max': 'К-сть: макс 5 цифр' }),
        note: Joi.string().max(500).allow('', null).optional().messages({ ...joiErrorMessages, 'string.max': 'Примітка: макс. 500 символів' }),
    })).length(16).required().messages(joiErrorMessages),
    premisesConditions: Joi.array().items(Joi.object({
        description: Joi.string().max(255).allow('', null).optional().messages({ ...joiErrorMessages, 'string.max': 'Опис стану: макс. 255 символів' }),
        condition: Joi.string().valid("Добрий", "Задовільний", "Потребує косметичного ремонту", "Потребує капітального ремонту", "Непридатний", "Відсутній", "", null).allow('', null).optional().messages(joiErrorMessages),
    })).length(6).required().messages(joiErrorMessages),
    electricalAppliances: Joi.array().items(Joi.object({
        name: Joi.string().max(100).allow('', null).optional().messages({ ...joiErrorMessages, 'string.max': 'Назва приладу: макс. 100 символів' }),
        brand: Joi.string().max(100).allow('', null).optional().messages({ ...joiErrorMessages, 'string.max': 'Марка: макс. 100 символів' }),
        year: Joi.string().pattern(/^\d{4}$/).allow('', null).optional().messages(joiErrorMessages),
        quantity: Joi.string().pattern(/^\d*$/).allow('', null).default('0').max(5).messages({ ...joiErrorMessages, 'string.max': 'К-сть: макс 5 цифр' }),
        note: Joi.string().max(500).allow('', null).optional().messages({ ...joiErrorMessages, 'string.max': 'Примітка: макс. 500 символів' }),
    })).length(7).required().messages(joiErrorMessages),
    dataProcessingConsent: Joi.boolean().required().valid(true).messages(joiErrorMessages),
    contractTermsConsent: Joi.boolean().required().valid(true).messages(joiErrorMessages),
    dataAccuracyConsent: Joi.boolean().required().valid(true).messages(joiErrorMessages),
    academicYearStart: Joi.string().pattern(/^\d{4}$/).allow('', null).optional().messages(joiErrorMessages),
    academicYearEnd: Joi.string().pattern(/^\d{4}$/).allow('', null).optional().messages(joiErrorMessages),
    roomNumber_appendix1: Joi.string().pattern(/^\d+[А-ЯІЇЄҐа-яіїєґ]?$/).allow('', null).optional().messages({ ...joiErrorMessages, 'string.pattern.base': 'Номер кімнати: число з необов\'язковою літерою' }),
    // FIX: Зроблено поле необов'язковим, оскільки воно дублює основний номер гуртожитку і не надсилається з фронтенду
    dormNumber_appendix1: Joi.string().pattern(/^\d+$/).optional().allow('', null).messages(joiErrorMessages),
    dormManagerName_appendix2: optionalMinString(5, 'string.min', 'ПІБ завідувача (Додаток 2)'),
    residentName_appendix2: optionalMinString(5, 'string.min', 'ПІБ мешканця (Додаток 2, текст)'),
    residentName_appendix2_sig: optionalMinString(5, 'string.min', 'ПІБ мешканця (Додаток 2, підпис)'),
    dormManagerName_appendix3: optionalMinString(5, 'string.min', 'ПІБ завідувача (Додаток 3)'),
    residentName_appendix3: optionalMinString(5, 'string.min', 'ПІБ мешканця (Додаток 3)'),
}).or('motherPhone', 'fatherPhone').messages({ ...joiErrorMessages, 'object.missing': 'Потрібно вказати телефон матері або батька.' });

export const createSettlementContract = async (req, res) => {
    try {
        const { error, value: contractDataFromRequest } = settlementContractSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            console.error("[SettlementContractCtrl] Joi Validation error:", JSON.stringify(error.details, null, 2));
            return res.status(400).json({
                error: "Невірні дані форми",
                details: error.details.map(d => ({
                    message: d.message,
                    path: d.path,
                    type: d.type,
                    context: d.context
                })),
            });
        }

        const facultyFromDb = await Faculties.findById(contractDataFromRequest.faculty);
        if (!facultyFromDb) {
            return res.status(400).json({
                error: "Факультет не знайдено за ID",
                details: `Faculty ID: ${contractDataFromRequest.faculty}`,
            });
        }

        const groupFromDb = await Group.findById(contractDataFromRequest.group);
        if (!groupFromDb) {
            return res.status(400).json({
                error: "Групу не знайдено за ID",
                details: `Group ID: ${contractDataFromRequest.group}`,
            });
        }
        
        if (String(groupFromDb.faculty_id) !== String(facultyFromDb.id)) {
            return res.status(400).json({
                error: "Вибрана група не належить до вказаного факультету.",
            });
        }

        if (String(groupFromDb.course) !== String(contractDataFromRequest.course)) {
            return res.status(400).json({
                error: `Курс (${contractDataFromRequest.course}) не співпадає з курсом групи (${groupFromDb.course}).`,
            });
        }
        
        const userId = req.user.userId;
        const { faculty, group, ...restOfValidatedData } = contractDataFromRequest;

        const payloadToModel = {
            contractDay: restOfValidatedData.contractDay,
            contractMonth: restOfValidatedData.contractMonth,
            contractYear: restOfValidatedData.contractYear,
            proxyDay: restOfValidatedData.proxyDay,
            proxyMonth: restOfValidatedData.proxyMonth,
            proxyYear: restOfValidatedData.proxyYear,
            startDay: restOfValidatedData.startDay,
            startMonth: restOfValidatedData.startMonth,
            startYear: restOfValidatedData.startYear,
            endDay: restOfValidatedData.endDay,
            endMonth: restOfValidatedData.endMonth,
            endYear: restOfValidatedData.endYear,
            day: restOfValidatedData.contractDay, // Використовуємо основну дату
            month: restOfValidatedData.contractMonth, // Використовуємо основну дату
            year: restOfValidatedData.contractYear, // Використовуємо основну дату
            proxyNumber: restOfValidatedData.proxyNumber,
            course: restOfValidatedData.course,
            group_name: groupFromDb.name,
            faculty_name: facultyFromDb.name,
            dormStreet: restOfValidatedData.dormStreet,
            dormBuilding: restOfValidatedData.dormBuilding,
            dormNumber: restOfValidatedData.dormNumber,
            residentRegion: restOfValidatedData.residentRegion,
            residentDistrict: restOfValidatedData.residentDistrict,
            residentCity: restOfValidatedData.residentCity,
            residentPostalCode: restOfValidatedData.residentPostalCode,
            appendix_address: restOfValidatedData.address_appendix1,
            fullName_encrypted: encrypt(restOfValidatedData.fullName),
            passportSeries_encrypted: encrypt(restOfValidatedData.passportSeries),
            passportNumber_encrypted: encrypt(restOfValidatedData.passportNumber),
            passportIssued_encrypted: encrypt(restOfValidatedData.passportIssued),
            taxId_encrypted: encrypt(JSON.stringify(restOfValidatedData.taxId || [])),
            residentFullName_encrypted: encrypt(restOfValidatedData.residentFullName),
            residentPhone_encrypted: encrypt(restOfValidatedData.residentPhone),
            parentFullName_encrypted: encrypt(restOfValidatedData.parentFullName),
            motherPhone_encrypted: restOfValidatedData.motherPhone ? encrypt(restOfValidatedData.motherPhone) : null,
            fatherPhone_encrypted: restOfValidatedData.fatherPhone ? encrypt(restOfValidatedData.fatherPhone) : null,
            roomNumber: ensureNullForDB(restOfValidatedData.roomNumber),
            dorm_manager_name: ensureNullForDB(restOfValidatedData.dormManagerName_appendix1),
            resident_name: ensureNullForDB(restOfValidatedData.residentName_appendix1),
            premises_number: ensureNullForDB(restOfValidatedData.premisesNumber_appendix2),
            premises_area: ensureNullForDB(restOfValidatedData.premisesArea_appendix2),
            dataProcessingConsent: !!restOfValidatedData.dataProcessingConsent,
            contractTermsConsent: !!restOfValidatedData.contractTermsConsent,
            dataAccuracyConsent: !!restOfValidatedData.dataAccuracyConsent,
            inventory: (restOfValidatedData.inventory || []).map(item => ({
                name: ensureNullForDB(item.name),
                quantity: String(ensureNullForDB(item.quantity) ?? '0'),
                note: ensureNullForDB(item.note),
            })),
            premisesConditions: (restOfValidatedData.premisesConditions || []).map(item => ({
                description: ensureNullForDB(item.description),
                condition: ensureNullForDB(item.condition),
            })),
            electricalAppliances: (restOfValidatedData.electricalAppliances || []).map(appliance => ({
                appliance_name: ensureNullForDB(appliance.name),
                brand: ensureNullForDB(appliance.brand),
                manufacture_year: ensureNullForDB(appliance.year),
                quantity: String(ensureNullForDB(appliance.quantity) ?? '0'),
                note: ensureNullForDB(appliance.note),
            })),
        };

        const contractId = await SettlementContract.create(payloadToModel, userId);
        res.status(201).json({
            message: "Договір про поселення успішно створено",
            contractId,
        });
    } catch (error) {
        console.error("[SettlementContractCtrl] Error creating settlement contract:", {
            message: error.message,
            stack: error.stack,
            details: error.details,
        });
        if (!res.headersSent) {
            res.status(500).json({
                error: "Помилка сервера при створенні договору",
                details: error.message,
            });
        }
    }
};

export const getSettlementAgreementsAdmin = async (req, res) => {
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
        const decryptedAgreements = result.agreements.map((agreement) => {
            const decrypt = require("../utils/crypto.js").decrypt;
            const SENSITIVE_FIELDS_FOR_DECRYPT = [
                "full_name_encrypted", "passport_series_encrypted", "passport_number_encrypted",
                "passport_issued_encrypted", "tax_id_encrypted", "resident_full_name_encrypted",
                "resident_phone_encrypted", "mother_phone_encrypted", "father_phone_encrypted",
                "parent_full_name_encrypted",
            ];
            const decrypted = { ...agreement };
            SENSITIVE_FIELDS_FOR_DECRYPT.forEach(key => {
                if (agreement[key]) {
                    const decryptedKey = key.replace('_encrypted', '');
                    if (key === "tax_id_encrypted") {
                        try {
                            const encryptedTaxIdArray = JSON.parse(agreement[key]);
                            if(Array.isArray(encryptedTaxIdArray)) {
                                decrypted[decryptedKey] = encryptedTaxIdArray.map(val => decrypt(val)).join('');
                            } else {
                                decrypted[decryptedKey] = "[Помилка формату ІПН]";
                            }
                        } catch (e) {
                            console.warn(`Error parsing tax_id_encrypted for contract ${agreement.id}: ${e.message}`);
                            decrypted[decryptedKey] = "[Помилка парсингу ІПН]";
                        }
                    } else {
                        decrypted[decryptedKey] = decrypt(agreement[key]);
                    }
                    if (key !== decryptedKey) delete decrypted[key];
                } else {
                    decrypted[key.replace('_encrypted', '')] = null;
                }
            });
            return decrypted;
        });

        res.json({
            ...result,
            agreements: decryptedAgreements,
        });
    } catch (error) {
        console.error("[AdminSettlementContractCtrl] Помилка отримання договорів:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const getSettlementAgreementByIdAdmin = async (req, res) => {
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
        
        const decrypt = require("../utils/crypto.js").decrypt;
        const SENSITIVE_FIELDS_FOR_DECRYPT = [
            "full_name_encrypted", "passport_series_encrypted", "passport_number_encrypted",
            "passport_issued_encrypted", "tax_id_encrypted", "resident_full_name_encrypted",
            "resident_phone_encrypted", "mother_phone_encrypted", "father_phone_encrypted",
            "parent_full_name_encrypted",
        ];
        const decryptedContract = { ...contract };
        SENSITIVE_FIELDS_FOR_DECRYPT.forEach(key => {
            if (contract[key]) {
                const decryptedKey = key.replace('_encrypted', '');
                if (key === "tax_id_encrypted") {
                    try {
                        const encryptedTaxIdArray = JSON.parse(contract[key]);
                        if(Array.isArray(encryptedTaxIdArray)) {
                            decryptedContract[decryptedKey] = encryptedTaxIdArray.map(val => decrypt(val)).join('');
                        } else {
                            decryptedContract[decryptedKey] = "[Помилка формату ІПН]";
                        }
                    } catch (e) {
                        console.warn(`Error parsing tax_id_encrypted for contract ${contract.id}: ${e.message}`);
                        decryptedContract[decryptedKey] = "[Помилка парсингу ІПН]";
                    }
                } else {
                    decryptedContract[decryptedKey] = decrypt(contract[key]);
                }
                if (key !== decryptedKey) delete decryptedContract[key];
            } else {
                decryptedContract[key.replace('_encrypted', '')] = null;
            }
        });

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

        const contract = await SettlementContract.findByIdAdmin(id);
        if (!contract) {
            return res.status(404).json({ error: "Договір не знайдено" });
        }
        
        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (String(contract.dorm_number) !== String(req.user.dormitory_id)) {
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        }
        
        const updated = await SettlementContract.updateAdmin(id, { status, admin_notes, updated_by: req.user.userId });
        if (!updated) {
            return res.status(500).json({ error: "Не вдалося оновити договір" });
        }

        res.json({ message: "Договір успішно оновлено" });
    } catch (error) {
        console.error("[AdminSettlementContractCtrl] Помилка оновлення договору:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};