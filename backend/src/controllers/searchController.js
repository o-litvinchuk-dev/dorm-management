import pool from "../config/db.js";

export const globalSearch = async (req, res) => {
    const { q } = req.query;
    const { role } = req.user;

    if (!q || q.trim().length < 2) {
        return res.json({ users: [], dormitories: [], faculties: [] });
    }

    const searchTerm = `%${q}%`;
    const connection = await pool.getConnection();

    try {
        const canSearchUsers = ['admin', 'superadmin', 'faculty_dean_office', 'dorm_manager'].includes(role);
        
        const userQuery = canSearchUsers 
            ? `SELECT id, name, email, role FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 5` 
            : `SELECT 1 FROM DUAL WHERE 1=0`;
        
        const userParams = canSearchUsers ? [searchTerm, searchTerm] : [];

        const queries = [
            connection.query(userQuery, userParams),
            connection.query(`SELECT id, name, address FROM dormitories WHERE name LIKE ? OR address LIKE ? LIMIT 5`, [searchTerm, searchTerm]),
            connection.query(`SELECT id, name FROM faculties WHERE name LIKE ? LIMIT 5`, [searchTerm])
        ];

        const [userResults, dormitoryResults, facultyResults] = await Promise.all(queries);

        res.json({
            users: userResults[0],
            dormitories: dormitoryResults[0],
            faculties: facultyResults[0],
        });

    } catch (error) {
        console.error("[GlobalSearch] Помилка пошуку:", error);
        res.status(500).json({ error: "Помилка сервера під час пошуку" });
    } finally {
        connection.release();
    }
};