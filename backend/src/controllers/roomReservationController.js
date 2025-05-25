import Joi from "joi";
import Room from "../models/Room.js";
import RoomReservation from "../models/RoomReservation.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import pool from "../config/db.js";

const statusLabels = {
  pending_confirmation: "Очікує підтвердження",
  confirmed: "Підтверджено",
  cancelled_by_user: "Скасовано студентом",
  rejected_by_admin: "Відхилено адміністрацією",
  checked_in: "Заселено",
  checked_out: "Виселено",
  expired: "Термін минув",
};

// Функція перевірки доступності кімнати на конкретний навчальний рік
const checkRoomAvailabilityForAcademicYear = async (
  roomId,
  academicYear,
  roomCapacity,
  excludeReservationId = null,
  connection = pool
) => {
  let query = `
    SELECT COUNT(id) as conflicting_reservations_count
    FROM room_reservations
    WHERE room_id = ? AND academic_year = ? AND status IN ('confirmed', 'checked_in')
  `;
  const params = [roomId, academicYear];

  if (excludeReservationId) {
    query += ` AND id != ?`;
    params.push(excludeReservationId);
  }
  try {
    const [result] = await connection.query(query, params);
    const conflictingCount = result[0].conflicting_reservations_count;
    return conflictingCount < roomCapacity;
  } catch (error) {
    console.error("[checkRoomAvailabilityForAcademicYear] Error:", error);
    return false; // Якщо помилка, вважаємо, що кімната недоступна
  }
};

