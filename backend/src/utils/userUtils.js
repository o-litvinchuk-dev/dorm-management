import pool from "../config/db.js";

export const getUserDormNumber = async (userId) => {
  try {
    const [rows] = await pool.query(
      "SELECT dormitory FROM user_profiles WHERE user_id = ?",
      [userId]
    );
    return rows[0]?.dormitory || null;
  } catch (error) {
    console.error("[UserUtils] Error in getUserDormNumber:", error);
    throw error;
  }
};