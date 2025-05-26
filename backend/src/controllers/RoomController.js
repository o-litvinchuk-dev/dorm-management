import Joi from "joi";
import Room from "../models/Room.js";
import pool from "../config/db.js";

export const createRoom = async (req, res) => {
  try {
    const { dormitoryId } = req.params;
    const numericDormitoryId = parseInt(dormitoryId, 10);

    if (req.user.role === "dorm_manager" && String(req.user.dormitory_id) !== String(numericDormitoryId)) {
      return res.status(403).json({ error: "Доступ обмежено: ви можете додавати кімнати лише до свого гуртожитку" });
    }

    const schema = Joi.object({
      number: Joi.string().trim().min(1).max(10).required(),
      capacity: Joi.number().integer().min(1).max(10).required(),
      floor: Joi.number().integer().min(0).optional().allow(null),
      gender_type: Joi.string()
        .valid("male", "female", "mixed", "any")
        .default("any"),
      description: Joi.string().trim().max(500).allow(null, "").optional(),
      is_reservable: Joi.boolean().default(true),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Невірні дані", details: error.details });
    }

    const [existingRoom] = await pool.query(
      "SELECT id FROM rooms WHERE dormitory_id = ? AND number = ?",
      [numericDormitoryId, value.number]
    );

    if (existingRoom.length > 0) {
      return res.status(409).json({
        error: `Кімната №${value.number} вже існує в цьому гуртожитку.`,
      });
    }

    const roomId = await Room.create({
      dormitory_id: numericDormitoryId,
      ...value,
    });
    const newRoom = await Room.findById(roomId);
    res.status(201).json({ message: "Кімнату створено", room: newRoom });
  } catch (error) {
    console.error("[RoomController] Помилка створення кімнати:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getRooms = async (req, res) => {
  try {
    const { dormitoryId } = req.params;
    const numericDormitoryId = parseInt(dormitoryId, 10);

    if (req.user.role === "dorm_manager" && String(req.user.dormitory_id) !== String(numericDormitoryId)) {
        return res.status(403).json({ error: "Доступ обмежено: ви можете переглядати кімнати лише свого гуртожитку" });
    }

    const rooms = await Room.findAllByDormitoryId(numericDormitoryId);
    res.json(rooms);
  } catch (error) {
    console.error("[RoomController] Помилка отримання кімнат:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    const room = await Room.findById(numericId);

    if (!room) {
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }

    if (
      req.user.role === "dorm_manager" &&
      String(req.user.dormitory_id) !== String(room.dormitory_id)
    ) {
      if (!["admin", "superadmin"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Доступ обмежено: ця кімната не у вашому гуртожитку",
        });
      }
    }
    res.json(room);
  } catch (error) {
    console.error("[RoomController] Помилка отримання кімнати:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    const room = await Room.findById(numericId);
    if (!room) {
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }

    if (
      req.user.role === "dorm_manager" &&
      String(req.user.dormitory_id) !== String(room.dormitory_id)
    ) {
      return res
        .status(403)
        .json({ error: "Доступ обмежено: ви можете редагувати лише кімнати свого гуртожитку" });
    }

    const schema = Joi.object({
      number: Joi.string().trim().min(1).max(10).optional(),
      capacity: Joi.number().integer().min(1).max(10).optional(),
      floor: Joi.number().integer().min(0).optional().allow(null),
      gender_type: Joi.string()
        .valid("male", "female", "mixed", "any")
        .optional(),
      description: Joi.string().trim().max(500).allow(null, "").optional(),
      is_reservable: Joi.boolean().optional(),
      // occupied_places and current_gender_occupancy are managed by reservations
    }).min(1);

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Невірні дані для оновлення",
        details: error.details,
      });
    }

    if (value.number && value.number !== room.number) {
      const [existingRoom] = await pool.query(
        "SELECT id FROM rooms WHERE dormitory_id = ? AND number = ? AND id != ?",
        [room.dormitory_id, value.number, numericId]
      );
      if (existingRoom.length > 0) {
        return res.status(409).json({
          error: `Кімната №${value.number} вже існує в цьому гуртожитку.`,
        });
      }
    }
    
    const newCapacity = value.capacity !== undefined ? value.capacity : room.capacity;
    if (value.occupied_places !== undefined && value.occupied_places > newCapacity) {
        return res.status(400).json({
            error: `Кількість зайнятих місць (${value.occupied_places}) не може перевищувати нову місткість (${newCapacity}).`
        });
    }
    if (room.occupied_places > newCapacity && value.capacity !== undefined) {
         return res.status(400).json({
            error: `Нова місткість (${newCapacity}) менша за поточну кількість зайнятих місць (${room.occupied_places}).`
        });
    }

    const updated = await Room.update(numericId, value);
    if (!updated) {
      return res.status(500).json({ error: "Не вдалося оновити кімнату" });
    }

    const updatedRoom = await Room.findById(numericId);
    res.json({ message: "Кімнату оновлено", room: updatedRoom });
  } catch (error) {
    console.error("[RoomController] Помилка оновлення кімнати:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    const room = await Room.findById(numericId);
    if (!room) {
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }

    if (
      req.user.role === "dorm_manager" &&
      String(req.user.dormitory_id) !== String(room.dormitory_id)
    ) {
      return res
        .status(403)
        .json({ error: "Доступ обмежено: ви можете видаляти лише кімнати свого гуртожитку" });
    }

    const deleted = await Room.delete(numericId);
    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Кімнату не знайдено або не вдалося видалити" });
    }
    res.json({ message: "Кімнату видалено" });
  } catch (error) {
    console.error("[RoomController] Помилка видалення кімнати:", error);
    if (
      error.message.includes(
        "Неможливо видалити кімнату, оскільки вона має активні бронювання."
      )
    ) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const batchUpdateReservable = async (req, res) => {
  try {
    const schema = Joi.object({
      roomIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
      is_reservable: Joi.boolean().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані для пакетного оновлення", details: error.details });
    }

    const { roomIds, is_reservable } = value;
    let successCount = 0;
    const errorsList = [];

    // Перевірка, чи користувач (комендант) має доступ до всіх цих кімнат
    if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
      const roomsInDorm = await Room.findAllByDormitoryId(req.user.dormitory_id);
      const roomIdsInDorm = roomsInDorm.map(r => r.id);
      for (const roomId of roomIds) {
        if (!roomIdsInDorm.includes(roomId)) {
          errorsList.push({ roomId, message: `Кімната ${roomId} не належить до вашого гуртожитку.` });
        }
      }
    }
    // Адмін/Суперадмін мають доступ до всіх

    if (errorsList.length > 0) {
         // Якщо є кімнати, до яких немає доступу, але інші можуть бути оновлені
         // або просто повернути помилку доступу
         // return res.status(403).json({ error: "Доступ до деяких кімнат обмежено", details: errorsList });
    }
    
    // Фільтруємо roomIds, залишаючи тільки ті, до яких є доступ (якщо потрібно)
    const accessibleRoomIds = req.user.role === "dorm_manager" ? roomIds.filter(id => !errorsList.find(e => e.roomId === id)) : roomIds;

    for (const roomId of accessibleRoomIds) {
      try {
        const updated = await Room.update(roomId, { is_reservable });
        if (updated) {
          successCount++;
        } else {
          errorsList.push({ roomId, message: `Кімнату ${roomId} не знайдено або дані не змінились.` });
        }
      } catch (e) {
        errorsList.push({ roomId, message: e.message || `Помилка оновлення кімнати ${roomId}` });
      }
    }

    if (successCount > 0) {
      return res.json({
        message: `Статус резервування оновлено для ${successCount} з ${accessibleRoomIds.length} кімнат.`,
        successCount,
        errors: errorsList,
      });
    } else {
      return res.status(400).json({
        error: "Не вдалося оновити статус для жодної кімнати.",
        successCount,
        errors: errorsList,
      });
    }
  } catch (err) {
    console.error("[RoomController] Помилка пакетного оновлення is_reservable:", err);
    res.status(500).json({ error: "Помилка сервера при пакетному оновленні", details: err.message });
  }
};

export const batchDeleteRooms = async (req, res) => {
  try {
    const schema = Joi.object({
      roomIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: "Невірні дані для пакетного видалення", details: error.details });
    }

    const { roomIds } = value;
    let successCount = 0;
    const errorsList = [];

    // Перевірка, чи користувач (комендант) має доступ до всіх цих кімнат
    if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
      const roomsInDorm = await Room.findAllByDormitoryId(req.user.dormitory_id);
      const roomIdsInDorm = roomsInDorm.map(r => r.id);
      for (const roomId of roomIds) {
        if (!roomIdsInDorm.includes(roomId)) {
          errorsList.push({ roomId, message: `Кімната ${roomId} не належить до вашого гуртожитку.` });
        }
      }
    }
    // Адмін/Суперадмін мають доступ до всіх

    // Фільтруємо roomIds, залишаючи тільки ті, до яких є доступ
    const accessibleRoomIds = req.user.role === "dorm_manager" ? roomIds.filter(id => !errorsList.find(e => e.roomId === id)) : roomIds;

    for (const roomId of accessibleRoomIds) {
      try {
        const room = await Room.findById(roomId);
        if (!room) {
          errorsList.push({ roomId, message: `Кімнату ${roomId} не знайдено.` });
          continue;
        }

        const deleted = await Room.delete(roomId);
        if (deleted) {
          successCount++;
        } else {
          errorsList.push({ roomId, message: `Не вдалося видалити кімнату ${roomId}.` });
        }
      } catch (e) {
        if (e.message.includes("Неможливо видалити кімнату, оскільки вона має активні бронювання.")) {
          errorsList.push({ roomId, message: `Кімнату ${roomId} не можна видалити через активні бронювання.` });
        } else {
          errorsList.push({ roomId, message: e.message || `Помилка видалення кімнати ${roomId}.` });
        }
      }
    }

    if (successCount > 0) {
      return res.json({
        message: `Видалено ${successCount} з ${accessibleRoomIds.length} кімнат.`,
        successCount,
        errors: errorsList,
      });
    } else {
      return res.status(400).json({
        error: "Не вдалося видалити жодну кімнату.",
        successCount,
        errors: errorsList,
      });
    }
  } catch (err) {
    console.error("[RoomController] Помилка пакетного видалення кімнат:", err);
    res.status(500).json({ error: "Помилка сервера при пакетному видаленні", details: err.message });
  }
};