export const searchAvailableRooms = async (req, res) => {
  try {
    const schema = Joi.object({
      dormitory_id: Joi.number().integer().positive().optional().allow(null, ""),
      gender: Joi.string().valid("male", "female").optional().allow(null, ""),
      academic_year_for_search: Joi.string().pattern(/^\d{4}-\d{4}$/).required(),
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res
        .status(400)
        .json({ error: "Невірні параметри пошуку", details: error.details });
    }
    const { academic_year_for_search } = value; // Беремо academic_year з валідованих даних
    const userQueryGender = value.gender;
    let roomsQuery = `
      SELECT r.id, r.number, r.capacity, r.floor, r.gender_type, r.description,
      d.name as dormitory_name, r.dormitory_id,
      (r.capacity - r.occupied_places) as free_places, r.current_gender_occupancy, r.is_reservable
      FROM rooms r
      JOIN dormitories d ON r.dormitory_id = d.id
      WHERE r.is_reservable = 1 AND (r.capacity - r.occupied_places) > 0 
    `; // Додано перевірку, що є вільні місця
    const queryParams = [];

    if (value.dormitory_id) {
      roomsQuery += ` AND r.dormitory_id = ?`;
      queryParams.push(value.dormitory_id);
    }

    if (userQueryGender) {
      // Логіка фільтрації за статтю залишається
      roomsQuery += ` AND (
        (r.gender_type = ? OR r.gender_type = 'mixed') OR 
        (r.gender_type = 'any' AND (r.current_gender_occupancy = 'empty' OR r.current_gender_occupancy = ?))
      )`;
      queryParams.push(userQueryGender, userQueryGender);
    }
    roomsQuery += ` ORDER BY d.name ASC, CAST(REGEXP_SUBSTR(r.number, '^[0-9]+') AS UNSIGNED) ASC, r.number ASC`;

    const [candidateRooms] = await pool.query(roomsQuery, queryParams);

    if (candidateRooms.length === 0) {
      return res.json([]);
    }

    const availableRooms = [];
    for (const room of candidateRooms) {
      // Перевіряємо доступність на конкретний academic_year
      const isTrulyAvailableForAcademicYear = await checkRoomAvailabilityForAcademicYear(
        room.id,
        academic_year_for_search,
        room.capacity
      );
      if (isTrulyAvailableForAcademicYear) {
        room.isAvailableOnSearchDates = true; // Це поле тепер відображає доступність на академічний рік
        availableRooms.push(room);
      } else {
        room.isAvailableOnSearchDates = false;
      }
    }
    res.json(availableRooms.filter(room => room.isAvailableOnSearchDates));
  } catch (error) {
    console.error("[RoomReservationController] Error searching rooms:", error);
    res.status(500).json({
      error: "Помилка сервера при пошуку кімнат",
      details: error.message,
    });
  }
};

export const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { academic_year: academicYearQuery } = req.query; // Фронтенд може передавати academic_year
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }

    let isAvailableForAcademicYear = true;
    if (academicYearQuery) { // Якщо academic_year передано, перевіряємо доступність
      isAvailableForAcademicYear = await checkRoomAvailabilityForAcademicYear(
        roomId, academicYearQuery, room.capacity
      );
    }
    // Додаємо occupied_places до відповіді, це корисно для фронтенду
    res.json({ ...room, isAvailable: isAvailableForAcademicYear, occupied_places: room.occupied_places });
  } catch (error) {
    console.error("[RoomReservationController] Error getting room details:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const reserveRoom = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.userId;
    const userFromDb = await User.findById(userId, connection);
    if (!userFromDb) {
      await connection.rollback();
      return res.status(404).json({ error: "Користувача не знайдено." });
    }
    const userGender = userFromDb.gender;
    console.log("[reserveRoom] User ID from token:", req.user.userId);
    console.log("[reserveRoom] User Gender from DB (userFromDb.gender):", userGender);

    if (!userGender || userGender === 'not_specified' || userGender === 'other') {
      await connection.rollback();
      return res.status(400).json({ error: "Будь ласка, вкажіть вашу стать (чоловіча/жіноча) у профілі для бронювання." });
    }

    const { roomId } = req.params;
    const schema = Joi.object({
      academic_year: Joi.string().pattern(/^\d{4}-\d{4}$/).required(),
      notes_student: Joi.string().allow(null, "").max(500).optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Невірні дані бронювання", details: error.details });
    }

    const { academic_year } = value; // Беремо academic_year з валідованих даних

    const [roomRows] = await connection.query(
      "SELECT * FROM rooms WHERE id = ? FOR UPDATE",
      [roomId]
    );
    if (roomRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Кімнату не знайдено" });
    }
    const room = roomRows[0];
    console.log("[reserveRoom] Room ID from request:", roomId);
    console.log("[reserveRoom] Room Gender Type from DB:", room.gender_type);
    console.log("[reserveRoom] Room Current Gender Occupancy from DB:", room.current_gender_occupancy);


    if (!room.is_reservable) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Ця кімната наразі недоступна для бронювання." });
    }

    if (room.occupied_places >= room.capacity) {
      await connection.rollback();
      return res
        .status(409)
        .json({ error: "На жаль, в цій кімнаті вже немає вільних місць." });
    }

    // Перевірки статі
    if (room.gender_type === "male" && userGender !== "male") {
      await connection.rollback();
      console.error(`[reserveRoom] Gender mismatch: Room is 'male', user is '${userGender}'`);
      return res
        .status(403)
        .json({ error: "Ця кімната призначена тільки для хлопців." });
    }
    if (room.gender_type === "female" && userGender !== "female") {
      await connection.rollback();
      console.error(`[reserveRoom] Gender mismatch: Room is 'female', user is '${userGender}'`);
      return res
        .status(403)
        .json({ error: "Ця кімната призначена тільки для дівчат." });
    }
    if (
      room.gender_type === "any" &&
      room.current_gender_occupancy !== "empty" &&
      room.current_gender_occupancy !== userGender
    ) {
      await connection.rollback();
      const genderLabel = room.current_gender_occupancy === 'male' ? 'хлопцями' : 'дівчатами';
      console.error(`[reserveRoom] Gender mismatch for 'any' room: Room occupied by '${room.current_gender_occupancy}', user is '${userGender}'`);
      return res.status(403).json({
        error: `Ця кімната вже частково зайнята ${genderLabel}. Оберіть іншу кімнату або кімнату типу "mixed".`,
      });
    }

    // Перевірка доступності на навчальний рік
    const isAvailableForAcademicYear = await checkRoomAvailabilityForAcademicYear(
      roomId,
      academic_year,
      room.capacity,
      null, // excludeReservationId
      connection
    );
    if (!isAvailableForAcademicYear) {
      await connection.rollback();
      return res.status(409).json({
        error: `На жаль, на ${academic_year} навчальний рік вже немає вільних місць у цій кімнаті.`,
      });
    }

    // Перевірка, чи користувач вже має активне бронювання на цей навчальний рік
    const [userActiveReservations] = await connection.query(
      `SELECT id FROM room_reservations WHERE user_id = ? AND academic_year = ? AND status IN ('pending_confirmation', 'confirmed', 'checked_in')`,
      [userId, academic_year]
    );

    if (userActiveReservations.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        error: `У вас вже є активне бронювання або заявка на поселення на ${academic_year} навчальний рік.`,
      });
    }

    const reservationId = await RoomReservation.create(
      {
        room_id: roomId,
        user_id: userId,
        academic_year: academic_year, // Зберігаємо academic_year
        notes_student: value.notes_student,
        status: "pending_confirmation",
      },
      connection
    );

    // Сповіщення
    await Notification.create({
      user_id: userId,
      title: "Бронювання створено",
      description: `Ваше бронювання кімнати №${room.number} (ID: ${reservationId}) на ${academic_year} н.р. очікує підтвердження.`,
    });
    const [dormManagers] = await connection.query(
      "SELECT id FROM users WHERE dormitory_id = ? AND role = 'dorm_manager'",
      [room.dormitory_id]
    );
    for (const manager of dormManagers) {
      await Notification.create({
        user_id: manager.id,
        title: "Нове бронювання кімнати",
        description: `Студент ${req.user.name || req.user.email
        } (ID: ${userId}) створив запит на бронювання кімнати №${room.number
        } (ID: ${roomId}) на ${academic_year} н.р.`,
      });
    }

    await connection.commit();
    res.status(201).json({
      message: "Запит на бронювання кімнати успішно створено. Очікуйте підтвердження.",
      reservationId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("[RoomReservationController] Error reserving room:", error);
    res.status(500).json({
      error: "Помилка сервера при бронюванні кімнати",
      details: error.message,
    });
  } finally {
    connection.release();
  }
};

