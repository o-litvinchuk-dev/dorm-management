import Joi from "joi";
import Room from "../models/Room.js";

export const createRoom = async (req, res) => {
  try {
    const { dormitoryId } = req.params;
    const schema = Joi.object({
      number: Joi.string().min(1).max(10).required(),
      capacity: Joi.number().integer().min(1).max(10).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    if (req.user.role === "dorm_manager" && req.user.dormitory_id !== dormitoryId) {
      return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
    }

    const roomId = await Room.create({ dormitory_id: dormitoryId, ...value });
    res.status(201).json({ message: "Кімнату створено", roomId });
  } catch (error) {
    console.error("[RoomController] Помилка створення кімнати:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getRooms = async (req, res) => {
  try {
    const { dormitoryId } = req.params;
    if (req.user.role === "dorm_manager" && req.user.dormitory_id !== dormitoryId) {
      return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
    }

    const rooms = await Room.findAllByDormitoryId(dormitoryId);
    res.json(rooms);
  } catch (error) {
    console.error("[RoomController] Помилка отримання кімнат:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      number: Joi.string().min(1).max(10).required(),
      capacity: Joi.number().integer().min(1).max(10).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані", details: error.details });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }

    if (req.user.role === "dorm_manager" && req.user.dormitory_id !== room.dormitory_id) {
      return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
    }

    const updated = await Room.update(id, value);
    if (!updated) {
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }

    res.json({ message: "Кімнату оновлено" });
  } catch (error) {
    console.error("[RoomController] Помилка оновлення кімнати:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }

    if (req.user.role === "dorm_manager" && req.user.dormitory_id !== room.dormitory_id) {
      return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
    }

    const deleted = await Room.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }

    res.json({ message: "Кімнату видалено" });
  } catch (error) {
    console.error("[RoomController] Помилка видалення кімнати:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};