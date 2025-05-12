import pool from "../config/db.js";
import Joi from "joi";
import AccommodationApplication from "../models/AccommodationApplication.js";
import Notification from "../models/Notification.js";

export const getAccommodationApplications = async (req, res) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().allow("").default(""),
            status: Joi.string().valid("pending", "approved", "rejected", "").allow("").default(""),
            dateFrom: Joi.date().iso().allow("").default(""),
            dateTo: Joi.date().iso().allow("").default(""),
            dormNumber: Joi.string().allow("").default(""),
            sortBy: Joi.string()
                .valid("id", "full_name", "email", "dorm_number", "status", "created_at", "application_date", "updated_at")
                .default("created_at"),
            sortOrder: Joi.string().valid("asc", "desc").default("desc"),
        });

        const { error, value } = schema.validate(req.query);
        if (error) {
            console.error("[AdminAccommodationController] Joi validation error:", error.details);
            return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
        }

        if (!req.user) {
            console.error("[AdminAccommodationController] No user in request");
            return res.status(401).json({ error: "Користувач не авторизований" });
        }

        // Role-based filtering
        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            value.dormitory_id = req.user.dormitory_id;
        } else if (
            ["student_council_head", "student_council_member"].includes(req.user.role) &&
            req.user.faculty_id
        ) {
            value.faculty_id = req.user.faculty_id;
        } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
            const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            value.managedDormIds = managedDormIds;
            value.requestingUserFacultyId = req.user.faculty_id;
        } else if (!["admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Немає доступу до заявок" });
        }

        value.requestingUserRole = req.user.role;

        const result = await AccommodationApplication.findAll(value);
        res.json(result);
    } catch (error) {
        console.error("[AdminAccommodationController] Помилка отримання заявок:", {
            message: error.message,
            stack: error.stack,
            query: req.query,
            user: req.user,
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
            console.error("[AdminAccommodationController] Joi validation error for ID:", error.details);
            return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        // Role-based access check
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
            if (application.faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
            }
            const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (!managedDormIds.includes(application.dormitory_id)) {
                return res.status(403).json({ error: "Доступ обмежено до керованих гуртожитків" });
            }
        } else if (!["admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Немає доступу до цієї заявки" });
        }

        res.json(application);
    } catch (error) {
        console.error("[AdminAccommodationController] Помилка отримання заявки:", {
            message: error.message,
            stack: error.stack,
            params: req.params,
            user: req.user,
        });
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = {
            faculty_dean_office: ["approved_by_faculty", "rejected_by_faculty"],
            dorm_manager: ["approved_by_dorm", "rejected_by_dorm", "settled"],
            admin: ["pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled"],
            superadmin: ["pending", "approved", "rejected", "approved_by_faculty", "rejected_by_faculty", "approved_by_dorm", "rejected_by_dorm", "settled"],
        };

        const schema = Joi.object({
            id: Joi.number().integer().positive().required(),
            status: Joi.string().valid(...Object.values(allowedStatuses).flat()).required(),
        });

        const { error } = schema.validate({ id, status });
        if (error) {
            console.error("[AdminAccommodationController] Joi validation error for status update:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        // Check if user role is allowed to update status
        if (!allowedStatuses[req.user.role]?.includes(status)) {
            return res.status(403).json({ error: "Немає прав для зміни на цей статус" });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        // Role-based access check
        if (req.user.role === "dorm_manager" && req.user.dormitory_id) {
            if (application.dormitory_id !== req.user.dormitory_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
            }
        } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
            if (application.faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
            }
            const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (!managedDormIds.includes(application.dormitory_id)) {
                return res.status(403).json({ error: "Доступ обмежено до керованих гуртожитків" });
            }
        }

        const updated = await AccommodationApplication.updateStatus(id, status);
        if (!updated) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        if (application) {
            await Notification.create({
                user_id: application.user_id,
                title: "Оновлення статусу заявки на поселення",
                description: `Ваша заявка (ID: ${id}) отримала новий статус: ${status}`,
            });
        }

        res.json({ message: "Статус успішно оновлено" });
    } catch (error) {
        console.error("[AdminAccommodationController] Помилка оновлення статусу:", {
            message: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            user: req.user,
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
            console.error("[AdminAccommodationController] Joi validation error for comment:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        if (!admin_id) {
            console.error("[AdminAccommodationController] No userId in request");
            return res.status(401).json({ error: "Користувач не авторизований" });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        // Role-based access check
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
            if (req.user.role === "student_council_member") {
                return res.status(403).json({ error: "Немає прав для додавання коментарів" });
            }
        } else if (req.user.role === "faculty_dean_office" && req.user.faculty_id) {
            if (application.faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
            }
            const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (!managedDormIds.includes(application.dormitory_id)) {
                return res.status(403).json({ error: "Доступ обмежено до керованих гуртожитків" });
            }
        } else if (!["admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Немає доступу до додавання коментарів" });
        }

        const commentId = await AccommodationApplication.addComment({
            application_id: id,
            admin_id,
            comment,
        });

        const [newComment] = await AccommodationApplication.findCommentsByApplicationId(id);
        res.status(201).json({ message: "Коментар успішно додано", comment: newComment });
    } catch (error) {
        console.error("[AdminAccommodationController] Помилка додавання коментаря:", {
            message: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            user: req.user,
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
            console.error("[AdminAccommodationController] Joi validation error for comments:", error.details);
            return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        // Role-based access check
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
            if (application.faculty_id !== req.user.faculty_id) {
                return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
            }
            const [dormitories] = await pool.query(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (!managedDormIds.includes(application.dormitory_id)) {
                return res.status(403).json({ error: "Доступ обмежено до керованих гуртожитків" });
            }
        } else if (!["admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Немає доступу до коментарів" });
        }

        const comments = await AccommodationApplication.findCommentsByApplicationId(id);
        res.json(comments);
    } catch (error) {
        console.error("[AdminAccommodationController] Помилка отримання коментарів:", {
            message: error.message,
            stack: error.stack,
            params: req.params,
            user: req.user,
        });
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};