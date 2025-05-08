import Joi from "joi";
import DormApplication from "../models/DormApplication.js";

export const getApplications = async (req, res) => {
  try {
    // Схема валідації параметрів запиту
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().allow('').default(''),
      faculty: Joi.string().allow('').default(''),
      course: Joi.number().integer().min(1).max(6).allow('').default(''),
      dateFrom: Joi.date().iso().allow('').default(''),
      dateTo: Joi.date().iso().allow('').default(''),
      sortBy: Joi.string().valid('id', 'name', 'surname', 'faculty', 'course', 'created_at').default('created_at'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    });

    // Валідація параметрів
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
    }

    // Виклик методу findAll з моделі з валідованими параметрами
    const result = await DormApplication.findAll(value);

    // Повернення результату
    res.json({
      applications: result.applications,
      total: result.total,
      page: result.page,
      limit: result.limit
    });
  } catch (error) {
    console.error("[AdminController] Помилка отримання заявок:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};