import pool from "../config/db.js";

// Helper function to determine if an inventory item is effectively empty
const isInventoryItemEffectivelyEmpty = (item) => {
    const nameEmpty = !item.name || String(item.name).trim() === "";
    const quantityEffectivelyEmpty = !item.quantity || String(item.quantity).trim() === "" || String(item.quantity).trim() === "0";
    const noteEmpty = !item.note || String(item.note).trim() === "";
    return nameEmpty && quantityEffectivelyEmpty && noteEmpty;
};

// Helper function to determine if an electrical appliance item is effectively empty
const isApplianceItemEffectivelyEmpty = (item) => {
    const nameEmpty = !item.appliance_name || String(item.appliance_name).trim() === "";
    const brandEmpty = !item.brand || String(item.brand).trim() === "";
    const yearEmpty = !item.manufacture_year || String(item.manufacture_year).trim() === "";
    const quantityEffectivelyEmpty = !item.quantity || String(item.quantity).trim() === "" || String(item.quantity).trim() === "0";
    const noteEmpty = !item.note || String(item.note).trim() === "";
    if (item.item_order === 0 && (item.appliance_name === "Холодильник" || !item.appliance_name)) {
        return brandEmpty && yearEmpty && quantityEffectivelyEmpty && noteEmpty;
    }
    return nameEmpty && brandEmpty && yearEmpty && quantityEffectivelyEmpty && noteEmpty;
};

// Helper function for premises conditions
const isPremisesConditionItemEffectivelyEmpty = (item) => {
    const descriptionEmpty = !item.description || String(item.description).trim() === "";
    const conditionStatusEmpty = !item.condition || String(item.condition).trim() === "";
    if (item.item_order < 4) {
        return conditionStatusEmpty;
    }
    return descriptionEmpty && conditionStatusEmpty;
};

