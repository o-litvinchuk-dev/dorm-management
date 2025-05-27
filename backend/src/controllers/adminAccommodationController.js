import Joi from "joi";
import pool from "../config/db.js";
import AccommodationApplication from "../models/AccommodationApplication.js";
import Notification from "../models/Notification.js";
import { DormitoryPassService } from "../services/dormitoryPassService.js";
import DormitoryPass from "../models/DormitoryPass.js";
import Room from "../models/Room.js";

const statusLabels = {
    pending: "Очікує",
    approved: "Затверджено",
    rejected: "Відхилено",
    approved_by_faculty: "Затверджено деканатом",
    rejected_by_faculty: "Відхилено деканатом",
    approved_by_dorm: "Затверджено гуртожитком",
    rejected_by_dorm: "Відхилено гуртожитком",
    settled: "Поселено",
    cancelled_by_user: "Скасовано користувачем"
};

export const getAccommodationApplications = async (req, res) => {
  try {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().allow("").default(""),
      status: Joi.string().valid("pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled", "").allow("").default(""),
      dateFrom: Joi.date().iso().allow("").default(""),
      dateTo: Joi.date().iso().allow("").default(""),
      dormNumber: Joi.string().allow("").default(""),
      sortBy: Joi.string()
        .valid("id", "full_name", "email", "dorm_number", "status", "created_at", "application_date", "updated_at", "start_date", "end_date")
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
    
    const effectiveFilters = {
        ...validatedQueryFilters,
        applicationDateFrom: validatedQueryFilters.dateFrom,
        applicationDateTo: validatedQueryFilters.dateTo,
    };
    delete effectiveFilters.dateFrom;
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
        const { status, room_id: roomIdFromRequest } = req.body;

        const allowedStatuses = {
            faculty_dean_office: ["approved_by_faculty", "rejected_by_faculty"],
            dorm_manager: ["approved_by_dorm", "rejected_by_dorm", "settled"],
            admin: ["pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled"],
            superadmin: ["pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled"],
        };

        const schema = Joi.object({
            id: Joi.number().integer().positive().required(),
            status: Joi.string().valid(...Object.values(allowedStatuses).flat()).required(),
            room_id: Joi.number().integer().positive().optional().allow(null)
        });

        const { error } = schema.validate({ id, status, room_id: roomIdFromRequest });
        if (error) {
            console.error("[AdminACtrl] Joi validation error for status update:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        if (!allowedStatuses[req.user.role]?.includes(status)) {
            console.log(`[AdminACtrl] Access denied for user ${req.user.userId} (role: ${req.user.role}) to set status ${status}. Allowed: ${allowedStatuses[req.user.role]?.join(', ')}`);
            return res.status(403).json({ error: "Немає прав для зміни на цей статус" });
        }

        const applicationFromDb = await AccommodationApplication.findById(id);
        if (!applicationFromDb) {
            console.log(`[AdminACtrl] Application ${id} not found`);
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (applicationFromDb.dormitory_id !== req.user.dormitory_id) {
                console.log(`[AdminACtrl] Access denied for dorm_manager ${req.user.userId} to app ${id}. User manages ${req.user.dormitory_id}, app is for ${applicationFromDb.dormitory_id}`);
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
            const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (applicationFromDb.faculty_id !== req.user.faculty_id && !managedDormIds.includes(applicationFromDb.dormitory_id)) {
                console.log(`[AdminACtrl] Access denied for faculty_dean_office ${req.user.userId} to app ${id}. User manages faculty ${req.user.faculty_id} (dorms: ${managedDormIds.join(',')}), app is for faculty ${applicationFromDb.faculty_id} and dorm ${applicationFromDb.dormitory_id}`);
                return res.status(403).json({ error: "Доступ обмежено до керованих гуртожитків або заявок вашого факультету" });
            }
        }

        const updated = await AccommodationApplication.updateStatus(id, status, status === 'settled' ? roomIdFromRequest : null);
        if (!updated) {
            console.log(`[AdminACtrl] Failed to update status for application ${id}. No changes or application not found.`);
            return res.status(500).json({ error: "Не вдалося оновити статус заявки. Можливо, заявку не знайдено або дані не змінились." });
        }

        const applicationForPass = await AccommodationApplication.findById(id);
        let triggerPassGeneration = false;
        let roomIdToUseForPass = null;

        if (status === 'settled') {
            triggerPassGeneration = true;
            roomIdToUseForPass = roomIdFromRequest || applicationForPass?.current_room_id_from_settlement || applicationForPass?.room_id;
        } else if (req.user.role === 'dorm_manager' && status === 'approved_by_dorm') {
            triggerPassGeneration = true;
            roomIdToUseForPass = roomIdFromRequest || applicationForPass?.preferred_room;
        } else if (req.user.role === 'faculty_dean_office' && status === 'approved_by_faculty') {
            triggerPassGeneration = true;
            roomIdToUseForPass = applicationForPass?.preferred_room;
        } else if (['admin', 'superadmin'].includes(req.user.role) && status === 'approved') {
            triggerPassGeneration = true;
            roomIdToUseForPass = roomIdFromRequest || applicationForPass?.preferred_room;
        }

        if (triggerPassGeneration && applicationForPass) {
            try {
                console.log(`[AdminACtrl] Triggering pass generation for app ${applicationForPass.id} with status ${status}, roomID for pass: ${roomIdToUseForPass}`);
                await DormitoryPassService.ensurePassForApplication(applicationForPass.id, req.user.userId, roomIdToUseForPass);
            } catch (passError) {
                console.error(`[AdminACtrl] Failed to ensure pass for application ${applicationForPass.id}:`, passError);
            }
        }

        if (applicationFromDb) {
            let notificationDescription = `Ваша заявка (ID: ${id}) отримала новий статус: ${statusLabels[status] || status}.`;
            if (status === 'settled' || (status === 'approved_by_dorm' && roomIdToUseForPass) || (status === 'approved_by_faculty' && roomIdToUseForPass && applicationForPass.preferred_room === roomIdToUseForPass)) {
                const updatedApplicationWithDetails = await AccommodationApplication.findById(id);
                const passDetails = await DormitoryPass.findActiveByUserId(applicationFromDb.user_id);
                const roomNumberForNotification = passDetails?.room_display_number ||
                    updatedApplicationWithDetails?.display_room_info ||
                    (roomIdToUseForPass ? (await Room.findById(roomIdToUseForPass))?.number : null) ||
                    applicationFromDb.preferred_room ||
                    'не визначено';

                notificationDescription += ` Вас призначено/поселено в кімнату ${roomNumberForNotification}. Перепустку згенеровано/оновлено.`;
            }
            await Notification.create({
                user_id: applicationFromDb.user_id,
                title: "Оновлення статусу заявки на поселення",
                description: notificationDescription,
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

        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (application.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        } else if (
            ["student_council_head"].includes(req.user.role) &&
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
        } else if (!["admin", "superadmin", "student_council_head"].includes(req.user.role)) {
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