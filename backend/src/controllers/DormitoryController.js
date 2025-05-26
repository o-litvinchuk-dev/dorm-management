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
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const { name, address, capacity } = value;

    const [existing] = await connection.query(`SELECT id FROM dormitories WHERE name = ?`, [name]);
    if (existing[0]) {
      await connection.rollback();
      connection.release();
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
    if (connection) connection.release();
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
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return res.status(400).json({ error: "Невірний ID гуртожитку" });
    }

    if (req.user && req.user.role === 'dorm_manager' && req.user.dormitory_id !== numericId) {
      console.warn(`[DormitoryCtrl][getDormitoryById] Dorm manager ${req.user.userId} (manages ${req.user.dormitory_id}) attempt to access dorm ${numericId}. Denied.`);
      return res.status(403).json({ error: "Доступ обмежено. Ви можете переглядати тільки дані свого гуртожитку." });
    }

    const dormitory = await Dormitory.findById(numericId);
    if (!dormitory) {
      return res.status(404).json({ error: "Гуртожиток не знайдено" });
    }
    res.json(dormitory);
  } catch (error) {
    console.error("[DormitoryController] Помилка отримання гуртожитку:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const updateDormitory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Невірний ID гуртожитку" });
    }

    if (req.user && req.user.role === 'dorm_manager' && req.user.dormitory_id !== numericId) {
      await connection.rollback();
      connection.release();
      console.warn(`[DormitoryCtrl][updateDormitory] Dorm manager ${req.user.userId} (manages ${req.user.dormitory_id}) attempt to update dorm ${numericId}. Denied.`);
      return res.status(403).json({ error: "Доступ обмежено. Ви можете оновлювати тільки дані свого гуртожитку." });
    }

    const schema = Joi.object({
      name: Joi.string().trim().min(3).max(100).required(),
      address: Joi.string().trim().max(255).allow("").optional(),
      capacity: Joi.number().integer().min(1).optional().allow(null),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const [existing] = await connection.query(
      `SELECT id FROM dormitories WHERE name = ? AND id != ?`,
      [value.name, numericId]
    );
    if (existing[0]) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ error: "Гуртожиток із такою назвою вже існує", code: "DUPLICATE_NAME" });
    }

    const payloadToUpdate = {
      name: value.name,
      address: value.address || null,
      capacity: value.capacity === undefined || value.capacity === '' ? null : parseInt(value.capacity)
    };

    const updated = await Dormitory.update(numericId, payloadToUpdate);
    if (!updated) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Гуртожиток не знайдено або дані не змінилися" });
    }
    await connection.commit();
    res.json({ message: "Гуртожиток оновлено" });
  } catch (error) {
    await connection.rollback();
    console.error("[DormitoryController] Помилка оновлення гуртожитку:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteDormitory = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: "Невірний ID гуртожитку" });
    }

    const [facultyDormitories] = await connection.query(
      `SELECT COUNT(*) as count FROM faculty_dormitories WHERE dormitory_id = ?`,
      [numericId]
    );
    const [rooms] = await connection.query(
      `SELECT COUNT(*) as count FROM rooms WHERE dormitory_id = ?`,
      [numericId]
    );
    const [applications] = await connection.query(
      `SELECT COUNT(*) as count FROM accommodation_applications WHERE dormitory_id = ?`,
      [numericId]
    );
    const [settlements] = await connection.query(
      `SELECT COUNT(*) as count FROM settlements WHERE dormitory_id = ?`,
      [numericId]
    );

    if (
      facultyDormitories[0].count > 0 ||
      rooms[0].count > 0 ||
      applications[0].count > 0 ||
      settlements[0].count > 0
    ) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({
        error: "Неможливо видалити гуртожиток, оскільки він має пов’язані записи (факультети, кімнати, заявки або поселення).",
        code: "DEPENDENCY_EXISTS",
      });
    }

    const deleted = await Dormitory.delete(numericId);
    if (!deleted) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Гуртожиток не знайдено" });
    }
    await connection.commit();
    res.json({ message: "Гуртожиток видалено" });
  } catch (error) {
    await connection.rollback();
    console.error("[DormitoryController] Помилка видалення гуртожитку:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export default {
  createDormitory,
  getDormitories,
  getDormitoryById,
  updateDormitory,
  deleteDormitory,
};