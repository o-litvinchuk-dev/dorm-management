import pool from "../config/db.js";

const UserProfile = {
  async create(user_id) {
    const [result] = await pool.execute(
      `INSERT INTO user_profiles (user_id) VALUES (?)`,
      [user_id]
    );
    return result.insertId;
  },

  async findByUserId(user_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM user_profiles WHERE user_id = ?`,
      [user_id]
    );
    return rows[0] || null;
  },

  async update(user_id, { faculty_id, group_name, course, phone }) {
    const [result] = await pool.execute(
      `UPDATE user_profiles 
       SET faculty_id = ?, group_name = ?, course = ?, phone = ? 
       WHERE user_id = ?`,
      [faculty_id || null, group_name || null, course || null, phone || null, user_id]
    );
    return result.affectedRows > 0;
  },
};

export default UserProfile;