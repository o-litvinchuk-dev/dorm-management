import pool from "../config/db.js";

const SettlementScheduleEntry = {
    async create({ title, description, start_date, end_date, target_group_type, target_group_id, location, color_tag, created_by }) {
        const query = `
        INSERT INTO settlement_schedule_entries
        (title, description, start_date, end_date, target_group_type, target_group_id, location, color_tag, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [
        title, description || null, start_date, end_date || null, target_group_type || 'all',
        target_group_id || null, location || null, color_tag || null, created_by
        ]);
        return result.insertId;
    },

    async findAll(filters = {}) {
        let query = `
            SELECT
                sse.*,
                u.name as creator_name,
                f.name as faculty_name,
                d.name as dormitory_name,
                g.name as group_name_for_target 
            FROM settlement_schedule_entries sse
            LEFT JOIN users u ON sse.created_by = u.id
            LEFT JOIN faculties f ON sse.target_group_type = 'faculty' AND sse.target_group_id = f.id
            LEFT JOIN dormitories d ON sse.target_group_type = 'dormitory' AND sse.target_group_id = d.id
            LEFT JOIN \`groups\` g ON sse.target_group_type = 'group' AND sse.target_group_id = g.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.dateFrom) {
            query += " AND DATE(sse.start_date) >= ?";
            params.push(filters.dateFrom);
        }
        if (filters.dateTo) {
            query += " AND DATE(sse.start_date) <= ?";
            params.push(filters.dateTo);
        }

        // Admin route specific filtering (scoped admins)
        if (filters.restrict_to_faculty_id) {
            query += ` AND (
                            (sse.target_group_type = 'faculty' AND sse.target_group_id = ?) OR
                            (sse.target_group_type = 'course') OR 
                            (sse.target_group_type = 'group' AND g.faculty_id = ?) OR 
                            (sse.target_group_type = 'all')
                        )`;
            params.push(filters.restrict_to_faculty_id, filters.restrict_to_faculty_id);
        } else if (filters.restrict_to_dormitory_id) {
            query += ` AND (
                            (sse.target_group_type = 'dormitory' AND sse.target_group_id = ?) OR
                            (sse.target_group_type = 'all')
                        )`;
            params.push(filters.restrict_to_dormitory_id);
        }
        // Public/Student route specific filtering (if user_context is passed)
        else if (filters.user_context) {
            const orConditions = ["sse.target_group_type = 'all'"];
            const userCtx = filters.user_context;
            if (userCtx.faculty_id) {
                orConditions.push("(sse.target_group_type = 'faculty' AND sse.target_group_id = ?)");
                params.push(userCtx.faculty_id);
            }
            if (userCtx.course) {
                orConditions.push("(sse.target_group_type = 'course' AND sse.target_group_id = ?)");
                params.push(userCtx.course);
            }
            if (userCtx.group_id) {
                orConditions.push("(sse.target_group_type = 'group' AND sse.target_group_id = ?)");
                params.push(userCtx.group_id);
            }
            if (userCtx.dormitory_id) {
                orConditions.push("(sse.target_group_type = 'dormitory' AND sse.target_group_id = ?)");
                params.push(userCtx.dormitory_id);
            }
            query += ` AND (${orConditions.join(' OR ')})`;
        } else {
            // For unauthenticated public access, only show 'all' targeted entries
            query += " AND sse.target_group_type = 'all'";
        }

        query += " ORDER BY sse.start_date ASC";
        const [rows] = await pool.execute(query, params);
        return rows;
    },

    async findById(id) {
        const query = `
            SELECT
                sse.*,
                u.name as creator_name,
                f.name as faculty_name,
                d.name as dormitory_name,
                g.name as group_name_for_target,
                gf.id as group_faculty_id_for_validation  
            FROM settlement_schedule_entries sse
            LEFT JOIN users u ON sse.created_by = u.id
            LEFT JOIN faculties f ON sse.target_group_type = 'faculty' AND sse.target_group_id = f.id
            LEFT JOIN dormitories d ON sse.target_group_type = 'dormitory' AND sse.target_group_id = d.id
            LEFT JOIN \`groups\` g ON sse.target_group_type = 'group' AND sse.target_group_id = g.id
            LEFT JOIN faculties gf ON g.faculty_id = gf.id 
            WHERE sse.id = ?
        `;
        const [rows] = await pool.execute(query, [id]);
        if (rows[0] && rows[0].target_group_type === 'group') {
            rows[0].target_faculty_for_group_id = rows[0].group_faculty_id_for_validation;
        }
        return rows[0] || null;
    },

    async update(id, { title, description, start_date, end_date, target_group_type, target_group_id, location, color_tag }) {
        const query = `
        UPDATE settlement_schedule_entries
        SET title = ?, description = ?, start_date = ?, end_date = ?, 
            target_group_type = ?, target_group_id = ?, location = ?, color_tag = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `;
        const [result] = await pool.execute(query, [
        title, description || null, start_date, end_date || null, 
        target_group_type || 'all', 
        (target_group_type === 'all' || !target_group_id) ? null : Number(target_group_id), 
        location || null, color_tag || null, 
        id
        ]);
        return result.affectedRows > 0;
    },

    async delete(id) {
        const query = "DELETE FROM settlement_schedule_entries WHERE id = ?";
        const [result] = await pool.execute(query, [id]);
        return result.affectedRows > 0;
    },
};

export default SettlementScheduleEntry;