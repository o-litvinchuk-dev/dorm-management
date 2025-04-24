import pool from "../config/db.js";

const Notification = {
  async create({ user_id, title, description }) {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, title, description, \`read\`) 
       VALUES (?, ?, ?, 0)`,
      [user_id, title, description]
    );
    return result.insertId;
  },

  async findByUserId(user_id) {
    const [rows] = await pool.execute(
      `SELECT id, title, description, created_at, \`read\` 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [user_id]
    );
    return rows;
  },

  async markAsRead(id, user_id) {
    const [result] = await pool.execute(
      `UPDATE notifications SET \`read\` = 1 WHERE id = ? AND user_id = ?`,
      [id, user_id]
    );
    return result.affectedRows > 0;
  },

  async delete(id, user_id) {
    const [result] = await pool.execute(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [id, user_id]
    );
    return result.affectedRows > 0;
  },
};

export default Notification;