export const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reservations = await RoomReservation.findByUserId(userId);
    res.json(reservations);
  } catch (error) {
    console.error(
      "[RoomReservationController] Error fetching user reservations:",
      error
    );
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const cancelMyReservation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.userId;
    const { reservationId } = req.params;
    const reservation = await RoomReservation.findById(
      reservationId,
      connection
    );
    if (!reservation) {
      await connection.rollback();
      return res.status(404).json({ error: "Бронювання не знайдено." });
    }
    if (reservation.user_id !== userId) {
      await connection.rollback();
      return res
        .status(403)
        .json({ error: "У вас немає прав на скасування цього бронювання." });
    }
    if (
      reservation.status !== "pending_confirmation" &&
      reservation.status !== "confirmed"
    ) {
      await connection.rollback();
      return res.status(400).json({
        error: "Можна скасувати лише бронювання, що очікують підтвердження або вже підтверджені (до фактичного заселення).",
      });
    }

    const oldStatus = reservation.status;
    const updated = await RoomReservation.updateStatus(
      reservationId,
      "cancelled_by_user",
      connection
    );
    if (!updated) {
      await connection.rollback();
      return res
        .status(500)
        .json({ error: "Не вдалося скасувати бронювання." });
    }

    // Якщо статус був "confirmed", оновлюємо occupied_places та current_gender_occupancy
    if (oldStatus === "confirmed") {
      const room = await Room.findById(reservation.room_id, connection);
      if (room) {
        const newOccupiedPlaces = Math.max(0, room.occupied_places - 1);
        let newGenderOccupancy = room.current_gender_occupancy;
        // Якщо після звільнення місця кімната стала порожньою і це кімната 'any' або 'mixed',
        // то стать стає 'empty'
        if (newOccupiedPlaces === 0 && (room.gender_type === 'any' || room.gender_type === 'mixed')) {
          newGenderOccupancy = 'empty';
        }
        await Room.update(room.id, {
          occupied_places: newOccupiedPlaces,
          current_gender_occupancy: newGenderOccupancy,
        }, connection);
      }
    }

    await Notification.create({
      user_id: userId,
      title: "Бронювання скасовано",
      description: `Ваше бронювання кімнати №${reservation.room_number || reservation.room_id
      } (ID: ${reservationId}) на ${reservation.academic_year} н.р. було успішно скасовано.`,
    });

    await connection.commit();
    res.json({ message: "Бронювання успішно скасовано." });
  } catch (error) {
    await connection.rollback();
    console.error(
      "[RoomReservationController] Error cancelling reservation:",
      error
    );
    res.status(500).json({
      error: "Помилка сервера при скасуванні бронювання",
      details: error.message,
    });
  } finally {
    connection.release();
  }
};

