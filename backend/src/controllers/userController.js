import pool from "../config/db.js";
import Joi from "joi";
import User from "../models/User.js";

const roleAssignmentSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string()
    .valid("faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member")
    .required(),
  facultyId: Joi.number().integer().positive().optional().allow(null, ""),
  dormitoryId: Joi.number().integer().positive().optional().allow(null, ""),
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
    await connection.query(
      `UPDATE dormitories SET manager_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_user_id = ? AND id != ?`,
      [user.id, dormitoryId]
    );
    await connection.query(
      `UPDATE dormitories SET manager_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (manager_user_id IS NOT NULL AND manager_user_id != ?)`,
      [dormitoryId, user.id]
    );
    await connection.query(
      `UPDATE dormitories SET manager_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [user.id, dormitoryId]
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
    const schema = Joi.object({
      role: Joi.string().allow("").optional().pattern(/^[a-zA-Z_]+(,[a-zA-Z_]+)*$/),
      exclude_roles: Joi.string().allow("").optional().pattern(/^[a-zA-Z_]+(,[a-zA-Z_]+)*$/),
      faculty_id: Joi.number().integer().positive().optional().allow(null),
      search: Joi.string().allow("").optional(),
      page: Joi.number().integer().min(1).optional().default(1),
      limit: Joi.number().integer().min(1).optional().default(1000),
      sortBy: Joi.string().allow("").optional().default("name"),
      sortOrder: Joi.string().valid("asc", "desc").allow("").optional().default("asc"),
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
    }

    let queryBase = `
      SELECT u.id, u.email, u.role, u.name, u.faculty_id, u.dormitory_id,
             f.name AS faculty_name, d.name AS dormitory_name
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN dormitories d ON u.dormitory_id = d.id
    `;
    let countQueryBase = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN dormitories d ON u.dormitory_id = d.id
    `;
    const whereClauses = [];
    const whereParams = [];

    if (value.role) {
      const roles = value.role.split(",").map((r) => r.trim()).filter(Boolean);
      if (roles.length > 0) {
        whereClauses.push(`u.role IN (${roles.map(() => "?").join(",")})`);
        whereParams.push(...roles);
      }
    }

    if (value.exclude_roles) {
      const excludeRoles = value.exclude_roles.split(",").map((r) => r.trim()).filter(Boolean);
      if (excludeRoles.length > 0) {
        whereClauses.push(`u.role NOT IN (${excludeRoles.map(() => "?").join(",")})`);
        whereParams.push(...excludeRoles);
      }
    }

    if (value.faculty_id) {
      const facultyIds = String(value.faculty_id).split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id) && id > 0);
      if (facultyIds.length > 0) {
        whereClauses.push(`u.faculty_id IN (${facultyIds.map(() => "?").join(",")})`);
        whereParams.push(...facultyIds);
      }
    }

    if (value.search) {
      const searchTerm = `%${value.search}%`;
      whereClauses.push(`(u.name LIKE ? OR u.email LIKE ? OR f.name LIKE ? OR d.name LIKE ?)`);
      whereParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereString = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(" AND ")}` : "";
    const countQuery = countQueryBase + whereString;
    const [totalResult] = await pool.query(countQuery, whereParams);

    const validSortFields = ["name", "email", "role", "created_at", "updated_at"];
    const sortBy = validSortFields.includes(value.sortBy) ? `u.${value.sortBy}` : "u.name";
    const sortOrder = value.sortOrder === "desc" ? "DESC" : "ASC";
    const offset = (value.page - 1) * value.limit;
    const query = `${queryBase} ${whereString} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    const params = [...whereParams, value.limit, offset];

    const [users] = await pool.query(query, params);
    res.json({ users, total: totalResult[0].total, page: value.page, limit: value.limit });
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
      facultyId: Joi.number().integer().positive().optional().allow(null, ""),
      dormitoryId: Joi.number().integer().positive().optional().allow(null, ""),
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
    if (role !== "dorm_manager") {
      await connection.query(
        `UPDATE dormitories SET manager_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_user_id = ?`,
        [id]
      );
    } else {
      await connection.query(
        `UPDATE dormitories SET manager_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE manager_user_id = ? AND id != ?`,
        [id, dormitoryId]
      );
      await connection.query(
        `UPDATE dormitories SET manager_user_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (manager_user_id IS NOT NULL AND manager_user_id != ?)`,
        [dormitoryId, id]
      );
      await connection.query(
        `UPDATE dormitories SET manager_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id, dormitoryId]
      );
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

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [userRows] = await pool.query(
      `SELECT u.*, up.phone FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ?`,
      [userId]
    );
    if (!userRows[0]) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }
    res.json({ phone: userRows[0].phone || null });
  } catch (error) {
    console.error("[UserController] Помилка:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export default {
  assignFacultyDeanOfficeRole,
  assignFacultyDeanOffice,
  assignDormManagerRole,
  assignStudentCouncilRole,
  getAllUsers,
  updateUserRole,
  getProfile,
};