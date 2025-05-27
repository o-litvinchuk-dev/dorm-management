import pool from "../config/db.js";
import Dormitory from "../models/Dormitory.js";
import Settlement from "../models/Settlement.js";
import AccommodationApplication from "../models/AccommodationApplication.js";
import Joi from "joi";
import User from "../models/User.js"; // Потрібно для перевірки faculty_id
import { SettlementContract } from "../models/SettlementContract.js";
import DormitoryPass from "../models/DormitoryPass.js";
import Event from "../models/Event.js";

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    let facultyId = req.user.faculty_id; // Змінено на let для можливості оновлення
    const dormitoryIdFromUser = req.user.dormitory_id;

    // ЗАПИТ ВИПРАВЛЕНО: використовуємо accommodation_applications та аліас aa
    let applicationsQuery = `
      SELECT aa.id, aa.status, aa.created_at,
             d.name as dormitory_name,
             f.name as faculty_name_display,
             u.email as user_email_for_application, u.name as user_full_name_for_application
      FROM accommodation_applications aa 
      LEFT JOIN users u ON aa.user_id = u.id
      LEFT JOIN dormitories d ON aa.dormitory_id = d.id
      LEFT JOIN faculties f ON aa.faculty_id = f.id`;

    const queryParams = [];
    let whereClauses = [];

    if (role === "student") {
      whereClauses.push(`aa.user_id = ?`);
      queryParams.push(userId);
    } else if (["faculty_dean_office", "student_council_head", "student_council_member"].includes(role)) {
      if (!facultyId) {
        const userFromDB = await User.findById(userId);
        if (!userFromDB?.faculty_id) {
          return res.status(403).json({ error: "Факультет не визначено для вашої ролі. Оновіть профіль.", code: "PROFILE_INCOMPLETE_FACULTY" });
        }
        facultyId = userFromDB.faculty_id; // Оновлюємо локальну змінну facultyId
        req.user.faculty_id = facultyId; 
        whereClauses.push(`aa.faculty_id = ?`);
        queryParams.push(facultyId);
      } else {
        whereClauses.push(`aa.faculty_id = ?`);
        queryParams.push(facultyId);
      }
    } else if (role === "dorm_manager") {
      if (!dormitoryIdFromUser) {
         return res.status(403).json({ error: "Гуртожиток не визначено для вашої ролі. Зверніться до адміністратора.", code: "DORMITORY_NOT_ASSIGNED" });
      }
      whereClauses.push(`aa.dormitory_id = ?`);
      queryParams.push(dormitoryIdFromUser);
    }
    // admin та superadmin бачать всі заявки, якщо немає інших фільтрів у цьому конкретному запиті

    if (whereClauses.length > 0) {
      applicationsQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }
    applicationsQuery += ` ORDER BY aa.created_at DESC LIMIT 5`;

    let applications = [];
    if (role === "superadmin" || role === "admin" || whereClauses.length > 0) {
        [applications] = await pool.execute(applicationsQuery, queryParams);
    }

    const [notifications] = await pool.execute(
      `SELECT id, title, description, created_at, \`read\`
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    res.json({
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      applications,
      notifications,
    });

  } catch (error) {
    console.error("[SecureController] Помилка отримання даних дашборду:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    let facultyId = req.user.faculty_id; // Змінено на let
    const dormitoryIdFromUser = req.user.dormitory_id;

    // Використовуємо accommodation_applications та аліас aa
    let query = `SELECT aa.*, u.email, d.name as dormitory_name, f.name as faculty_name_display
                 FROM accommodation_applications aa
                 JOIN users u ON aa.user_id = u.id
                 LEFT JOIN dormitories d ON aa.dormitory_id = d.id
                 LEFT JOIN faculties f ON aa.faculty_id = f.id`;

    const queryParams = [];
    let whereClauses = [];

    if (role === "student") {
      whereClauses.push(`aa.user_id = ?`);
      queryParams.push(userId);
    } else if (role === "faculty_dean_office") {
        if (!facultyId) {
            const userFromDB = await User.findById(userId);
            if (!userFromDB?.faculty_id) {
              return res.status(403).json({ error: "Профіль не завершено. Будь ласка, оберіть факультет.", code: "PROFILE_INCOMPLETE_FACULTY" });
            }
            facultyId = userFromDB.faculty_id; // Оновлюємо локальну змінну
            req.user.faculty_id = facultyId; 
        }
        whereClauses.push(`aa.faculty_id = ?`);
        queryParams.push(facultyId);
    } else if (role === "admin") {
        // Адміністратор може бачити заявки свого факультету, якщо він призначений, або всі
        if (facultyId) {
            whereClauses.push(`aa.faculty_id = ?`);
            queryParams.push(facultyId);
        }
        // Якщо у admin немає facultyId, він бачить всі (фільтр не додається)
    } else if (role === "dorm_manager") {
      // Для dorm_manager, якщо потрібно фільтрувати по гуртожитку саме в цьому запиті,
      // а не через AdminAccommodationController
      if (dormitoryIdFromUser) {
        whereClauses.push(`aa.dormitory_id = ?`);
        queryParams.push(dormitoryIdFromUser);
      } else {
        // Можливо, варто повернути помилку, якщо коменданту не призначено гуртожиток
        return res.status(403).json({ error: "Гуртожиток не визначено для коменданта." });
      }
    } else if (role !== "superadmin") { // superadmin бачить все
      return res.status(403).json({ error: "Немає доступу до заявок" });
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }
    query += ` ORDER BY aa.created_at DESC LIMIT 10`;
    
    const [rows] = await pool.execute(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error("[SecureController] Помилка отримання заявок:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getDormitories = async (req, res) => {
  try {
    const role = req.user.role;
    let facultyId = req.user.faculty_id;
    const dormitoryId = req.user.dormitory_id;
    let dormitories;

    if (role === "dorm_manager" && dormitoryId) {
      const dorm = await Dormitory.findById(dormitoryId);
      dormitories = dorm ? [dorm] : [];
    } else if ((role === "admin" || role === "faculty_dean_office") && facultyId) {
      const [linkedDorms] = await pool.query(
      `SELECT d.* FROM dormitories d
      JOIN faculty_dormitories fd ON d.id = fd.dormitory_id
      WHERE fd.faculty_id = ?`,
      [facultyId]
      );
      dormitories = linkedDorms;
    } else { // student, superadmin, admin без faculty_id та інші ролі, що мають загальний доступ
      dormitories = await Dormitory.findAll();
    }
    res.json(dormitories);
  } catch (error) {
    console.error("[SecureController] Помилка отримання гуртожитків:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getSettlements = async (req, res) => {
  try {
    const role = req.user.role;
    let facultyId = req.user.faculty_id;
    const dormitoryId = req.user.dormitory_id;
    let settlements;

    if (role === "dorm_manager" && dormitoryId) {
      // Припускаємо, що Settlement.findAll може приймати фільтри або потрібен інший метод
      const [settlementRows] = await pool.query(
        `SELECT s.* FROM settlements s WHERE s.dormitory_id = ?`,
        [dormitoryId]
      );
      settlements = settlementRows;
    } else if ((role === "admin" || role === "faculty_dean_office") && facultyId) {
      const [linkedSettlements] = await pool.query(
      // Запит для faculty_dean_office може бути складнішим,
      // якщо settlement не прив'язаний напряму до faculty, а через user або application
      `SELECT s.* FROM settlements s 
       JOIN accommodation_applications aa ON s.application_id = aa.id 
       WHERE aa.faculty_id = ?`, // Приклад, якщо зв'язок через заявки
      [facultyId]
      );
      settlements = linkedSettlements;
    } else { // student, superadmin, admin без faculty_id та інші
      settlements = await Settlement.findAll();
    }
    res.json(settlements);
  } catch (error) {
    console.error("[SecureController] Помилка отримання розкладу поселення:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getAccommodationApplications = async (req, res) => {
  try {
    // Цей ендпоінт дублює функціонал /admin/accommodation-applications
    // Якщо він потрібен саме тут, переконайтеся, що права доступу коректні
    // і він не конфліктує з adminAccommodationController.
    // Поточна реалізація буде такою ж, як в adminAccommodationController, але викликана звідси
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    let filter = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      requestingUserRole: req.user.role,
    };

    if (["faculty_dean_office", "student_council_head", "student_council_member"].includes(req.user.role)) {
      if (!req.user.faculty_id) {
        return res.status(403).json({ error: "Факультет не вказаний для цієї ролі" });
      }
      filter.faculty_id_for_filter = req.user.faculty_id;
    } else if (req.user.role === "dorm_manager") {
      if (!req.user.dormitory_id) {
        return res.status(403).json({ error: "Гуртожиток не вказаний для цієї ролі" });
      }
      filter.dormitory_id_for_filter = req.user.dormitory_id;
    } else if (!["admin", "superadmin"].includes(req.user.role)){
       return res.status(403).json({ error: "Немає доступу до заявок на проживання" });
    }
    
    const result = await AccommodationApplication.findAll(filter);
    res.json({
      applications: result.applications,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[SecureController] Помилка отримання заявок на проживання:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getMyAccommodationApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().allow("").default(""),
      status: Joi.string().valid("pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled", "").allow("").default(""),
    });

    const { error, value } = schema.validate({ page, limit, search, status });

    if (error) {
      console.error("[SecureController] Joi validation error for getMyAccommodationApplications:", error.details);
      return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
    }

    const filter = {
      userId,
      page: parseInt(value.page),
      limit: parseInt(value.limit),
      search: value.search,
      status: value.status,
      requestingUserRole: req.user.role,
    };

    const result = await AccommodationApplication.findAll(filter);
    res.json({
      applications: result.applications,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    console.error("[SecureController] Помилка отримання власних заявок:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const createAccommodationApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    if (role !== "student") {
      return res.status(403).json({ error: "Тільки студенти можуть подавати заявки" });
    }

    const [userProfileRows] = await pool.query(
      `SELECT up.faculty_id, up.group_id, up.course, u.name as full_name, u.email as email, up.phone as phone_number
       FROM user_profiles up
       JOIN users u ON u.id = up.user_id
       WHERE up.user_id = ?`, [userId]
    );

    if (!userProfileRows[0]) {
      return res.status(400).json({ error: "Профіль користувача не знайдено. Будь ласка, заповніть профіль.", code: "PROFILE_NOT_FOUND" });
    }
    const userProfile = userProfileRows[0];
    if (!userProfile.faculty_id || !userProfile.group_id || !userProfile.course || !userProfile.full_name || !userProfile.phone_number) {
      return res.status(400).json({ error: "Не всі дані в профілі заповнені (факультет, група, курс, ПІБ, телефон). Будь ласка, оновіть профіль.", code: "PROFILE_INCOMPLETE_FOR_APP" });
    }

    const schema = Joi.object({
        dormitory_id: Joi.number().integer().positive().required().messages({'any.required': "ID гуртожитку є обов'язковим"}),
        application_date: Joi.date().iso().required().messages({'any.required': "Дата подачі заявки є обов'язковою"}),
        start_date: Joi.date().iso().min(new Date().toISOString().split('T')[0]).required().messages({'any.required': "Дата початку проживання є обов'язковою", 'date.min': "Дата початку не може бути в минулому"}),
        end_date: Joi.date().iso().greater(Joi.ref('start_date')).required().messages({'any.required': "Дата кінця проживання є обов'язковою", 'date.greater': "Дата кінця має бути пізніше дати початку"}),
        preferred_room: Joi.string().max(10).allow(null, "").optional(),
        comments: Joi.string().max(1000).allow(null, "").optional(),
      }).unknown(false);

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorDetails = error.details.map(d => d.message);
      console.error("[SecureController] Joi validation error on create:", errorDetails);
      return res.status(400).json({ error: "Невірні вхідні дані", details: errorDetails });
    }

    const [existing] = await pool.execute(
      `SELECT id FROM accommodation_applications
       WHERE user_id = ? AND status IN ('pending', 'approved', 'approved_by_faculty', 'approved_by_dorm', 'settled') 
       AND DATE(start_date) = ? AND DATE(end_date) = ? AND dormitory_id = ?`,
      [userId, value.start_date.split('T')[0], value.end_date.split('T')[0], value.dormitory_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "У вас вже є активна заявка на цей період та гуртожиток" });
    }

    const [dormitory] = await pool.execute(
      `SELECT id FROM dormitories WHERE id = ?`,
      [value.dormitory_id]
    );
    if (!dormitory[0]) {
      return res.status(404).json({ error: "Гуртожиток не знайдено" });
    }
    
    const [facultyDormAccess] = await pool.query(
      'SELECT * FROM faculty_dormitories WHERE faculty_id = ? AND dormitory_id = ?',
      [userProfile.faculty_id, value.dormitory_id]
    );
    if (facultyDormAccess.length === 0) {
        return res.status(403).json({ error: "Ваш факультет не має доступу до цього гуртожитку." });
    }

    const applicationData = {
      user_id: userId,
      course: userProfile.course,
      group_id: userProfile.group_id,
      full_name: userProfile.full_name, // ПІБ з профілю користувача
      surname: userProfile.full_name.split(' ')[0], // Прізвище з ПІБ
      phone_number: userProfile.phone_number, // Телефон з профілю
      dormitory_id: value.dormitory_id,
      faculty_id: userProfile.faculty_id,
      application_date: value.application_date,
      start_date: value.start_date,
      end_date: value.end_date,
      preferred_room: value.preferred_room || null,
      comments: value.comments || null,
      status: "pending",
    };

    const createdApplicationId = await AccommodationApplication.create(applicationData);
    const createdApplication = await AccommodationApplication.findById(createdApplicationId); 

    res.status(201).json({ message: "Заявку успішно створено", application: createdApplication });
  } catch (error) {
    console.error("[SecureController] Помилка створення заявки:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getAccommodationApplicationById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { id } = req.params;

    const schema = Joi.number().integer().positive().required();
    const { error } = schema.validate(id);

    if (error) {
      console.error("[SecureController] Joi validation error for ID:", error.details);
      return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
    }

    const application = await AccommodationApplication.findById(id);

    if (!application) {
      return res.status(404).json({ error: "Заявку не знайдено" });
    }

    if (role === "student" && application.user_id !== userId) {
      return res.status(403).json({ error: "Доступ до цієї заявки обмежено" });
    } else if (role === "dorm_manager" && application.dormitory_id !== req.user.dormitory_id) {
      return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
    } else if (["student_council_head", "student_council_member"].includes(role) && application.faculty_id !== req.user.faculty_id) {
      return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
    } else if (role === "faculty_dean_office" && application.faculty_id !== req.user.faculty_id) {
      const [dormitories] = await pool.execute(
        `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
        [req.user.faculty_id]
      );
      const managedDormIds = dormitories.map(d => d.dormitory_id);
      if (!managedDormIds.includes(application.dormitory_id)) {
        return res.status(403).json({ error: "Доступ обмежено: заявка на гуртожиток не вашого факультету." });
      }
    } else if (!["admin", "superadmin"].includes(role) && application.user_id !== userId ) { 
       return res.status(403).json({ error: "Немає доступу до цієї заявки" });
    }

    res.json(application);
  } catch (error) {
    console.error("[SecureController] Помилка отримання заявки:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const cancelAccommodationApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { id } = req.params;

    const schema = Joi.number().integer().positive().required();
    const { error } = schema.validate(id);

    if (error) {
      console.error("[SecureController] Joi validation error for ID to cancel:", error.details);
      return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
    }

    const application = await AccommodationApplication.findById(id);

    if (!application) {
      return res.status(404).json({ error: "Заявку не знайдено" });
    }

    if (role !== "student" || application.user_id !== userId) {
      return res.status(403).json({ error: "Ви не можете скасувати цю заявку" });
    }
    
    if (!["pending", "approved_by_faculty"].includes(application.status)) {
      return res.status(400).json({ error: "Тільки заявки зі статусом 'Очікує' або 'Затверджено деканатом' можна скасувати." });
    }
    
    const updated = await AccommodationApplication.updateStatus(id, "rejected"); 

    if (!updated) {
      return res.status(500).json({ error: "Не вдалося скасувати заявку" });
    }

    res.json({ message: "Заявку успішно скасовано" });
  } catch (error) {
    console.error("[SecureController] Помилка скасування заявки:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getMySettlementAgreements = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status = "", sortBy = "created_at", sortOrder = "desc" } = req.query;

    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        status: Joi.string().valid("pending_review", "approved", "rejected", "archived", "").allow("").default(""),
        sortBy: Joi.string().valid("id", "contract_date", "status", "created_at").default("created_at"),
        sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    });

    const { error, value: validatedQueryFilters } = schema.validate({ page, limit, status, sortBy, sortOrder });

    if (error) {
        console.error("[SecureController] Joi validation error for getMySettlementAgreements:", error.details);
        return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
    }

    const result = await SettlementContract.findAllForUser(userId, validatedQueryFilters);
    res.json(result);
  } catch (error) {
      console.error("[SecureController] Помилка отримання власних договорів на поселення:", error);
      res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getSettlementAgreementByIdForUser = async (req, res) => {
  try {
      const userId = req.user.userId;
      const { id } = req.params;

      const schema = Joi.number().integer().positive().required();
      const { error: idError } = schema.validate(id);

      if (idError) {
          return res.status(400).json({ error: "Невірний ID договору", details: idError.details });
      }

      const contract = await SettlementContract.findByIdForUser(id, userId);
      if (!contract) {
          return res.status(404).json({ error: "Договір не знайдено або у вас немає доступу до нього" });
      }
      res.json(contract);
  } catch (error) {
      console.error("[SecureController] Помилка отримання договору за ID для користувача:", error);
      res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};
export const getMyRoommates = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Знайти активне поселення (перепустку) поточного користувача
    const activePass = await DormitoryPass.findActiveByUserId(userId);

    if (!activePass || (!activePass.room_id && !activePass.room_number_text)) {
      return res.json([]); // Немає активного поселення або інформації про кімнату
    }

    const { dormitory_id, room_id, room_number_text } = activePass;

    // 2. Знайти інших користувачів в тій самій кімнаті
    // Пріоритет room_id, якщо є, інакше room_number_text
    let roomCondition = "";
    const queryParams = [dormitory_id, userId];

    if (room_id) {
      roomCondition = "AND dp.room_id = ?";
      queryParams.splice(1, 0, room_id); // Вставляємо room_id перед userId
    } else if (room_number_text) {
      roomCondition = "AND dp.room_number_text = ?";
      queryParams.splice(1, 0, room_number_text);
    } else {
      // Якщо немає ні room_id, ні room_number_text у перепустці, то не можемо знайти сусідів
      return res.json([]);
    }
    
    // Запит для отримання сусідів
    const roommatesQuery = `
      SELECT
          u.id,
          u.name,
          u.avatar,
          u.email, -- Тимчасово для тестування, потім можна прибрати або зробити опціональним
          f.name AS faculty_name,
          up.course
      FROM
          users u
      INNER JOIN
          dormitory_passes dp ON u.id = dp.user_id
      LEFT JOIN
          user_profiles up ON u.id = up.user_id
      LEFT JOIN
          faculties f ON up.faculty_id = f.id 
      WHERE
          dp.dormitory_id = ?
          ${roomCondition}
          AND dp.status = 'active'
          AND dp.valid_until >= CURDATE()
          AND u.id != ? 
      GROUP BY u.id; 
    `;
    // Group By u.id щоб уникнути дублікатів, якщо студент має кілька перепусток (хоча логіка findActiveByUserId має це обробляти)

    const [roommates] = await pool.query(roommatesQuery, queryParams);
    
    res.json(roommates);

  } catch (error) {
    console.error("[SecureController][getMyRoommates] Помилка отримання сусідів:", error);
    res.status(500).json({ error: "Помилка сервера при отриманні списку сусідів", details: error.message });
  }
};
export const getSecureEvents = async (req, res) => {
  try {
    const { userId, role, dormitory_id, faculty_id, group_id, course } = req.user;
    const { category, dateFrom, dateTo } = req.query; // Example filters

    const filters = {};
    if (category) filters.category = category;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const events = await Event.findAllForUser(
      userId,
      role,
      dormitory_id,
      faculty_id,
      group_id,
      course,
      filters
    );
    res.json(events);
  } catch (error) {
    console.error("[SecureController] Помилка отримання подій:", error);
    res.status(500).json({ error: "Помилка сервера при отриманні подій" });
  }
};

export const getSecureEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Подію не знайдено" });
    }
    // Further authorization to check if user can see this specific event might be needed here
    // or can rely on Event.targets structure if Event.findById was enhanced.
    // For now, RBAC at route level is the primary guard.
    res.json(event);
  } catch (error) {
    console.error(`[SecureController] Помилка отримання події ${req.params.eventId}:`, error);
    res.status(500).json({ error: "Помилка сервера при отриманні події" });
  }
};
export default {
  getDashboardData,
  getApplications, 
  getDormitories,
  getSettlements,
  getAccommodationApplications, 
  getMyAccommodationApplications, 
  createAccommodationApplication, 
  getAccommodationApplicationById, 
  cancelAccommodationApplication, 
  getMySettlementAgreements,
  getSettlementAgreementByIdForUser,
  getMyRoommates,
  getSecureEvents,
  getSecureEventById,
};