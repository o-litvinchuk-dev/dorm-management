import pool from "../config/db.js";
import Joi from "joi";
import AccommodationApplication from "../models/AccommodationApplication.js";

export const getAccommodationApplications = async (req, res) => {
  try {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().allow('').default(''),
      status: Joi.string().valid('pending', 'approved', 'rejected', '').allow('').default(''),
      dateFrom: Joi.date().iso().allow('').default(''),
      dateTo: Joi.date().iso().allow('').default(''),
      dormNumber: Joi.string().allow('').default(''),
      sortBy: Joi.string().valid('id', 'full_name', 'created_at', 'updated_at').default('created_at'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
    }

    // Role-based filtering for dorm_admin
    if (req.user.role === 'dorm_admin') {
      const userDorm = await getUserDormNumber(req.user.userId);
      if (userDorm && value.dormNumber && userDorm !== value.dormNumber) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
      value.dormNumber = userDorm || value.dormNumber;
    }

    const result = await AccommodationApplication.findAll(value);
    res.json(result);
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка отримання заявок:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

// Helper function to get dorm number for dorm_admin
const getUserDormNumber = async (userId) => {
  // Assuming user_profiles table has dorm_number for dorm_admin
  const [rows] = await pool.query(
    'SELECT dormitory FROM user_profiles WHERE user_id = ?',
    [userId]
  );
  return rows[0]?.dormitory || null;
};

export const getAccommodationApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.number().integer().positive().required();
    const { error } = schema.validate(id);
    if (error) {
      return res.status(400).json({ error: "Невірний ID заявки" });
    }

    // Role-based filtering for dorm_admin
    if (req.user.role === 'dorm_admin') {
      const userDorm = await getUserDormNumber(req.user.userId);
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
    console.error("[AdminAccommodationController] Помилка отримання заявки:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
      status: Joi.string().valid('pending', 'approved', 'rejected').required()
    });

    const { error } = schema.validate({ id, status });
    if (error) {
      return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
    }

    // Role-based filtering for dorm_admin
    if (req.user.role === 'dorm_admin') {
      const userDorm = await getUserDormNumber(req.user.userId);
      const application = await AccommodationApplication.findById(id);
      if (!application || (userDorm && application.dorm_number !== userDorm)) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
    }

    const updated = await AccommodationApplication.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: "Заявку не знайдено" });
    }

    res.json({ message: "Статус успішно оновлено" });
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка оновлення статусу:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const addApplicationComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const admin_id = req.user.userId;

    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
      comment: Joi.string().min(1).max(1000).required()
    });

    const { error } = schema.validate({ id, comment });
    if (error) {
      return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
    }

    // Role-based filtering for dorm_admin
    if (req.user.role === 'dorm_admin') {
      const userDorm = await getUserDormNumber(req.user.userId);
      const application = await AccommodationApplication.findById(id);
      if (!application || (userDorm && application.dorm_number !== userDorm)) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
    }

    const commentId = await AccommodationApplication.addComment({
      application_id: id,
      admin_id,
      comment
    });

    res.status(201).json({ message: "Коментар успішно додано", commentId });
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка додавання коментаря:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getApplicationComments = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.number().integer().positive().required();
    const { error } = schema.validate(id);
    if (error) {
      return res.status(400).json({ error: "Невірний ID заявки" });
    }

    // Role-based filtering for dorm_admin
    if (req.user.role === 'dorm_admin') {
      const userDorm = await getUserDormNumber(req.user.userId);
      const application = await AccommodationApplication.findById(id);
      if (!application || (userDorm && application.dorm_number !== userDorm)) {
        return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
      }
    }

    const comments = await AccommodationApplication.findCommentsByApplicationId(id);
    res.json(comments);
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка отримання коментарів:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};