export const getAllReservationsAdmin = async (req, res) => {
  try {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().allow(null, "").optional().default(""),
      status: Joi.string()
        .valid(...Object.keys(statusLabels), "")
        .optional()
        .allow(null, ""),
      dormitory_id: Joi.number()
        .integer()
        .positive()
        .optional()
        .allow(null, ""),
      sortBy: Joi.string()
        .valid(
          "id",
          "user_name",
          "room_number",
          "academic_year", // Оновлено поле для сортування
          "status",
          "created_at"
        )
        .default("created_at"),
      sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    });
    const { error, value: filters } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: "Невірні параметри фільтрації",
        details: error.details,
      });
    }
    if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
      filters.dormitory_id = req.user.dormitory_id;
    }
    const result = await RoomReservation.findAllAdmin(filters);
    res.json(result);
  } catch (error) {
    console.error(
      "[RoomReservationController] Error admin fetching reservations:",
      error
    );
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const updateReservationStatusAdmin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { reservationId } = req.params;
    const { status, notes_admin } = req.body;
    const schema = Joi.object({
      status: Joi.string()
        .valid(...Object.keys(statusLabels))
        .required(),
      notes_admin: Joi.string().allow(null, "").max(500).optional(),
    });
    const { error } = schema.validate({ status, notes_admin });
    if (error) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Невірний статус або нотатки", details: error.details });
    }

    const reservation = await RoomReservation.findById(
      reservationId,
      connection
    );
    if (!reservation) {
      await connection.rollback();
      return res.status(404).json({ error: "Бронювання не знайдено." });
    }

    const room = await Room.findById(reservation.room_id, connection);
    if (!room) {
      await connection.rollback();
      return res
        .status(404)
        .json({ error: "Кімната для цього бронювання не знайдена." });
    }

    if (
      req.user.role === "dorm_manager" &&
      String(req.user.dormitory_id) !== String(room.dormitory_id)
    ) {
      await connection.rollback();
      return res
        .status(403)
        .json({ error: "Ви не можете керувати бронюваннями для цього гуртожитку." });
    }

    const oldStatus = reservation.status;
    let roomUpdateData = {};

    // Логіка оновлення occupied_places та current_gender_occupancy
    if (
      status === "confirmed" && // Якщо новий статус "confirmed"
      oldStatus !== "confirmed" && oldStatus !== "checked_in" // і старий статус НЕ був "confirmed" або "checked_in"
    ) {
      if (room.occupied_places >= room.capacity) {
        await connection.rollback();
        return res
          .status(409)
          .json({ error: "Неможливо підтвердити: кімната вже повна." });
      }
      const studentGender = reservation.user_gender; // Отримуємо стать студента з даних бронювання
      console.log("[updateReservationStatusAdmin] Admin ID:", req.user.userId);
      console.log("[updateReservationStatusAdmin] Student Gender from reservation object:", studentGender);
      console.log("[updateReservationStatusAdmin] Room Gender Type:", room.gender_type);

      // Перевірка сумісності статі
      if (room.gender_type === "male" && studentGender !== "male") {
        await connection.rollback();
        return res
          .status(403)
          .json({ error: "Ця кімната для хлопців, а студент - дівчина." });
      }
      if (room.gender_type === "female" && studentGender !== "female") {
        await connection.rollback();
        return res
          .status(403)
          .json({ error: "Ця кімната для дівчат, а студент - хлопець." });
      }
      if (
        room.gender_type === "any" &&
        room.current_gender_occupancy !== "empty" &&
        room.current_gender_occupancy !== studentGender
      ) {
        await connection.rollback();
        const genderLabel = room.current_gender_occupancy === 'male' ? 'хлопцями' : 'дівчатами';
        return res.status(403).json({
          error: `Неможливо поселити. Кімната вже частково зайнята ${genderLabel}.`,
        });
      }
      // Якщо все гаразд, збільшуємо кількість зайнятих місць
      roomUpdateData.occupied_places = room.occupied_places + 1;
      // Якщо кімната типу 'any' і була порожньою, встановлюємо стать першого поселенця
      if (
        room.gender_type === "any" &&
        room.current_gender_occupancy === "empty" &&
        studentGender && studentGender !== 'not_specified' && studentGender !== 'other'
      ) {
        roomUpdateData.current_gender_occupancy = studentGender;
      }
    } else if (
      // Якщо бронювання скасовується або завершується, а раніше було підтверджено/заселено
      (status === "rejected_by_admin" ||
        status === "cancelled_by_user" ||
        status === "checked_out" || status === "expired") &&
      (oldStatus === "confirmed" || oldStatus === "checked_in")
    ) {
      roomUpdateData.occupied_places = Math.max(0, room.occupied_places - 1);
      // Якщо після звільнення місця кімната типу 'any' або 'mixed' стала порожньою, скидаємо стать
      if (roomUpdateData.occupied_places === 0 && (room.gender_type === 'any' || room.gender_type === 'mixed')) {
        roomUpdateData.current_gender_occupancy = "empty";
      }
    }

    if (Object.keys(roomUpdateData).length > 0) {
      await Room.update(room.id, roomUpdateData, connection);
    }

    const updated = await RoomReservation.updateStatus(
      reservationId,
      status,
      connection,
      req.user.userId,
      notes_admin
    );
    if (!updated) {
      await connection.rollback();
      return res
        .status(500)
        .json({ error: "Не вдалося оновити статус бронювання." });
    }

    // Сповіщення студенту
    let studentNotificationTitle = "Статус вашого бронювання оновлено";
    let studentNotificationDesc = `Статус вашого бронювання кімнати №${room.number
    } (гуртожиток ${room.dormitory_name || "N/A"}, ID бронювання: ${reservationId
    }) на ${reservation.academic_year} н.р. змінено на "${statusLabels[status] || status}".`; // Додано academic_year
    if (notes_admin) {
      studentNotificationDesc += ` Коментар адміністрації: ${notes_admin}`;
    }
    await Notification.create({
      user_id: reservation.user_id,
      title: studentNotificationTitle,
      description: studentNotificationDesc,
    });

    await connection.commit();
    res.json({ message: "Статус бронювання оновлено." });
  } catch (error) {
    await connection.rollback();
    console.error(
      "[RoomReservationController] Error updating reservation status by admin:",
      error
    );
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};