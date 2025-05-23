import Joi from "joi";
import pool from "../config/db.js"; // Додаємо імпорт
import FacultyDormitories from "../models/FacultyDormitories.js";

export const createFacultyDormitory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const schema = Joi.object({
      faculty_id: Joi.number().integer().positive().required(),
      dormitory_id: Joi.number().integer().positive().required(),
      quota: Joi.number().integer().min(1).required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const { faculty_id, dormitory_id, quota } = value;

    // Check if faculty and dormitory exist
    const [faculty] = await connection.query(`SELECT id FROM faculties WHERE id = ?`, [faculty_id]);
    if (!faculty[0]) {
      return res.status(404).json({ error: "Факультет не знайдено" });
    }
    const [dormitory] = await connection.query(`SELECT id FROM dormitories WHERE id = ?`, [dormitory_id]);
    if (!dormitory[0]) {
      return res.status(404).json({ error: "Гуртожиток не знайдено" });
    }

    // Check for existing relationship
    const existing = await FacultyDormitories.findById(faculty_id, dormitory_id);
    if (existing) {
      return res.status(409).json({ error: "Гуртожиток уже призначено цьому факультету", code: "DUPLICATE_ASSIGNMENT" });
    }

    const id = await FacultyDormitories.create({ faculty_id, dormitory_id, quota });
    await connection.commit();
    res.status(201).json({ message: "Гуртожиток призначено факультету", id });
  } catch (error) {
    await connection.rollback();
    console.error("[FacultyDormitoryController] Помилка створення зв'язку:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Гуртожиток уже призначено цьому факультету", code: "DUPLICATE_ASSIGNMENT" });
    }
    res.status(500).json({ error: "Помилка сервера" });
  } finally {
    connection.release();
  }
};

export const getFacultyDormitories = async (req, res) => {
  try {
    const schema = Joi.object({
      faculty_id: Joi.number().integer().positive().optional(),
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
    }

    const { faculty_id } = value;
    const dormitories = faculty_id
      ? await FacultyDormitories.findByFacultyId(faculty_id)
      : await FacultyDormitories.findAll();
    res.json(dormitories);
  } catch (error) {
    console.error("[FacultyDormitoryController] Помилка отримання зв'язків:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const updateFacultyDormitory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { faculty_id, dormitory_id } = req.params;
    const schema = Joi.object({
      quota: Joi.number().integer().min(1).required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const updated = await FacultyDormitories.update(faculty_id, dormitory_id, value);
    if (!updated) {
      return res.status(404).json({ error: "Зв'язок не знайдено" });
    }

    await connection.commit();
    res.json({ message: "Квоту оновлено" });
  } catch (error) {
    await connection.rollback();
    console.error("[FacultyDormitoryController] Помилка оновлення зв'язку:", error);
    res.status(500).json({ error: "Помилка сервера" });
  } finally {
    connection.release();
  }
};

export const deleteFacultyDormitory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { faculty_id, dormitory_id } = req.params;
    const deleted = await FacultyDormitories.delete(faculty_id, dormitory_id);
    if (!deleted) {
      return res.status(404).json({ error: "Зв'язок не знайдено" });
    }

    await connection.commit();
    res.json({ message: "Зв'язок видалено" });
  } catch (error) {
    await connection.rollback();
    console.error("[FacultyDormitoryController] Помилка видалення зв'язку:", error);
    res.status(500).json({ error: "Помилка сервера" });
  } finally {
    connection.release();
  }
};