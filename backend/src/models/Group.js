// backend/src/models/Group.js
import pool from "../config/db.js";

const Group = {
  async create({ faculty_id, name, course }) { // Додано course
    const [result] = await pool.execute(
      `INSERT INTO \`groups\` (faculty_id, name, course, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      [faculty_id, name, course]
    );
    return result.insertId;
  },

  async findAllByFacultyId(faculty_id) {
    const [rows] = await pool.execute(
      `SELECT id, name, course, faculty_id, created_at, updated_at FROM \`groups\` WHERE faculty_id = ? ORDER BY course, name`,
      [faculty_id]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, name, course, faculty_id, created_at, updated_at FROM \`groups\` WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async update(id, { name, course }) { // Додано course
    const [result] = await pool.execute(
      `UPDATE \`groups\` SET name = ?, course = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, course, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.execute(`DELETE FROM \`groups\` WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },
};

export default Group;