import FacultyDormitories from "../models/FacultyDormitories.js";
import Joi from "joi";

export const createFacultyDormitory = async (req, res) => {
  try {
    const schema = Joi.object({
      faculty_id: Joi.number().integer().positive().required(),
      dormitory_id: Joi.number().integer().positive().required(),
      quota: Joi.number().integer().min(0).optional().allow(null),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const id = await FacultyDormitories.create(value);
    res.status(201).json({ message: "Запис створено", id });
  } catch (error) {
    console.error("[FacultyDormitoryController] Помилка створення:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getFacultyDormitories = async (req, res) => {
  try {
    const records = await FacultyDormitories.findAll();
    res.json(records);
  } catch (error) {
    console.error("[FacultyDormitoryController] Помилка отримання:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const updateFacultyDormitory = async (req, res) => {
  try {
    const { faculty_id, dormitory_id } = req.params;
    const schema = Joi.object({
      quota: Joi.number().integer().min(0).optional().allow(null),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const updated = await FacultyDormitories.update(faculty_id, dormitory_id, value);
    if (!updated) {
      return res.status(404).json({ error: "Запис не знайдено" });
    }
    res.json({ message: "Запис оновлено" });
  } catch (error) {
    console.error("[FacultyDormitoryController] Помилка оновлення:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const deleteFacultyDormitory = async (req, res) => {
  try {
    const { faculty_id, dormitory_id } = req.params;
    const deleted = await FacultyDormitories.delete(faculty_id, dormitory_id);
    if (!deleted) {
      return res.status(404).json({ error: "Запис не знайдено" });
    }
    res.json({ message: "Запис видалено" });
  } catch (error) {
    console.error("[FacultyDormitoryController] Помилка видалення:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};