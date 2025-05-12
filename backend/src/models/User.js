import pool from "../config/db.js";

const User = {
  async create({
    email,
    password,
    role = "student",
    isVerified = false,
    name = null,
    avatar = null,
    provider = "local",
    google_id = null,
    token_version = 0,
    faculty_id = null,
    dormitory_id = null,
  }) {
    // Validate role
    const validRoles = [
      "student",
      "admin",
      "superadmin",
      "faculty_dean_office",
      "dorm_manager",
      "student_council_head",
      "student_council_member",
    ];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    const [result] = await pool.execute(
      `INSERT INTO users (email, password, role, isVerified, name, avatar, provider, google_id, token_version, faculty_id, dormitory_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        password,
        role,
        isVerified,
        name,
        avatar,
        provider,
        google_id,
        token_version,
        faculty_id,
        dormitory_id,
      ]
    );

    const userId = result.insertId;

    if (!name) {
      await pool.execute(`UPDATE users SET name = ? WHERE id = ?`, [
        userId.toString(),
        userId,
      ]);
    }

    return await this.findById(userId);
  },

  async updateFacultyId(id, faculty_id) {
    const [result] = await pool.execute(
      `UPDATE users SET faculty_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [faculty_id || null, id]
    );
    return result.affectedRows > 0;
  },

  async updateDormitoryId(id, dormitory_id) {
    const [result] = await pool.execute(
      `UPDATE users SET dormitory_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [dormitory_id || null, id]
    );
    return result.affectedRows > 0;
  },

  async findByFacultyId(faculty_id) {
    const [rows] = await pool.execute(
      `SELECT id, email, role, name, avatar, token_version, faculty_id, dormitory_id 
       FROM users WHERE faculty_id = ?`,
      [faculty_id]
    );
    return rows;
  },

  async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        `SELECT id, email, password, role, isVerified, name, avatar, provider, google_id, token_version, faculty_id, dormitory_id 
         FROM users WHERE email = ?`,
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Помилка пошуку користувача:", error);
      throw error;
    }
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, email, role, name, avatar, token_version, faculty_id, dormitory_id 
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByGoogleId(google_id) {
    try {
      const [rows] = await pool.execute(
        `SELECT id, email, role, isVerified, name, avatar, provider, google_id, faculty_id, dormitory_id 
         FROM users WHERE google_id = ?`,
        [google_id]
      );
      return rows[0];
    } catch (error) {
      console.error("Помилка пошуку користувача через Google ID:", error);
      throw error;
    }
  },

  async verifyUser(id) {
    try {
      await pool.execute(
        `UPDATE users SET isVerified = 1 WHERE id = ?`,
        [id]
      );
      return true;
    } catch (error) {
      console.error("Помилка верифікації:", error);
      throw error;
    }
  },

  async updatePassword(id, newPassword) {
    const connection = await pool.getConnection();
    console.log(`[User Model] Початок оновлення пароля для ID: ${id}`);

    try {
      await connection.beginTransaction();
      console.log("[User Model] Транзакція розпочата");

      const [user] = await connection.execute(
        `SELECT id FROM users WHERE id = ?`,
        [id]
      );

      if (user.length === 0) {
        console.error(`[User Model] Користувач ${id} не знайдений`);
        throw new Error("Користувача не знайдено");
      }

      const [result] = await connection.execute(
        `UPDATE users 
         SET password = ?, token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newPassword, id]
      );

      await connection.commit();
      return result;
    } catch (error) {
      console.error("[User Model] Помилка при оновленні пароля:", error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateProfileCompletionStatus(id, isComplete) {
    try {
      const [result] = await pool.execute(
        `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [isComplete ? 1 : 0, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("[User Model] Помилка оновлення is_profile_complete:", error);
      throw error;
    }
  },

  async incrementTokenVersion(id) {
    await pool.execute(
      `UPDATE users 
       SET token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [id]
    );
    const [rows] = await pool.execute(
      `SELECT token_version FROM users WHERE id = ?`,
      [id]
    );
    return rows[0].token_version;
  },
};

export default User;