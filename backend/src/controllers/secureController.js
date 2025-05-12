import pool from "../config/db.js";
import DormApplication from "../models/DormApplication.js";
import Dormitory from "../models/Dormitory.js";
import Settlement from "../models/Settlement.js";
import AccommodationApplication from "../models/AccommodationApplication.js";
import Joi from "joi";

export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const facultyId = req.user.faculty_id;
        const dormitoryId = req.user.dormitory_id;

        let applicationsQuery = `SELECT * FROM dorm_applications`;
        const queryParams = [];

        if (role === "student") {
            applicationsQuery += ` WHERE user_id = ?`;
            queryParams.push(userId);
        } else if (["admin", "faculty_dean_office", "student_council_head", "student_council_member"].includes(role)) {
            if (!facultyId) {
                return res.status(403).json({ error: "Факультет не вказаний для цієї ролі" });
            }
            applicationsQuery += ` WHERE faculty_id = ?`;
            queryParams.push(facultyId);
        } else if (role === "dorm_manager") {
            if (!dormitoryId) {
                return res.status(403).json({ error: "Гуртожиток не вказаний для цієї ролі" });
            }
            applicationsQuery += ` WHERE dormitory_id = ?`;
            queryParams.push(dormitoryId);
        } else if (role !== "superadmin") {
            return res.status(403).json({ error: "Немає доступу до даних дашборду" });
        }

        applicationsQuery += ` ORDER BY created_at DESC LIMIT 5`;
        const [applications] = await pool.execute(applicationsQuery, queryParams);

        const [notifications] = await pool.execute(
            `SELECT id, title, description, created_at, \`read\` 
             FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC LIMIT 5`,
            [userId]
        );

        res.json({
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
        const facultyId = req.user.faculty_id;
        const dormitoryId = req.user.dormitory_id;

        let query = `SELECT * FROM dorm_applications WHERE `;
        const queryParams = [];

        if (role === "student") {
            query += `user_id = ?`;
            queryParams.push(userId);
        } else if (["admin", "faculty_dean_office"].includes(role)) {
            query += `faculty_id = ?`;
            queryParams.push(facultyId);
        } else if (role === "dorm_manager") {
            query += `dormitory_id = ?`;
            queryParams.push(dormitoryId);
        } else {
            return res.status(403).json({ error: "Немає доступу до заявок" });
        }

        query += ` ORDER BY created_at DESC LIMIT 10`;
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
        const facultyId = req.user.faculty_id;
        const dormitoryId = req.user.dormitory_id;

        let dormitories;
        if (role === "dorm_manager") {
            dormitories = await Dormitory.findAll({ dormitory_id: dormitoryId });
        } else if (["admin", "faculty_dean_office"].includes(role)) {
            dormitories = await Dormitory.findAll({ faculty_id: facultyId });
        } else {
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
        const facultyId = req.user.faculty_id;
        const dormitoryId = req.user.dormitory_id;

        let settlements;
        if (role === "dorm_manager") {
            settlements = await Settlement.findAll({ dormitory_id: dormitoryId });
        } else if (["admin", "faculty_dean_office"].includes(role)) {
            settlements = await Settlement.findAll({ faculty_id: facultyId });
        } else {
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
        const userId = req.user.userId;
        const role = req.user.role;
        const facultyId = req.user.faculty_id;
        const dormitoryId = req.user.dormitory_id;
        const { page = 1, limit = 10, search = "", status = "" } = req.query;

        let filter = { page: parseInt(page), limit: parseInt(limit), search, status };

        if (role === "student") {
            filter.userId = userId;
        } else if (["admin", "faculty_dean_office"].includes(role)) {
            filter.facultyId = facultyId;
        } else if (role === "dorm_manager") {
            filter.dormitoryId = dormitoryId;
        } else {
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
        res.status(500).json({ error: "Помилка сервера" });
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
            console.error("[SecureController] Joi validation error:", error.details);
            return res.status(400).json({ error: "Невірні параметри запиту", details: error.details });
        }

        const filter = {
            userId,
            page: parseInt(value.page),
            limit: parseInt(value.limit),
            search: value.search,
            status: value.status,
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
        const facultyId = req.user.faculty_id;

        if (role !== "student") {
            return res.status(403).json({ error: "Тільки студенти можуть подавати заявки" });
        }

        const schema = Joi.object({
            dormitory_id: Joi.number().integer().positive().required(),
            application_date: Joi.date().iso().required(),
            preferred_room: Joi.string().max(10).optional().allow(null),
            comments: Joi.string().max(1000).optional().allow(null),
        }).unknown(false);

        const { error, value } = schema.validate(req.body);
        if (error) {
            console.error("[SecureController] Joi validation error:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        // Check if user has a pending or approved application
        const [existing] = await pool.execute(
            `SELECT id FROM accommodation_applications 
             WHERE user_id = ? AND status IN ('pending', 'approved', 'approved_by_faculty', 'approved_by_dorm', 'settled')`,
            [userId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: "У вас вже є активна заявка" });
        }

        // Verify dormitory exists
        const [dormitory] = await pool.execute(
            `SELECT id FROM dormitories WHERE id = ?`,
            [value.dormitory_id]
        );
        if (!dormitory[0]) {
            return res.status(404).json({ error: "Гуртожиток не знайдено" });
        }

        // Verify faculty_id exists
        if (!facultyId) {
            return res.status(400).json({ error: "Факультет користувача не вказаний" });
        }
        const [faculty] = await pool.execute(
            `SELECT id FROM faculties WHERE id = ?`,
            [facultyId]
        );
        if (!faculty[0]) {
            return res.status(404).json({ error: "Факультет не знайдено" });
        }

        // Create application
        const application = await AccommodationApplication.create({
            user_id: userId,
            dormitory_id: value.dormitory_id,
            faculty_id: facultyId,
            application_date: value.application_date,
            preferred_room: value.preferred_room || null,
            comments: value.comments || null,
            status: "pending",
        });

        res.status(201).json({ message: "Заявку успішно створено", application });
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

        // Access control
        if (role === "student" && application.user_id !== userId) {
            return res.status(403).json({ error: "Доступ до цієї заявки обмежено" });
        } else if (role === "dorm_manager" && application.dormitory_id !== req.user.dormitory_id) {
            return res.status(403).json({ error: "Доступ обмежено до вашого гуртожитку" });
        } else if (
            ["student_council_head", "student_council_member"].includes(role) &&
            application.faculty_id !== req.user.faculty_id
        ) {
            return res.status(403).json({ error: "Доступ обмежено до вашого факультету" });
        } else if (role === "faculty_dean_office" && application.faculty_id !== req.user.faculty_id) {
            const [dormitories] = await pool.execute(
                `SELECT dormitory_id FROM faculty_dormitories WHERE faculty_id = ?`,
                [req.user.faculty_id]
            );
            const managedDormIds = dormitories.map(d => d.dormitory_id);
            if (!managedDormIds.includes(application.dormitory_id)) {
                return res.status(403).json({ error: "Доступ обмежено до керованих гуртожитків" });
            }
        } else if (!["admin", "superadmin"].includes(role)) {
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
            console.error("[SecureController] Joi validation error for ID:", error.details);
            return res.status(400).json({ error: "Невірний ID заявки", details: error.details });
        }

        const application = await AccommodationApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Заявку не знайдено" });
        }

        // Only students can cancel their own applications, and only if pending
        if (role !== "student" || application.user_id !== userId) {
            return res.status(403).json({ error: "Ви не можете скасувати цю заявку" });
        }
        if (application.status !== "pending") {
            return res.status(400).json({ error: "Тільки заявки зі статусом 'pending' можна скасувати" });
        }

        await AccommodationApplication.updateStatus(id, "rejected");

        res.json({ message: "Заявку успішно скасовано" });
    } catch (error) {
        console.error("[SecureController] Помилка скасування заявки:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
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
};