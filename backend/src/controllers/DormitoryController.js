import Joi from "joi";
import pool from "../config/db.js";
import Dormitory from "../models/Dormitory.js";

export const createDormitory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const schema = Joi.object({
      name: Joi.string().trim().min(3).max(100).required(),
      address: Joi.string().trim().max(255).allow("").optional(),
      capacity: Joi.number().integer().min(1).optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const { name, address, capacity } = value;

    // Check for duplicate dormitory name
    const [existing] = await connection.query(`SELECT id FROM dormitories WHERE name = ?`, [name]);
    if (existing[0]) {
      return res.status(409).json({ error: "Гуртожиток із такою назвою вже існує", code: "DUPLICATE_NAME" });
    }

    const dormitoryId = await Dormitory.create({ name, address, capacity });
    await connection.commit();
    res.status(201).json({ message: "Гуртожиток створено", dormitoryId });
  } catch (error) {
    await connection.rollback();
    console.error("[DormitoryController] Помилка створення гуртожитку:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};

export const getDormitories = async (req, res) => {
  try {
    const dormitories = await Dormitory.findAll();
    res.json(dormitories);
  } catch (error) {
    console.error("[DormitoryController] Error fetching dormitories:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getDormitoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const dormitory = await Dormitory.findById(id);
    if (!dormitory) {
      return res.status(404).json({ error: "Гуртожиток не знайдено" });
    }
    res.json(dormitory);
  } catch (error) {
    console.error("[DormitoryController] Помилка отримання гуртожитку:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const updateDormitory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const schema = Joi.object({
      name: Joi.string().trim().min(3).max(100).required(),
      address: Joi.string().trim().max(255).allow("").optional(),
      capacity: Joi.number().integer().min(1).optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    // Check for duplicate name (excluding current dormitory)
    const [existing] = await connection.query(
      `SELECT id FROM dormitories WHERE name = ? AND id != ?`,
      [value.name, id]
    );
    if (existing[0]) {
      return res.status(409).json({ error: "Гуртожиток із такою назвою вже існує", code: "DUPLICATE_NAME" });
    }

    const updated = await Dormitory.update(id, value);
    if (!updated) {
      return res.status(404).json({ error: "Гуртожиток не знайдено" });
    }
    await connection.commit();
    res.json({ message: "Гуртожиток оновлено" });
  } catch (error) {
    await connection.rollback();
    console.error("[DormitoryController] Помилка оновлення гуртожитку:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};

export const deleteDormitory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Check for dependencies
    const [facultyDormitories] = await connection.query(
      `SELECT COUNT(*) as count FROM faculty_dormitories WHERE dormitory_id = ?`,
      [id]
    );
    const [rooms] = await connection.query(
      `SELECT COUNT(*) as count FROM rooms WHERE dormitory_id = ?`,
      [id]
    );
    const [applications] = await connection.query(
      `SELECT COUNT(*) as count FROM accommodation_applications WHERE dormitory_id = ?`,
      [id]
    );
    const [settlements] = await connection.query(
      `SELECT COUNT(*) as count FROM settlements WHERE dormitory_id = ?`,
      [id]
    );

    if (
      facultyDormitories[0].count > 0 ||
      rooms[0].count > 0 ||
      applications[0].count > 0 ||
      settlements[0].count > 0
    ) {
      return res.status(409).json({
        error: "Неможливо видалити гуртожиток, оскільки він має пов’язані записи",
        code: "DEPENDENCY_EXISTS",
      });
    }

    const deleted = await Dormitory.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Гуртожиток не знайдено" });
    }
    await connection.commit();
    res.json({ message: "Гуртожиток видалено" });
  } catch (error) {
    await connection.rollback();
    console.error("[DormitoryController] Помилка видалення гуртожитку:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};

export default {
  createDormitory,
  getDormitories,
  getDormitoryById,
  updateDormitory,
  deleteDormitory,
};