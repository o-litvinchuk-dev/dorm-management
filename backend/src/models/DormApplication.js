import pool from "../config/db.js";

const DormApplication = {
    async create(data) {
        const { user_id, name, surname, faculty, course } = data;
        const [result] = await pool.execute(
            `INSERT INTO dorm_applications (user_id, name, surname, faculty, course) VALUES (?, ?, ?, ?, ?)`,
            [user_id, name, surname, faculty, course]
        );
        return result.insertId;
    },

    async findAll() {
        const [rows] = await pool.execute(`SELECT * FROM dorm_applications`);
        return rows;
    }
};

export default DormApplication;