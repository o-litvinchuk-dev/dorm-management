import pool from "../config/db.js";

const FacultyDormitories = {
  async create({ faculty_id, dormitory_id, quota }) {
    const [result] = await pool.execute(
      `INSERT INTO faculty_dormitories (faculty_id, dormitory_id, quota) VALUES (?, ?, ?)`,
      [faculty_id, dormitory_id, quota || null]
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await pool.execute(`SELECT * FROM faculty_dormitories`);
    return rows;
  },

  async findByFacultyId(faculty_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM faculty_dormitories WHERE faculty_id = ?`,
      [faculty_id]
    );
    return rows;
  },

  async findById(faculty_id, dormitory_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM faculty_dormitories WHERE faculty_id = ? AND dormitory_id = ?`,
      [faculty_id, dormitory_id]
    );
    return rows[0] || null;
  },

  async update(faculty_id, dormitory_id, { quota }) {
    const [result] = await pool.execute(
      `UPDATE faculty_dormitories SET quota = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE faculty_id = ? AND dormitory_id = ?`,
      [quota || null, faculty_id, dormitory_id]
    );
    return result.affectedRows > 0;
  },

  async delete(faculty_id, dormitory_id) {
    const [result] = await pool.execute(
      `DELETE FROM faculty_dormitories WHERE faculty_id = ? AND dormitory_id = ?`,
      [faculty_id, dormitory_id]
    );
    return result.affectedRows > 0;
  },
};

export default FacultyDormitories;