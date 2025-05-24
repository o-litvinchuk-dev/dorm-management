import pool from "../config/db.js";
// Немає потреби імпортувати encrypt/decrypt тут, якщо контролер вже шифрує дані

export class SettlementContract {
  static async create(contractData, userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Очікуємо, що всі _encrypted поля вже передані з контролера
      // А також YY дати вже трансформовані в YYYY-MM-DD формат
      const {
        contractDay, contractMonth, contractYear, // YY
        proxyNumber, proxyDay, proxyMonth, proxyYear, // YY
        course, group_name, faculty_name,
        fullName_encrypted, passportSeries_encrypted, passportNumber_encrypted, passportIssued_encrypted,
        taxId_encrypted, // JSON string of encrypted digits
        dormStreet, dormBuilding, dormNumber, roomNumber,
        startDay, startMonth, startYear, // YY
        endDay, endMonth, endYear, // YY
        residentFullName_encrypted, residentRegion, residentDistrict, residentCity, residentPostalCode,
        residentPhone_encrypted, motherPhone_encrypted, fatherPhone_encrypted, parentFullName_encrypted,
        day, month, year, // Appendix date - YY
        address, // Appendix address
        dormManagerName, residentName, // Appendix signatures
        premisesNumber, premisesArea,
        dataProcessingConsent, contractTermsConsent, dataAccuracyConsent,
        inventory, premisesConditions, electricalAppliances
      } = contractData;

      const currentFullYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentFullYear / 100) * 100;

      const formatDateYYToYYYYMMDD = (d, m, yy) => {
        if (!d || !m || !yy) return null;
        const fullYear = currentCentury + parseInt(yy, 10);
        return `${fullYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      };
      
      const dbContractDate = formatDateYYToYYYYMMDD(contractDay, contractMonth, contractYear);
      const dbProxyDate = formatDateYYToYYYYMMDD(proxyDay, proxyMonth, proxyYear);
      const dbSettlementStartDate = formatDateYYToYYYYMMDD(startDay, startMonth, startYear);
      const dbSettlementEndDate = formatDateYYToYYYYMMDD(endDay, endMonth, endYear);
      const dbAppendixDate = formatDateYYToYYYYMMDD(day, month, year); // `day`, `month`, `year` з contractData це для appendix

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
        dbAppendixDate, address, // `address` from contractData is appendix_address
        dormManagerName, // `dormManagerName` from contractData is appendix dormManagerName
        residentName, // `residentName` from contractData is appendix residentName
        premisesNumber, premisesArea,
        dataProcessingConsent, contractTermsConsent, dataAccuracyConsent
      ];

      const [contractResult] = await connection.execute(contractQuery, params);
      const contractId = contractResult.insertId;

      if (inventory && Array.isArray(inventory) && inventory.length > 0) {
        const inventoryQuery = `INSERT INTO settlement_contract_inventory (contract_id, item_name, quantity, note, item_order) VALUES ?`;
        const inventoryValues = inventory.map((item, index) => [contractId, item.name || null, item.quantity || null, item.note || null, index]);
        // Перевіряємо, чи є хоча б один елемент з даними (крім contract_id та item_order)
        if (inventoryValues.some(valArray => valArray.slice(1, -1).some(v => v !== null && v !== ''))) {
          await connection.query(inventoryQuery, [inventoryValues]);
        }
      }

      if (premisesConditions && Array.isArray(premisesConditions) && premisesConditions.length > 0) {
        const conditionsQuery = `INSERT INTO settlement_contract_premises_conditions (contract_id, description, condition_status, item_order) VALUES ?`;
        const conditionsValues = premisesConditions.map((item, index) => [contractId, item.description || null, item.condition || null, index]);
         if (conditionsValues.some(valArray => valArray.slice(1, -1).some(v => v !== null && v !== ''))) {
            await connection.query(conditionsQuery, [conditionsValues]);
         }
      }

      if (electricalAppliances && Array.isArray(electricalAppliances) && electricalAppliances.length > 0) {
        const appliancesQuery = `INSERT INTO settlement_contract_electrical_appliances (contract_id, appliance_name, brand, manufacture_year, quantity, note, item_order) VALUES ?`;
        const appliancesValues = electricalAppliances.map((item, index) => [contractId, item.name || null, item.brand || null, item.year || null, item.quantity || null, item.note || null, index]);
        if (appliancesValues.some(valArray => valArray.slice(1, -1).some(v => v !== null && v !== ''))) {
            await connection.query(appliancesQuery, [appliancesValues]);
        }
      }

      await connection.commit();
      return contractId;
    } catch (error) {
      await connection.rollback();
      console.error("[SettlementContractModel] Error in create:", error);
      throw error; // Повторно кидаємо помилку, щоб контролер міг її обробити
    } finally {
      connection.release();
    }
  }
}