// src/models/Dormitory.js
import pool from "../config/db.js";

const Dormitory = {
  async create({ name, address, capacity }) {
    const query = `
      INSERT INTO dormitories (name, address, capacity, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    try {
      const [result] = await pool.execute(query, [name, address || null, capacity || null]);
      return result.insertId;
    } catch (error) {
      console.error("[DormitoryModel] Error in create:", error);
      throw error;
    }
  },

  async findAll() {
    const query = `
      SELECT d.id, d.name, d.address, d.capacity, d.created_at, d.updated_at, d.manager_user_id, u.name as manager_name
      FROM dormitories d
      LEFT JOIN users u ON d.manager_user_id = u.id
      ORDER BY d.name ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT d.id, d.name, d.address, d.capacity, d.created_at, d.updated_at, d.manager_user_id, u.name as manager_name
      FROM dormitories d
      LEFT JOIN users u ON d.manager_user_id = u.id
      WHERE d.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  },

  async update(id, { name, address, capacity }) {
    const query = `
      UPDATE dormitories
      SET name = ?, address = ?, capacity = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name, address || null, capacity || null, id]);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const query = `
      DELETE FROM dormitories
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },
};

export default Dormitory;