export class SettlementContract {
    static async create(contractData, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const {
                contractDay, contractMonth, contractYear,
                proxyDay, proxyMonth, proxyYear,
                startDay, startMonth, startYear,
                endDay, endMonth, endYear,
                day, month, year,
                fullName_encrypted, passportSeries_encrypted, passportNumber_encrypted, passportIssued_encrypted,
                taxId_encrypted,
                residentFullName_encrypted, residentPhone_encrypted, motherPhone_encrypted, fatherPhone_encrypted, parentFullName_encrypted,
                proxyNumber, course, group_name, faculty_name,
                dormStreet, dormBuilding, dormNumber, roomNumber,
                residentRegion, residentDistrict, residentCity, residentPostalCode,
                appendix_address,
                dorm_manager_name,
                resident_name,
                premises_number,
                premises_area,
                dataProcessingConsent, contractTermsConsent, dataAccuracyConsent,
                inventory, premisesConditions, electricalAppliances,
            } = contractData;

            const currentFullYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentFullYear / 100) * 100;
            const formatDateYYToYYYYMMDD = (d, m, yyShort) => {
                if (!d || !m || !yyShort || String(yyShort).length !== 2) return null;
                const fullYear = currentCentury + parseInt(yyShort, 10);
                return `${fullYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            };

            const dbContractDate = formatDateYYToYYYYMMDD(contractDay, contractMonth, contractYear);
            const dbProxyDate = formatDateYYToYYYYMMDD(proxyDay, proxyMonth, proxyYear);
            const dbSettlementStartDate = formatDateYYToYYYYMMDD(startDay, startMonth, startYear);
            const dbSettlementEndDate = formatDateYYToYYYYMMDD(endDay, endMonth, endYear);
            const dbAppendixDate = formatDateYYToYYYYMMDD(day, month, year);

            const contractQuery = `
                INSERT INTO settlement_contracts (
                    user_id, contract_date, proxy_number, proxy_date, course, group_name, faculty_name,
                    full_name_encrypted, passport_series_encrypted, passport_number_encrypted, passport_issued_encrypted,
                    tax_id_encrypted, dorm_street, dorm_building, dorm_number, room_number,
                    settlement_start_date, settlement_end_date,
                    resident_full_name_encrypted, resident_region, resident_district, resident_city, resident_postal_code,
                    resident_phone_encrypted, mother_phone_encrypted, father_phone_encrypted, parent_full_name_encrypted,
                    appendix_date, appendix_address, dorm_manager_name, resident_name,
                    premises_number, premises_area,
                    data_processing_consent, contract_terms_consent, data_accuracy_consent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                userId, dbContractDate, proxyNumber, dbProxyDate, course, group_name, faculty_name,
                fullName_encrypted, passportSeries_encrypted, passportNumber_encrypted, passportIssued_encrypted,
                taxId_encrypted,
                dormStreet, dormBuilding, dormNumber, roomNumber,
                dbSettlementStartDate, dbSettlementEndDate,
                residentFullName_encrypted, residentRegion, residentDistrict, residentCity, residentPostalCode,
                residentPhone_encrypted, motherPhone_encrypted, fatherPhone_encrypted, parentFullName_encrypted,
                dbAppendixDate, appendix_address,
                dorm_manager_name, resident_name,
                premises_number, premises_area,
                dataProcessingConsent, contractTermsConsent, dataAccuracyConsent,
            ];

            const [contractResult] = await connection.execute(contractQuery, params);
            const contractId = contractResult.insertId;

            const validInventoryItems = inventory.filter(item => !isInventoryItemEffectivelyEmpty(item));
            if (validInventoryItems.length > 0) {
                const inventoryQuery = `INSERT INTO settlement_contract_inventory (contract_id, item_name, quantity, note, item_order) VALUES ?`;
                const inventoryValues = validInventoryItems.map((item, index) => [
                    contractId,
                    item.name,
                    item.quantity,
                    item.note,
                    inventory.findIndex(originalItem => originalItem === item)
                ]);
                await connection.query(inventoryQuery, [inventoryValues]);
            }

            const validPremisesConditions = premisesConditions
                .map((item, index) => ({ ...item, item_order: index }))
                .filter(item => !isPremisesConditionItemEffectivelyEmpty(item));
            if (validPremisesConditions.length > 0) {
                const conditionsQuery = `INSERT INTO settlement_contract_premises_conditions (contract_id, description, condition_status, item_order) VALUES ?`;
                const conditionsValues = validPremisesConditions.map((item) => [
                    contractId,
                    item.description,
                    item.condition,
                    item.item_order
                ]);
                await connection.query(conditionsQuery, [conditionsValues]);
            }

            const validElectricalAppliances = electricalAppliances
                .map((item, index) => ({ ...item, item_order: index }))
                .filter(item => !isApplianceItemEffectivelyEmpty(item));
            if (validElectricalAppliances.length > 0) {
                const appliancesQuery = `INSERT INTO settlement_contract_electrical_appliances (contract_id, appliance_name, brand, manufacture_year, quantity, note, item_order) VALUES ?`;
                const appliancesValues = validElectricalAppliances.map((item) => [
                    contractId,
                    item.appliance_name,
                    item.brand,
                    item.manufacture_year,
                    item.quantity,
                    item.note,
                    item.item_order
                ]);
                await connection.query(appliancesQuery, [appliancesValues]);
            }

            await connection.commit();
            return contractId;
        } catch (error) {
            await connection.rollback();
            console.error("[SettlementContractModel] Error in create:", {
                message: error.message,
                stack: error.stack,
            });
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findAllForUser(userId, { page = 1, limit = 10, status = "", sortBy = "created_at", sortOrder = "desc" }, connection = pool) {
        const offset = (Number(page) - 1) * Number(limit);
        let query = `
        SELECT sc.id, sc.user_id, DATE_FORMAT(sc.contract_date, '%Y-%m-%d') as contract_date,
        sc.dorm_number, d.name as dormitory_name_from_dormitories_table, sc.room_number,
        sc.status, sc.created_at, sc.updated_at, sc.faculty_name, sc.group_name, sc.course,
        DATE_FORMAT(sc.settlement_start_date, '%Y-%m-%d') as settlement_start_date,
        DATE_FORMAT(sc.settlement_end_date, '%Y-%m-%d') as settlement_end_date
        FROM settlement_contracts sc
        LEFT JOIN dormitories d ON sc.dorm_number = d.id
        WHERE sc.user_id = ?
        `;
        let countQuery = `
        SELECT COUNT(sc.id) as total
        FROM settlement_contracts sc
        WHERE sc.user_id = ?
        `;
        const params = [userId];
        const countParams = [userId];

        if (status) {
            query += ` AND sc.status = ?`;
            countQuery += ` AND sc.status = ?`;
            params.push(status);
            countParams.push(status);
        }

        const validSortFields = {
            id: "sc.id", contract_date: "sc.contract_date", status: "sc.status", created_at: "sc.created_at"
        };
        let sortField = validSortFields[sortBy] || "sc.created_at";
        const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

        query += ` ORDER BY ${sortField} ${sortDirection} LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        try {
            const [rows] = await connection.query(query, params);
            const [[{ total }]] = await connection.query(countQuery, countParams);
            return {
                agreements: rows,
                total: Number(total),
                page: Number(page),
                limit: Number(limit),
            };
        } catch (dbError) {
            console.error("[SettlementContractModel] Error in findAllForUser SQL execution:", dbError);
            throw new Error(`Failed to fetch user's settlement agreements: ${dbError.message}`);
        }
    }

