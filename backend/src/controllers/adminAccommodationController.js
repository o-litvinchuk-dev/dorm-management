import pool from "../config/db.js";
import Joi from "joi";
import AccommodationApplication from "../models/AccommodationApplication.js";
import Notification from "../models/Notification.js";

export const getAccommodationApplications = async (req, res) => {
  try {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().allow("").default(""),
      status: Joi.string().valid("pending", "approved", "rejected", "").allow("").default(""),
      dateFrom: Joi.date().iso().allow("").default(""),
      dateTo: Joi.date().iso().allow("").default(""),
      dormNumber: Joi.string().allow("").default(""),
      sortBy: Joi.string()
        .valid("id", "full_name", "email", "dorm_number", "status", "created_at", "application_date", "updated_at")
        .default("created_at"),
      sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      console.error("[AdminAccommodationController] Joi validation error:", error.details);
      return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
    }

    // Role-based filtering for dorm_admin
    let userDormNumber = null;
    if (req.user?.role === "dorm_admin") {
      try {
        userDormNumber = await getUserDormNumber(req.user.userId);
      } catch (err) {
        console.error("[AdminAccommodationController] Error in getUserDormNumber:", err.message);
        return res.status(500).json({ error: "Помилка отримання номера гуртожитку", details: err.message });
      }
      if (userDormNumber && value.dormNumber && userDormNumber !== value.dormNumber) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
      value.dormNumber = userDormNumber || value.dormNumber;
    }

    if (!req.user) {
      console.error("[AdminAccommodationController] No user in request");
      return res.status(401).json({ error: "Користувач не авторизований" });
    }

    value.requestingUserRole = req.user.role;
    value.requestingUserDormNumber = userDormNumber;

    const result = await AccommodationApplication.findAll(value);
    res.json(result);
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка отримання заявок:", {
      message: error.message,
      stack: error.stack,
      query: req.query,
      user: req.user,
    });
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getAccommodationApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.number().integer().positive().required();
    const { error } = schema.validate(id);
    if (error) {
      console.error("[AdminAccommodationController] Joi validation error for ID:", error.details);
      return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
    }

    // Role-based filtering for dorm_admin
    if (req.user?.role === "dorm_admin") {
      let userDorm;
      try {
        userDorm = await getUserDormNumber(req.user.userId);
      } catch (err) {
        console.error("[AdminAccommodationController] Error in getUserDormNumber:", err.message);
        return res.status(500).json({ error: "Помилка отримання номера гуртожитку", details: err.message });
      }
      const application = await AccommodationApplication.findById(id);
      if (!application || (userDorm && application.dorm_number !== userDorm)) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
    }

    const application = await AccommodationApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Заявку не знайдено" });
    }
    res.json(application);
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка отримання заявки:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user,
    });
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
      status: Joi.string().valid("pending", "approved", "rejected").required(),
    });

    const { error } = schema.validate({ id, status });
    if (error) {
      console.error("[AdminAccommodationController] Joi validation error for status update:", error.details);
      return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
    }

    // Role-based filtering for dorm_admin
    if (req.user?.role === "dorm_admin") {
      let userDorm;
      try {
        userDorm = await getUserDormNumber(req.user.userId);
      } catch (err) {
        console.error("[AdminAccommodationController] Error in getUserDormNumber:", err.message);
        return res.status(500).json({ error: "Помилка отримання номера гуртожитку", details: err.message });
      }
      const application = await AccommodationApplication.findById(id);
      if (!application || (userDorm && application.dorm_number !== userDorm)) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
    }

    const updated = await AccommodationApplication.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: "Заявку не знайдено" });
    }

    // Create notification for the student
    const application = await AccommodationApplication.findById(id);
    if (application) {
      await Notification.create({
        user_id: application.user_id,
        title: "Оновлення статусу заявки на поселення",
        description: `Ваша заявка (ID: ${id}) отримала новий статус: ${status}`,
      });
    }

    res.json({ message: "Статус успішно оновлено" });
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка оновлення статусу:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
      user: req.user,
    });
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const addApplicationComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const admin_id = req.user?.userId;

    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
      comment: Joi.string().min(1).max(1000).required(),
    });

    const { error } = schema.validate({ id, comment });
    if (error) {
      console.error("[AdminAccommodationController] Joi validation error for comment:", error.details);
      return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
    }

    if (!admin_id) {
      console.error("[AdminAccommodationController] No userId in request");
      return res.status(401).json({ error: "Користувач не авторизований" });
    }

    // Role-based filtering for dorm_admin
    if (req.user?.role === "dorm_admin") {
      let userDorm;
      try {
        userDorm = await getUserDormNumber(req.user.userId);
      } catch (err) {
        console.error("[AdminAccommodationController] Error in getUserDormNumber:", err.message);
        return res.status(500).json({ error: "Помилка отримання номера гуртожитку", details: err.message });
      }
      const application = await AccommodationApplication.findById(id);
      if (!application || (userDorm && application.dorm_number !== userDorm)) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
    }

    const commentId = await AccommodationApplication.addComment({
      application_id: id,
      admin_id,
      comment,
    });

    // Fetch the newly added comment with admin name
    const [newComment] = await AccommodationApplication.findCommentsByApplicationId(id);
    res.status(201).json({ message: "Коментар успішно додано", comment: newComment });
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка додавання коментаря:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
      user: req.user,
    });
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getApplicationComments = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.number().integer().positive().required();
    const { error } = schema.validate(id);
    if (error) {
      console.error("[AdminAccommodationController] Joi validation error for comments:", error.details);
      return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
    }

    // Role-based filtering for dorm_admin
    if (req.user?.role === "dorm_admin") {
      let userDorm;
      try {
        userDorm = await getUserDormNumber(req.user.userId);
      } catch (err) {
        console.error("[AdminAccommodationController] Error in getUserDormNumber:", err.message);
        return res.status(500).json({ error: "Помилка отримання номера гуртожитку", details: err.message });
      }
      const application = await AccommodationApplication.findById(id);
      if (!application || (userDorm && application.dorm_number !== userDorm)) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
    }

    const comments = await AccommodationApplication.findCommentsByApplicationId(id);
    res.json(comments);
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка отримання коментарів:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user,
    });
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

// Helper function to get dorm number for dorm_admin
export const getUserDormNumber = async (userId) => {
  try {
    const [rows] = await pool.query(
      "SELECT dormitory FROM user_profiles WHERE user_id = ?",
      [userId]
    );
    return rows[0]?.dormitory || null;
  } catch (error) {
    console.error("[getUserDormNumber] Database error:", {
      message: error.message,
      stack: error.stack,
      userId,
    });
    throw error;
  }
};