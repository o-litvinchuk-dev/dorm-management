import pool from "../config/db.js";

const Faculties = {
  async create({ name }) {
    const [result] = await pool.execute(
      `INSERT INTO faculties (name) VALUES (?)`,
      [name]
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await pool.execute(`SELECT * FROM faculties`);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM faculties WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  async update(id, { name }) {
    const [result] = await pool.execute(
      `UPDATE faculties SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.execute(`DELETE FROM faculties WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },
};

export default Faculties;