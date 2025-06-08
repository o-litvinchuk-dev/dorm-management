import pool from "../config/db.js";

const formatDateToYYYYMMDD = (dateString) => {
    if (!dateString || dateString === "0000-00-00") {
        return null;
    }
    try {
        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) {
            console.warn(`[formatDateToYYYYMMDD] Received Invalid Date object or string: ${dateString}`);
            return null;
        }
        // Використовуємо UTC, щоб уникнути проблем з часовими поясами
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error(`[formatDateToYYYYMMDD] Error parsing date string: ${dateString}`, e);
        return null;
    }
};

class DormitoryApplicationPreset {
    static async create({
        dormitory_id,
        faculty_id,
        academic_year,
        start_date,
        end_date,
        default_comments,
        created_by,
        is_active = true,
    }) {
        const query = `
            INSERT INTO dormitory_application_presets
            (dormitory_id, faculty_id, academic_year, start_date, end_date, default_comments, created_by, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [
            dormitory_id,
            faculty_id || null,
            academic_year,
            start_date || null,
            end_date || null,
            default_comments || null,
            created_by || null,
            is_active ? 1 : 0,
        ]);
        return result.insertId;
    }

    static async findById(id) {
        const query = `
            SELECT dap.id, dap.dormitory_id, dap.faculty_id, dap.academic_year, dap.start_date, dap.end_date, 
                   dap.default_comments, dap.created_by, dap.created_at, dap.updated_at, dap.is_active,
                   d.name as dormitory_name, f.name as faculty_name
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
                is_active: !!row.is_active,
            };
        }
        return null;
    }

    static async findByDormitoryAndAcademicYear(dormitory_id, academic_year, faculty_id = null) {
        let query = `
            SELECT dap.id, dap.dormitory_id, dap.faculty_id, dap.academic_year, dap.start_date, dap.end_date, 
                   dap.default_comments, dap.created_by, dap.created_at, dap.updated_at, dap.is_active,
                   d.name as dormitory_name, f.name as faculty_name
            FROM dormitory_application_presets dap
            JOIN dormitories d ON dap.dormitory_id = d.id
            LEFT JOIN faculties f ON dap.faculty_id = f.id
            WHERE dap.dormitory_id = ? AND dap.academic_year = ? AND dap.is_active = 1
        `;

        const params = [dormitory_id, academic_year];
        
        if (faculty_id) {
            query += ' AND (dap.faculty_id = ? OR dap.faculty_id IS NULL)';
            params.push(faculty_id);
            query += ` ORDER BY dap.faculty_id IS NULL ASC, dap.created_at DESC LIMIT 1`;
        } else {
            query += ' AND dap.faculty_id IS NULL';
            query += ` ORDER BY dap.created_at DESC LIMIT 1`;
        }

        const [rows] = await pool.execute(query, params);
        if (rows[0]) {
            const row = rows[0];
            return {
                ...row,
                start_date: formatDateToYYYYMMDD(row.start_date),
                end_date: formatDateToYYYYMMDD(row.end_date),
                is_active: !!row.is_active,
            };
        }
        return null;
    }

    static async findByFacultyOrGlobal(faculty_id, dormitory_id = null) {
        let query = `
            SELECT dap.id, dap.dormitory_id, dap.faculty_id, dap.academic_year, dap.start_date, dap.end_date, 
                   dap.default_comments, dap.created_by, dap.created_at, dap.updated_at, dap.is_active,
                   d.name as dormitory_name, f.name as faculty_name
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
        if (dormitory_id) {
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
            is_active: !!row.is_active,
        }));
    }

    static async findByDormitoryAndNotFacultySpecific(dormitory_id) {
        const query = `
            SELECT dap.id, dap.dormitory_id, dap.faculty_id, dap.academic_year, dap.start_date, dap.end_date, 
                   dap.default_comments, dap.created_by, dap.created_at, dap.updated_at, dap.is_active,
                   d.name as dormitory_name, f.name as faculty_name
            FROM dormitory_application_presets dap
            JOIN dormitories d ON dap.dormitory_id = d.id
            LEFT JOIN faculties f ON dap.faculty_id = f.id 
            WHERE dap.dormitory_id = ? AND dap.faculty_id IS NULL
            ORDER BY dap.academic_year DESC
        `;
        const [rows] = await pool.execute(query, [dormitory_id]);
        return rows.map(row => ({
            ...row,
            start_date: formatDateToYYYYMMDD(row.start_date),
            end_date: formatDateToYYYYMMDD(row.end_date),
            is_active: !!row.is_active,
        }));
    }
    
    static async findAllWithFilters(filters) {
        let query = `
        SELECT dap.id, dap.dormitory_id, dap.faculty_id, dap.academic_year, dap.start_date, dap.end_date,
        dap.default_comments, dap.created_by, dap.created_at, dap.updated_at, dap.is_active,
        d.name as dormitory_name, f.name as faculty_name
        FROM dormitory_application_presets dap
        JOIN dormitories d ON dap.dormitory_id = d.id
        LEFT JOIN faculties f ON dap.faculty_id = f.id
        `;
        let countQuery = `
        SELECT COUNT(dap.id) as total
        FROM dormitory_application_presets dap
        JOIN dormitories d ON dap.dormitory_id = d.id
        LEFT JOIN faculties f ON dap.faculty_id = f.id
        `;
        
        const whereClauses = [];
        const params = [];

        if (filters.dormitory_id_for_filter) { // Для Коменданта
            whereClauses.push("dap.dormitory_id = ? AND dap.faculty_id IS NULL");
            params.push(filters.dormitory_id_for_filter);
        } else if (filters.faculty_id_for_filter) { // Для Деканату
             whereClauses.push("(dap.faculty_id = ? OR dap.faculty_id IS NULL)");
            params.push(filters.faculty_id_for_filter);
        } else { // Для Адміна/Суперадміна
             if (filters.dormitory_id) {
                whereClauses.push("dap.dormitory_id = ?");
                params.push(filters.dormitory_id);
            }
            if (filters.faculty_id) {
                whereClauses.push("dap.faculty_id = ?");
                params.push(filters.faculty_id);
            }
        }

        if (filters.academic_year) {
            whereClauses.push("dap.academic_year LIKE ?");
            params.push(`%${filters.academic_year}%`);
        }
        if (filters.is_active !== '' && filters.is_active !== null && filters.is_active !== undefined) {
            whereClauses.push("dap.is_active = ?");
            params.push(filters.is_active === 'true' ? 1 : 0);
        }

        if (whereClauses.length > 0) {
            const whereString = ` WHERE ${whereClauses.join(' AND ')}`;
            query += whereString;
            countQuery += whereString;
        }

        const validSortFields = {
            id: 'dap.id', dormitory_name: 'd.name', faculty_name: 'f.name', 
            academic_year: 'dap.academic_year', start_date: 'dap.start_date', 
            end_date: 'dap.end_date', is_active: 'dap.is_active'
        };
        const sortBy = validSortFields[filters.sortBy] || 'dap.academic_year';
        const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${sortBy} ${sortOrder}`;
        
        const limit = Number(filters.limit) || 10;
        const page = Number(filters.page) || 1;
        const offset = (page - 1) * limit;
        query += ` LIMIT ${limit} OFFSET ${offset}`;
        
        const [rows] = await pool.execute(query, params);
        const [[{ total }]] = await pool.execute(countQuery, params);

        return { 
            presets: rows.map(row => ({
                ...row,
                start_date: formatDateToYYYYMMDD(row.start_date),
                end_date: formatDateToYYYYMMDD(row.end_date),
                is_active: !!row.is_active,
            })),
            total,
            page,
            limit,
        };
    }

    static async update(id, {
        dormitory_id,
        faculty_id,
        academic_year,
        start_date,
        end_date,
        default_comments,
        is_active,
    }) {
        const fieldsToUpdate = [];
        const params = [];

        if (dormitory_id !== undefined) { fieldsToUpdate.push("dormitory_id = ?"); params.push(dormitory_id); }
        if (faculty_id !== undefined) { fieldsToUpdate.push("faculty_id = ?"); params.push(faculty_id); }
        if (academic_year !== undefined) { fieldsToUpdate.push("academic_year = ?"); params.push(academic_year); }
        if (start_date !== undefined) { fieldsToUpdate.push("start_date = ?"); params.push(start_date); }
        if (end_date !== undefined) { fieldsToUpdate.push("end_date = ?"); params.push(end_date); }
        if (default_comments !== undefined) { fieldsToUpdate.push("default_comments = ?"); params.push(default_comments); }
        if (is_active !== undefined) { fieldsToUpdate.push("is_active = ?"); params.push(is_active ? 1 : 0); }
        
        if (fieldsToUpdate.length === 0) return false;

        const query = `
            UPDATE dormitory_application_presets
            SET ${fieldsToUpdate.join(", ")}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        params.push(id);
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const query = "DELETE FROM dormitory_application_presets WHERE id = ?";
        const [result] = await pool.execute(query, [id]);
        return result.affectedRows > 0;
    }
}

export default DormitoryApplicationPreset;