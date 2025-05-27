import pool from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

class DormitoryPass {
    static async create({
        user_id,
        source_type,
        source_id,
        dormitory_id,
        room_id,
        room_number_text,
        valid_from,
        valid_until,
        issued_by,
        status = 'active'
    }) {
        const pass_identifier = uuidv4();
        const query = `
            INSERT INTO dormitory_passes (
                user_id, source_type, source_id, dormitory_id, room_id, room_number_text,
                valid_from, valid_until, pass_identifier, issued_by, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const [result] = await pool.execute(query, [
            user_id, source_type, source_id, dormitory_id, room_id, room_number_text,
            valid_from, valid_until, pass_identifier, issued_by, status
        ]);
        return result.insertId;
    }

    static async findActiveByUserId(userId) {
        const query = `
            SELECT dp.*,
                   u.name as student_name, u.avatar as student_avatar,
                   f.name as faculty_name,
                   d.name as dormitory_name,
                   COALESCE(r.number, dp.room_number_text) as room_display_number
            FROM dormitory_passes dp
            JOIN users u ON dp.user_id = u.id
            LEFT JOIN faculties f ON u.faculty_id = f.id /* Assumes faculty_id is on users table */
            JOIN dormitories d ON dp.dormitory_id = d.id
            LEFT JOIN rooms r ON dp.room_id = r.id
            WHERE dp.user_id = ? AND dp.status = 'active' AND dp.valid_until >= CURDATE()
            ORDER BY dp.valid_until DESC, dp.created_at DESC
            LIMIT 1
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows[0] || null;
    }

    static async findByIdentifierPublic(passIdentifier) {
        const query = `
            SELECT
                u.name as student_name,
                u.avatar as student_avatar,
                f.name as faculty_name,
                d.name as dormitory_name,
                COALESCE(r.number, dp.room_number_text) as room_display_number,
                DATE_FORMAT(dp.valid_until, '%Y-%m-%d') as valid_until,
                dp.status
            FROM dormitory_passes dp
            JOIN users u ON dp.user_id = u.id
            LEFT JOIN faculties f ON u.faculty_id = f.id
            JOIN dormitories d ON dp.dormitory_id = d.id
            LEFT JOIN rooms r ON dp.room_id = r.id
            WHERE dp.pass_identifier = ?
        `;
        const [rows] = await pool.execute(query, [passIdentifier]);
        return rows[0] || null;
    }

    static async findExistingPass(user_id, dormitory_id, valid_until_date, room_id = null, room_number_text = null) {
        let query = `
            SELECT id, pass_identifier, room_id, room_number_text, valid_from, valid_until, status FROM dormitory_passes
            WHERE user_id = ?
              AND dormitory_id = ?
              AND valid_until = ?
              AND status = 'active'
        `;
        const params = [user_id, dormitory_id, valid_until_date];

        if(room_id) {
            query += ` AND room_id = ?`;
            params.push(room_id);
        } else if (room_number_text) {
            query += ` AND room_number_text = ?`;
            params.push(room_number_text);
        }
        query += ` LIMIT 1`;
        
        const [rows] = await pool.execute(query, params);
        return rows[0] || null;
    }

    static async updatePass(passId, { room_id, room_number_text, valid_from, valid_until, status, source_id, source_type }) {
        const fields = [];
        const values = [];

        if (room_id !== undefined) { fields.push("room_id = ?"); values.push(room_id); }
        if (room_number_text !== undefined) { fields.push("room_number_text = ?"); values.push(room_number_text); }
        if (valid_from !== undefined) { fields.push("valid_from = ?"); values.push(valid_from); }
        if (valid_until !== undefined) { fields.push("valid_until = ?"); values.push(valid_until); }
        if (status !== undefined) { fields.push("status = ?"); values.push(status); }
        if (source_id !== undefined) { fields.push("source_id = ?"); values.push(source_id); }
        if (source_type !== undefined) { fields.push("source_type = ?"); values.push(source_type); }


        if (fields.length === 0) return false; // No fields to update

        const query = `UPDATE dormitory_passes SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`;
        values.push(passId);
        const [result] = await pool.execute(query, values);
        return result.affectedRows > 0;
    }

    static async revokePass(passId, adminUserId) {
        const query = `UPDATE dormitory_passes SET status = 'revoked', issued_by = ?, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.execute(query, [adminUserId, passId]);
        return result.affectedRows > 0;
    }
}

export default DormitoryPass;