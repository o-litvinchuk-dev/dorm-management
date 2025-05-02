// backend/src/models/Settlement.js
import pool from "../config/db.js";

const Settlement = {
  async findAll() {
    const [rows] = await pool.execute(`SELECT * FROM settlements`);
    return rows;
  },

  async create({ user_id, dormitory_id, settlement_date }) {
    const [result] = await pool.execute(
      `INSERT INTO settlements (user_id, dormitory_id, settlement_date) VALUES (?, ?, ?)`,
      [user_id, dormitory_id, settlement_date]
    );
    return result.insertId;
  }
};

export default Settlement;