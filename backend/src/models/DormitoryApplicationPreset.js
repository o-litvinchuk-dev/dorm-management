// backend/src/models/DormitoryApplicationPreset.js

import pool from "../config/db.js";

const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString || dateString === "0000-00-00") {
    return null;
  }
  // With dateStrings: true, dateString should be 'YYYY-MM-DD'
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Check if it's a valid date logically (e.g., not 2023-02-30)
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day) {
        return dateString; // It's already in the correct format and valid
    } else {
        console.warn(`[formatDateToYYYYMMDD] Invalid date logic for YYYY-MM-DD string: ${dateString}`);
        return null;
    }
  } else if (dateString instanceof Date) { // Fallback if it's somehow still a Date object
    if (isNaN(dateString.getTime())) {
        console.warn(`[formatDateToYYYYMMDD] Received Invalid Date object: ${dateString}`);
        return null;
    }
    const year = dateString.getUTCFullYear();
    const month = String(dateString.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateString.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } else if (typeof dateString === 'string' && dateString.includes('T')) { // It's an ISO string with time
    try {
        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) {
             console.warn(`[formatDateToYYYYMMDD] Invalid ISO date string: ${dateString}`);
            return null;
        }
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error(`[formatDateToYYYYMMDD] Error parsing ISO string: ${dateString}`, e);
        return null;
    }
  }
  console.warn(`[formatDateToYYYYMMDD] Unhandled date format or type: ${dateString} (type: ${typeof dateString})`);
  return null;
};

// ... (rest of the class DormitoryApplicationPreset remains the same as in the previous answer, 
//      it will now call this updated formatDateToYYYYMMDD)
// The class methods (findById, findByDormitoryAndAcademicYear, etc.)
// that call formatDateToYYYYMMDD do not need to change.

class DormitoryApplicationPreset {
  static async create({
    dormitory_id,
    faculty_id,
    academic_year,
    start_date,
    end_date,
    application_date,
    default_comments,
    created_by,
  }) {
    const query = `
      INSERT INTO dormitory_application_presets
      (dormitory_id, faculty_id, academic_year, start_date, end_date, application_date, default_comments, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      dormitory_id,
      faculty_id || null,
      academic_year,
      start_date || null,
      end_date || null,
      application_date || null,
      default_comments || null,
      created_by || null,
    ]);
    return result.insertId;
  }

  static async findById(id) {
    const query = `
      SELECT dap.*, d.name as dormitory_name, f.name as faculty_name
      FROM dormitory_application_presets dap
      JOIN dormitories d ON dap.dormitory_id = d.id
      LEFT JOIN faculties f ON dap.faculty_id = f.id
      WHERE dap.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    if (rows[0]) {
      const row = rows[0];
      return {
        ...row,
        start_date: formatDateToYYYYMMDD(row.start_date),
        end_date: formatDateToYYYYMMDD(row.end_date),
        application_date: formatDateToYYYYMMDD(row.application_date),
      };
    }
    return null;
  }

  static async findByDormitoryAndAcademicYear(dormitory_id, academic_year) {
    const query = `
      SELECT dap.*, d.name as dormitory_name, f.name as faculty_name
      FROM dormitory_application_presets dap
      JOIN dormitories d ON dap.dormitory_id = d.id
      LEFT JOIN faculties f ON dap.faculty_id = f.id
      WHERE dap.dormitory_id = ? AND dap.academic_year = ?
      ORDER BY dap.faculty_id IS NULL DESC, dap.created_at DESC 
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [dormitory_id, academic_year]);
    if (rows[0]) {
      const row = rows[0];
      const formattedPreset = {
        ...row,
        start_date: formatDateToYYYYMMDD(row.start_date),
        end_date: formatDateToYYYYMMDD(row.end_date),
        application_date: formatDateToYYYYMMDD(row.application_date),
      };
      console.log('[Model] Preset found and formatted for findByDormitoryAndAcademicYear:', JSON.stringify(formattedPreset));
      return formattedPreset;
    }
    console.log('[Model] No preset found for:', { dormitory_id, academic_year });
    return null;
  }
  
  static async findByFacultyOrGlobal(faculty_id, dormitory_id = null) {
    let query = `
      SELECT dap.*, d.name as dormitory_name, f.name as faculty_name
      FROM dormitory_application_presets dap
      JOIN dormitories d ON dap.dormitory_id = d.id
      LEFT JOIN faculties f ON dap.faculty_id = f.id
    `;
    const params = [];
    const whereClauses = [];

    if (faculty_id) {
      whereClauses.push(`(dap.faculty_id = ? OR dap.faculty_id IS NULL)`);
      params.push(faculty_id);
    }
    if (dormitory_id){
      whereClauses.push(`dap.dormitory_id = ?`);
      params.push(dormitory_id);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    query += ` ORDER BY dap.academic_year DESC, d.name ASC`;
    
    const [rows] = await pool.execute(query, params);
    return rows.map(row => ({
      ...row,
      start_date: formatDateToYYYYMMDD(row.start_date),
      end_date: formatDateToYYYYMMDD(row.end_date),
      application_date: formatDateToYYYYMMDD(row.application_date),
    }));
  }


  static async findAll() {
    const query = `
      SELECT dap.*, d.name as dormitory_name, f.name as faculty_name
      FROM dormitory_application_presets dap
      JOIN dormitories d ON dap.dormitory_id = d.id
      LEFT JOIN faculties f ON dap.faculty_id = f.id
      ORDER BY dap.academic_year DESC, d.name ASC
    `;
    const [rows] = await pool.execute(query);
    return rows.map(row => ({
      ...row,
      start_date: formatDateToYYYYMMDD(row.start_date),
      end_date: formatDateToYYYYMMDD(row.end_date),
      application_date: formatDateToYYYYMMDD(row.application_date),
    }));
  }

  static async update(id, {
    dormitory_id,
    faculty_id,
    academic_year,
    start_date,
    end_date,
    application_date,
    default_comments,
    created_by,
  }) {
    const query = `
      UPDATE dormitory_application_presets
      SET dormitory_id = ?, faculty_id = ?, academic_year = ?, start_date = ?, end_date = ?,
          application_date = ?, default_comments = ?, created_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [
      dormitory_id,
      faculty_id || null,
      academic_year,
      start_date || null, 
      end_date || null,
      application_date || null,
      default_comments || null,
      created_by || null,
      id,
    ]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const query = "DELETE FROM dormitory_application_presets WHERE id = ?";
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default DormitoryApplicationPreset;