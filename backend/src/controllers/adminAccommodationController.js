import Joi from "joi";
import pool from "../config/db.js";
import AccommodationApplication from "../models/AccommodationApplication.js";
import Notification from "../models/Notification.js";

export const getAccommodationApplications = async (req, res) => {
  try {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().allow("").default(""),
      status: Joi.string().valid("pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled", "").allow("").default(""),
      // Повертаємо dateFrom/dateTo для фільтрації по даті подачі заявки
      dateFrom: Joi.date().iso().allow("").default(""), // Будемо використовувати як applicationDateFrom
      dateTo: Joi.date().iso().allow("").default(""),   // Будемо використовувати як applicationDateTo
      dormNumber: Joi.string().allow("").default(""),
      sortBy: Joi.string()
        .valid("id", "full_name", "email", "dorm_number", "status", "created_at", "application_date", "updated_at", "start_date", "end_date") // Додано start_date, end_date
        .default("created_at"),
      sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    });

    const { error, value: validatedQueryFilters } = schema.validate(req.query);

    if (error) {
      console.error("[AdminAccommodationController] Joi validation error:", error.details);
      return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
    }

    if (!req.user) {
      console.error("[AdminAccommodationController] No user in request");
      return res.status(401).json({ error: "Користувач не авторизований" });
    }
    
    // Перейменовуємо dateFrom/dateTo для передачі в модель, якщо вони для application_date
    const effectiveFilters = {
        ...validatedQueryFilters,
        applicationDateFrom: validatedQueryFilters.dateFrom, // Передаємо як applicationDateFrom
        applicationDateTo: validatedQueryFilters.dateTo,     // Передаємо як applicationDateTo
    };
    delete effectiveFilters.dateFrom; // Видаляємо старі ключі, щоб уникнути плутанини
    delete effectiveFilters.dateTo;

    console.log("[AdminACtrl] Initial req.query:", JSON.stringify(req.query));
    console.log("[AdminACtrl] Validated Query (from Joi):", JSON.stringify(validatedQueryFilters));
    console.log("[AdminACtrl] req.user for filtering:", JSON.stringify({
      userId: req.user.userId,
      role: req.user.role,
      faculty_id: req.user.faculty_id,
      dormitory_id: req.user.dormitory_id,
    }));

    if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
      effectiveFilters.dormitory_id_for_filter = req.user.dormitory_id; 
      if (effectiveFilters.hasOwnProperty('dormNumber')) {
          console.log(`[AdminACtrl] dorm_manager (ID: ${req.user.userId}, UserDormID: ${req.user.dormitory_id}), ignoring dormNumber filter ('${effectiveFilters.dormNumber}') from query. Using user's dormitory_id for filtering.`);
          delete effectiveFilters.dormNumber; 
      }
       console.log(`[AdminACtrl] dorm_manager: Set dormitory_id_for_filter to ${effectiveFilters.dormitory_id_for_filter}`);
    } else if (
      ["student_council_head", "student_council_member"].includes(req.user.role) &&
      req.user.faculty_id
    ) {
      effectiveFilters.faculty_id_for_filter = req.user.faculty_id;
      console.log(`[AdminACtrl] student_council: Set faculty_id_for_filter to ${effectiveFilters.faculty_id_for_filter}`);
    } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
      const [dormitories] = await pool.query(
        `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
        [req.user.faculty_id]
      );
      const managedDormIds = dormitories.map(d => d.dormitory_id);
      effectiveFilters.managedDormIds_for_filter = managedDormIds;
      effectiveFilters.faculty_id_for_filter = req.user.faculty_id;
      if (effectiveFilters.dormNumber && managedDormIds.includes(parseInt(effectiveFilters.dormNumber))) {
        effectiveFilters.dormitory_id_for_filter = parseInt(effectiveFilters.dormNumber);
        console.log(`[AdminACtrl] faculty_dean_office: Filtering by specific dormNumber ${effectiveFilters.dormNumber} (which is managed).`);
      } else if (effectiveFilters.dormNumber && !managedDormIds.includes(parseInt(effectiveFilters.dormNumber))) {
        console.warn(`[AdminACtrl] faculty_dean_office: Attempted to filter by dormNumber ${effectiveFilters.dormNumber}, which is NOT managed. Clearing results.`);
        effectiveFilters.force_no_results = true; 
      }
      console.log(`[AdminACtrl] faculty_dean_office: Set faculty_id_for_filter to ${req.user.faculty_id}, managedDormIds_for_filter: [${managedDormIds.join(', ')}]`);
    } else if (!["admin", "superadmin"].includes(req.user.role)) {
      console.warn(`[AdminACtrl] User role ${req.user.role} has no default access to all applications. Returning forbidden.`);
      return res.status(403).json({ error: "Немає доступу до перегляду заявок для вашої ролі." });
    }

    effectiveFilters.requestingUserRole = req.user.role; 

    console.log("[AdminACtrl] Effective Filters PASSED TO MODEL:", JSON.stringify(effectiveFilters));

    // Модель AccommodationApplication.findAll вже оновлена для роботи з start_date, end_date,
    // і може приймати applicationDateFrom/To для фільтрації по даті подачі
    const result = await AccommodationApplication.findAll(effectiveFilters);
    res.json(result);
  } catch (error) {
    console.error("[AdminAccommodationController] Помилка отримання заявок:", {
      message: error.message,
      stack: error.stack, 
      query: req.query,
      user: req.user ? {id: req.user.userId, role: req.user.role} : "No user",
    });
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  }
};

export const getAccommodationApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.number().integer().positive().required();
        const { error } = schema.validate(id);
        if (error) {
            console.error("[AdminACtrl] Joi validation error for ID:", error.details);
            return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (application.dormitory_id !== req.user.dormitory_id) {
                console.log(`[AdminACtrl] Access denied for dorm_manager ${req.user.userId} to app ${id}. User manages ${req.user.dormitory_id}, app is for ${application.dormitory_id}`);
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        } else if (
            ["student_council_head", "student_council_member"].includes(req.user.role) &&
            req.user.faculty_id
        ) {
            if (application.faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
            }
        } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
            // Декан має бачити заявки свого факультету АБО заявки на гуртожитки, що закріплені за його факультетом
            const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);

            if (application.faculty_id !== req.user.faculty_id && !managedDormIds.includes(application.dormitory_id)) {
                console.log(`[AdminACtrl] Access denied for faculty_dean_office ${req.user.userId} to app ${id}. User manages faculty ${req.user.faculty_id} (dorms: ${managedDormIds.join(',')}), app is for faculty ${application.faculty_id} and dorm ${application.dormitory_id}`);
                return res.status(403).json({ error: "Доступ обмежено: заявка не стосується вашого факультету або керованих ним гуртожитків." });
            }
        } else if (!["admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Немає доступу до цієї заявки" });
        }

        res.json(application);
    } catch (error) {
        console.error("[AdminACtrl] Помилка отримання заявки:", {
            message: error.message,
            params: req.params,
            user: req.user ? {id: req.user.userId, role: req.user.role} : "No user",
        });
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, room_id } = req.body; // room_id тепер може прийти з фронтенду

        const allowedStatuses = {
            faculty_dean_office: ["approved_by_faculty", "rejected_by_faculty"],
            dorm_manager: ["approved_by_dorm", "rejected_by_dorm", "settled"],
            admin: ["pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled"],
            superadmin: ["pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled"],
        };

        const schema = Joi.object({
            id: Joi.number().integer().positive().required(),
            status: Joi.string().valid(...Object.values(allowedStatuses).flat()).required(),
            room_id: Joi.number().integer().positive().optional().allow(null) // Валідація для room_id
        });

        const { error } = schema.validate({ id, status, room_id }); // Валідуємо всі дані
        if (error) {
            console.error("[AdminACtrl] Joi validation error for status update:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        if (!allowedStatuses[req.user.role]?.includes(status)) {
            return res.status(403).json({ error: "Немає прав для зміни на цей статус" });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        // Перевірки доступу до оновлення (аналогічні до getById)
        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (application.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
             const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (application.faculty_id !== req.user.faculty_id && !managedDormIds.includes(application.dormitory_id)) {
                 return res.status(403).json({ error: "Доступ обмежено до керованих гуртожитків або заявок вашого факультету" });
            }
        }

        // Важливо: Модель AccommodationApplication.updateStatus має бути адаптована для прийому room_id
        // Або тут має бути додатковий запит для оновлення room_id в заявці, якщо статус 'settled'
        const updated = await AccommodationApplication.updateStatus(id, status, room_id); 

        if (!updated) {
            return res.status(500).json({ error: "Не вдалося оновити статус заявки. Можливо, заявку не знайдено або дані не змінились." });
        }

        if (application) { // 'application' тут це стан *до* оновлення
            await Notification.create({
                user_id: application.user_id,
                title: "Оновлення статусу заявки на поселення",
                description: `Ваша заявка (ID: ${id}) отримала новий статус: ${status}. ${status === 'settled' && room_id ? `Вас поселено в кімнату (ID: ${room_id}).` : ''}`,
            });
        }

        res.json({ message: "Статус успішно оновлено" });
    } catch (error) {
        console.error("[AdminACtrl] Помилка оновлення статусу:", {
            message: error.message,
            params: req.params,
            body: req.body,
            user: req.user ? {id: req.user.userId, role: req.user.role} : "No user",
        });
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const addApplicationComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const admin_id = req.user?.userId;

        const schema = Joi.object({
            id: Joi.number().integer().positive().required(),
            comment: Joi.string().min(1).max(1000).required(),
        });

        const { error } = schema.validate({ id, comment });
        if (error) {
            console.error("[AdminACtrl] Joi validation error for comment:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        if (!admin_id) {
            console.error("[AdminACtrl] No userId in request for admin_id");
            return res.status(401).json({ error: "Користувач не авторизований для додавання коментаря" });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        // Перевірки доступу (аналогічні до getById)
        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (application.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        } else if (
            ["student_council_head"].includes(req.user.role) && // student_council_member НЕ МОЖЕ коментувати згідно з логікою (хоча політика дозволяє)
            req.user.faculty_id
        ) {
            if (application.faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
            }
        } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
            const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (application.faculty_id !== req.user.faculty_id && !managedDormIds.includes(application.dormitory_id)) {
                 return res.status(403).json({ error: "Доступ обмежено: заявка не стосується вашого факультету або керованих ним гуртожитків." });
            }
        } else if (!["admin", "superadmin", "student_council_head"].includes(req.user.role)) { // Перевіряємо, чи роль має право коментувати
            return res.status(403).json({ error: "Немає доступу до додавання коментарів" });
        }


        const commentId = await AccommodationApplication.addComment({
            application_id: id,
            admin_id,
            comment,
        });
        
        const [newlyAddedCommentRow] = await pool.query(
            `SELECT ac.id, ac.application_id, ac.admin_id, ac.comment, ac.created_at, u.name AS admin_name 
             FROM application_comments ac JOIN users u ON ac.admin_id = u.id 
             WHERE ac.id = ?`, [commentId]
        );

        res.status(201).json({ message: "Коментар успішно додано", comment: newlyAddedCommentRow[0] });
    } catch (error) {
        console.error("[AdminACtrl] Помилка додавання коментаря:", {
            message: error.message,
            params: req.params,
            body: req.body,
            user: req.user ? {id: req.user.userId, role: req.user.role} : "No user",
        });
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const getApplicationComments = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.number().integer().positive().required();
        const { error } = schema.validate(id);

        if (error) {
            console.error("[AdminACtrl] Joi validation error for comments:", error.details);
            return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        // Перевірки доступу (аналогічні до getById)
         if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (application.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        } else if (
            ["student_council_head", "student_council_member"].includes(req.user.role) &&
            req.user.faculty_id
        ) {
            if (application.faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
            }
        } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
             const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (application.faculty_id !== req.user.faculty_id && !managedDormIds.includes(application.dormitory_id)) {
                 return res.status(403).json({ error: "Доступ обмежено: заявка не стосується вашого факультету або керованих ним гуртожитків." });
            }
        } else if (!["admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Немає доступу до коментарів" });
        }


        const comments = await AccommodationApplication.findCommentsByApplicationId(id);
        res.json(comments);
    } catch (error) {
        console.error("[AdminACtrl] Помилка отримання коментарів:", {
            message: error.message,
            params: req.params,
            user: req.user ? {id: req.user.userId, role: req.user.role} : "No user",
        });
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};