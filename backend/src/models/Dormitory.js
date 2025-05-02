// backend/src/models/Dormitory.js
import pool from "../config/db.js";

const Dormitory = {
  async findAll() {
    const [rows] = await pool.execute(`SELECT * FROM dormitories`);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM dormitories WHERE id = ?`, [id]);
    return rows[0] || null;
  }
};

export default Dormitory;