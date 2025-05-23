import pool from "../config/db.js";

const Room = {
  async create({ dormitory_id, number, capacity }) {
    const [result] = await pool.execute(
      `INSERT INTO rooms (dormitory_id, number, capacity) VALUES (?, ?, ?)`,
      [dormitory_id, number, capacity]
    );
    return result.insertId;
  },

  async findAllByDormitoryId(dormitory_id) {
    const [rows] = await pool.execute(
      `SELECT id, number, capacity, dormitory_id FROM rooms WHERE dormitory_id = ?`,
      [dormitory_id]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, number, capacity, dormitory_id FROM rooms WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async update(id, { number, capacity }) {
    const [result] = await pool.execute(
      `UPDATE rooms SET number = ?, capacity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [number, capacity, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.execute(`DELETE FROM rooms WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },
};

export default Room;