    static async findByIdForUser(id, userId, connection = pool) {
        const query = `
        SELECT sc.*,
        DATE_FORMAT(sc.contract_date, '%Y-%m-%d') as contract_date,
        DATE_FORMAT(sc.proxy_date, '%Y-%m-%d') as proxy_date,
        DATE_FORMAT(sc.settlement_start_date, '%Y-%m-%d') as settlement_start_date,
        DATE_FORMAT(sc.settlement_end_date, '%Y-%m-%d') as settlement_end_date,
        DATE_FORMAT(sc.appendix_date, '%Y-%m-%d') as appendix_date,
        u.email as user_email,
        u.name as user_name_from_users_table,
        d.name as dormitory_name_from_dormitories_table
        FROM settlement_contracts sc
        LEFT JOIN users u ON sc.user_id = u.id
        LEFT JOIN dormitories d ON sc.dorm_number = d.id
        WHERE sc.id = ? AND sc.user_id = ?
        `;
        const [rows] = await connection.execute(query, [id, userId]);
        if (rows.length === 0) return null;
        
        const contract = rows[0];

        const [inventory] = await connection.execute("SELECT *, item_name as name FROM settlement_contract_inventory WHERE contract_id = ? ORDER BY item_order ASC", [id]);
        const [premisesConditions] = await connection.execute("SELECT *, condition_status as `condition` FROM settlement_contract_premises_conditions WHERE contract_id = ? ORDER BY item_order ASC", [id]);
        const [electricalAppliances] = await connection.execute("SELECT *, appliance_name as name, manufacture_year as year FROM settlement_contract_electrical_appliances WHERE contract_id = ? ORDER BY item_order ASC", [id]);
        
        contract.inventory = inventory.map(item => ({ ...item, item_order: Number(item.item_order) }));
        contract.premisesConditions = premisesConditions.map(item => ({ ...item, item_order: Number(item.item_order) }));
        contract.electricalAppliances = electricalAppliances.map(item => ({ ...item, item_order: Number(item.item_order) }));

        return contract;
    }

