import pool from "../config/db.js";

const FacultyDormitories = {
  async create({ faculty_id, dormitory_id, quota }) {
    const query = `
      INSERT INTO faculty_dormitories (faculty_id, dormitory_id, quota, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    try {
      const [result] = await pool.execute(query, [faculty_id, dormitory_id, quota || null]);
      return result.insertId;
    } catch (error) {
      console.error("[FacultyDormitories] Error in create:", error);
      throw error;
    }
  },

  async findAll() {
    const query = `
      SELECT fd.*, f.name AS faculty_name, d.name AS dormitory_name
      FROM faculty_dormitories fd
      LEFT JOIN faculties f ON fd.faculty_id = f.id
      LEFT JOIN dormitories d ON fd.dormitory_id = d.id
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  async findByFacultyId(faculty_id) {
    const query = `
      SELECT fd.*, d.name AS dormitory_name
      FROM faculty_dormitories fd
      LEFT JOIN dormitories d ON fd.dormitory_id = d.id
      WHERE fd.faculty_id = ?
    `;
    const [rows] = await pool.execute(query, [faculty_id]);
    return rows;
  },

  async findById(faculty_id, dormitory_id) {
    const query = `
      SELECT * FROM faculty_dormitories
      WHERE faculty_id = ? AND dormitory_id = ?
    `;
    const [rows] = await pool.execute(query, [faculty_id, dormitory_id]);
    return rows[0] || null;
  },

  async update(faculty_id, dormitory_id, { quota }) {
    const query = `
      UPDATE faculty_dormitories
      SET quota = ?, updated_at = CURRENT_TIMESTAMP
      WHERE faculty_id = ? AND dormitory_id = ?
    `;
    const [result] = await pool.execute(query, [quota || null, faculty_id, dormitory_id]);
    return result.affectedRows > 0;
  },

  async delete(faculty_id, dormitory_id) {
    const query = `
      DELETE FROM faculty_dormitories
      WHERE faculty_id = ? AND dormitory_id = ?
    `;
    const [result] = await pool.execute(query, [faculty_id, dormitory_id]);
    return result.affectedRows > 0;
  },
};

export default FacultyDormitories;