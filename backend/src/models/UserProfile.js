// src/models/UserProfile.js

import pool from "../config/db.js";

const UserProfile = {
  async create(user_id) {
    // Залишається без змін, banner додається через update
    const [result] = await pool.execute(
      `INSERT INTO user_profiles (user_id) VALUES (?)`,
      [user_id]
    );
    return result.insertId;
  },
  
  async findByUserId(user_id, connection = pool) {
    // ЗМІНА: Додано banner до SELECT
    const [rows] = await connection.execute(
      `SELECT * FROM user_profiles WHERE user_id = ?`,
      [user_id]
    );
    return rows[0] || null;
  },

  async update(user_id, { faculty_id, group_id, course, phone, banner }) {
    const fieldsToUpdate = [];
    const values = [];

    if (faculty_id !== undefined) { fieldsToUpdate.push("faculty_id = ?"); values.push(faculty_id || null); }
    if (group_id !== undefined) { fieldsToUpdate.push("group_id = ?"); values.push(group_id || null); }
    if (course !== undefined) { fieldsToUpdate.push("course = ?"); values.push(course || null); }
    if (phone !== undefined) { fieldsToUpdate.push("phone = ?"); values.push(phone || null); }
    if (banner !== undefined) { fieldsToUpdate.push("banner = ?"); values.push(banner || null); }

    if (fieldsToUpdate.length === 0) return false;

    const query = `UPDATE user_profiles SET ${fieldsToUpdate.join(", ")} WHERE user_id = ?`;
    values.push(user_id);

    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  },
};

export default UserProfile;