    static async findAllAdmin({ page = 1, limit = 10, search = "", status = "", dormitory_id = null, sortBy = "created_at", sortOrder = "desc" }, connection = pool) {
        const offset = (page - 1) * limit;
        let query = `
        SELECT sc.id, sc.user_id, DATE_FORMAT(sc.contract_date, '%Y-%m-%d') as contract_date,
        sc.dorm_number, d.name as dormitory_name, sc.room_number,
        sc.status, sc.created_at, sc.updated_at,
        u.email as user_email, u.name as user_name_from_users_table
        FROM settlement_contracts sc
        LEFT JOIN users u ON sc.user_id = u.id
        LEFT JOIN dormitories d ON sc.dorm_number = d.id
        WHERE 1=1
        `;
        let countQuery = `
        SELECT COUNT(sc.id) as total
        FROM settlement_contracts sc
        LEFT JOIN users u ON sc.user_id = u.id
        LEFT JOIN dormitories d ON sc.dorm_number = d.id
        WHERE 1=1
        `;
        const params = [];
        const countParams = [];
        if (search) {
            query += ` AND (u.name LIKE ? OR u.email LIKE ? OR CAST(sc.id AS CHAR) LIKE ? OR d.name LIKE ? OR sc.room_number LIKE ?)`;
            countQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR CAST(sc.id AS CHAR) LIKE ? OR d.name LIKE ? OR sc.room_number LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (status) {
            query += ` AND sc.status = ?`;
            countQuery += ` AND sc.status = ?`;
            params.push(status);
            countParams.push(status);
        }
        if (dormitory_id) {
            query += ` AND sc.dorm_number = ?`;
            countQuery += ` AND sc.dorm_number = ?`;
            params.push(String(dormitory_id));
            countParams.push(String(dormitory_id));
        }
        const validSortFields = ["id", "contract_date", "dormitory_name", "room_number", "status", "user_name_from_users_table", "created_at"];
        let sortField = validSortFields.includes(sortBy) ? sortBy : "sc.created_at";
        if (sortBy === "dormitory_name") sortField = "d.name";
        else if (sortBy === "user_name_from_users_table") sortField = "u.name";
        else if (!sortField.includes(".")) sortField = `sc.${sortField}`;
        const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        query += ` ORDER BY ${sortField} ${sortDirection} LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));
        const [rows] = await connection.query(query, params);
        const [[{ total }]] = await connection.query(countQuery, countParams);

        return {
            agreements: rows,
            total,
            page: Number(page),
            limit: Number(limit),
        };
    }

    static async findByIdAdmin(id, connection = pool) {
        const query = `
        SELECT sc.*,
        DATE_FORMAT(sc.contract_date, '%Y-%m-%d') as contract_date,
        DATE_FORMAT(sc.proxy_date, '%Y-%m-%d') as proxy_date,
        DATE_FORMAT(sc.settlement_start_date, '%Y-%m-%d') as settlement_start_date,
        DATE_FORMAT(sc.settlement_end_date, '%Y-%m-%d') as settlement_end_date,
        DATE_FORMAT(sc.appendix_date, '%Y-%m-%d') as appendix_date,
        u.email as user_email,
        u.name as user_name_from_users_table,
        d.name as dormitory_name_from_dormitories_table
        FROM settlement_contracts sc
        LEFT JOIN users u ON sc.user_id = u.id
        LEFT JOIN dormitories d ON sc.dorm_number = d.id
        WHERE sc.id = ?
        `;
        const [rows] = await connection.execute(query, [id]);
        if (rows.length === 0) return null;
        
        const contract = rows[0];

        const [inventory] = await connection.execute("SELECT *, item_name as name FROM settlement_contract_inventory WHERE contract_id = ? ORDER BY item_order ASC", [id]);
        const [premisesConditions] = await connection.execute("SELECT *, condition_status as `condition` FROM settlement_contract_premises_conditions WHERE contract_id = ? ORDER BY item_order ASC", [id]);
        const [electricalAppliances] = await connection.execute("SELECT *, appliance_name as name, manufacture_year as year FROM settlement_contract_electrical_appliances WHERE contract_id = ? ORDER BY item_order ASC", [id]);
        
        contract.inventory = inventory.map(item => ({ ...item, item_order: Number(item.item_order) }));
        contract.premisesConditions = premisesConditions.map(item => ({ ...item, item_order: Number(item.item_order) }));
        contract.electricalAppliances = electricalAppliances.map(item => ({ ...item, item_order: Number(item.item_order) }));

        return contract;
    }

    static async updateAdmin(id, { status, admin_notes, updated_by }, connection = pool) {
        const query = `
            UPDATE settlement_contracts
            SET status = ?, admin_notes = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const [result] = await connection.execute(query, [status, admin_notes, updated_by, id]);
        return result.affectedRows > 0;
    }
}