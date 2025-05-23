import pool from "../config/db.js";
import Joi from "joi";
import User from "../models/User.js";

const roleAssignmentSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string()
    .valid("faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member")
    .required(),
  facultyId: Joi.number().integer().positive().optional().allow(null),
  dormitoryId: Joi.number().integer().positive().optional().allow(null),
}).unknown(false);

export const assignFacultyDeanOfficeRole = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { email, facultyId } = req.body;
    const { error } = roleAssignmentSchema.validate({ email, role: "faculty_dean_office", facultyId });
    if (error) {
      return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
    }

    // Find user by email
    const [userRows] = await connection.query(`SELECT id, role FROM users WHERE email = ?`, [email]);
    if (!userRows[0]) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }
    const user = userRows[0];

    const [faculty] = await connection.query(`SELECT id FROM faculties WHERE id = ?`, [facultyId]);
    if (!faculty[0]) {
      return res.status(404).json({ error: "Факультет не знайдено" });
    }

    // Check if user already has a significant role
    if (user.role !== "student" && user.role !== null) {
      return res.status(409).json({ error: "Користувач уже має роль", code: "ROLE_CONFLICT" });
    }

    await connection.query(
      `UPDATE users SET role = ?, faculty_id = ?, dormitory_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ["faculty_dean_office", facultyId, user.id]
    );

    await connection.commit();
    res.json({ message: "Роль faculty_dean_office успішно призначено" });
  } catch (error) {
    await connection.rollback();
    console.error("[UserController] Помилка призначення ролі faculty_dean_office:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};

export const assignFacultyDeanOffice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { email, facultyId } = req.body;
    const { error } = roleAssignmentSchema.validate({ email, role: "faculty_dean_office", facultyId });
    if (error) {
      return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
    }

    // Find user by email
    const [userRows] = await connection.query(`SELECT id, role FROM users WHERE email = ?`, [email]);
    if (!userRows[0]) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }
    const user = userRows[0];

    const [faculty] = await connection.query(`SELECT id FROM faculties WHERE id = ?`, [facultyId]);
    if (!faculty[0]) {
      return res.status(404).json({ error: "Факультет не знайдено" });
    }

    // Check if user already has a significant role
    if (user.role !== "student" && user.role !== null) {
      return res.status(409).json({ error: "Користувач уже має роль", code: "ROLE_CONFLICT" });
    }

    await connection.query(
      `UPDATE users SET role = ?, faculty_id = ?, dormitory_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ["faculty_dean_office", facultyId, user.id]
    );

    await connection.commit();
    res.status(200).json({ message: "Роль адміністратора призначено" });
  } catch (error) {
    await connection.rollback();
    console.error("[UserController] Помилка призначення ролі faculty_dean_office:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};

export const assignDormManagerRole = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { email, dormitoryId } = req.body;
    const { error } = roleAssignmentSchema.validate({ email, role: "dorm_manager", dormitoryId });
    if (error) {
      return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
    }

    // Find user by email
    const [userRows] = await connection.query(`SELECT id, role FROM users WHERE email = ?`, [email]);
    if (!userRows[0]) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }
    const user = userRows[0];

    const [dormitory] = await connection.query(`SELECT id FROM dormitories WHERE id = ?`, [dormitoryId]);
    if (!dormitory[0]) {
      return res.status(404).json({ error: "Гуртожиток не знайдено" });
    }

    if (user.role !== "student" && user.role !== null) {
      return res.status(409).json({ error: "Користувач уже має роль", code: "ROLE_CONFLICT" });
    }

    await connection.query(
      `UPDATE users SET role = ?, dormitory_id = ?, faculty_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ["dorm_manager", dormitoryId, user.id]
    );

    await connection.commit();
    res.json({ message: "Роль dorm_manager успішно призначено" });
  } catch (error) {
    await connection.rollback();
    console.error("[UserController] Помилка призначення ролі dorm_manager:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};

export const assignStudentCouncilRole = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { email, role, facultyId } = req.body;
    const requestingUser = req.user;
    const { error } = roleAssignmentSchema.validate({ email, role, facultyId });
    if (error) {
      return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
    }

    // Find user by email
    const [userRows] = await connection.query(`SELECT id, role FROM users WHERE email = ?`, [email]);
    if (!userRows[0]) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }
    const user = userRows[0];

    const [faculty] = await connection.query(`SELECT id FROM faculties WHERE id = ?`, [facultyId]);
    if (!faculty[0]) {
      return res.status(404).json({ error: "Факультет не знайдено" });
    }

    if (user.role !== "student" && user.role !== null) {
      return res.status(409).json({ error: "Користувач уже має роль", code: "ROLE_CONFLICT" });
    }

    if (requestingUser.role === "dorm_manager") {
      const [facultyDormitories] = await connection.query(
        `SELECT faculty_id FROM faculty_dormitories WHERE dormitory_id = ? AND faculty_id = ?`,
        [requestingUser.dormitory_id, facultyId]
      );
      if (!facultyDormitories[0]) {
        return res.status(403).json({ error: "Немає прав призначати для цього факультету" });
      }
    }

    await connection.query(
      `UPDATE users SET role = ?, faculty_id = ?, dormitory_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [role, facultyId, user.id]
    );

    await connection.commit();
    res.json({ message: `Роль ${role} успішно призначено` });
  } catch (error) {
    await connection.rollback();
    console.error("[UserController] Помилка призначення ролі student_council:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.email, u.role, u.name, u.faculty_id, u.dormitory_id,
             f.name AS faculty_name, d.name AS dormitory_name
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN dormitories d ON u.dormitory_id = d.id
    `);
    res.json(users);
  } catch (error) {
    console.error("[UserController] Помилка отримання користувачів:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const updateUserRole = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const schema = Joi.object({
      role: Joi.string()
        .valid(
          "student",
          "admin",
          "superadmin",
          "faculty_dean_office",
          "dorm_manager",
          "student_council_head",
          "student_council_member"
        )
        .required(),
      facultyId: Joi.number().integer().positive().optional(),
      dormitoryId: Joi.number().integer().positive().optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }

    let { role, facultyId, dormitoryId } = value;
    facultyId = ["faculty_dean_office", "student_council_head", "student_council_member"].includes(role)
      ? facultyId
      : null;
    dormitoryId = role === "dorm_manager" ? dormitoryId : null;

    if (facultyId) {
      const [faculty] = await connection.query(`SELECT id FROM faculties WHERE id = ?`, [facultyId]);
      if (!faculty[0]) {
        return res.status(404).json({ error: "Факультет не знайдено" });
      }
    }
    if (dormitoryId) {
      const [dormitory] = await connection.query(`SELECT id FROM dormitories WHERE id = ?`, [dormitoryId]);
      if (!dormitory[0]) {
        return res.status(404).json({ error: "Гуртожиток не знайдено" });
      }
    }

    await connection.execute(
      `UPDATE users SET role = ?, faculty_id = ?, dormitory_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [role, facultyId, dormitoryId, id]
    );

    await connection.commit();
    res.json({ message: "Роль та зв'язки оновлено" });
  } catch (error) {
    await connection.rollback();
    console.error("[UserController] Помилка оновлення ролі:", error);
    res.status(500).json({ error: "Помилка сервера" });
  } finally {
    connection.release();
  }
};

export default {
  assignFacultyDeanOfficeRole,
  assignFacultyDeanOffice,
  assignDormManagerRole,
  assignStudentCouncilRole,
  getAllUsers,
  updateUserRole,
};