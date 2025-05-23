import pool from "../config/db.js";
import Dormitory from "../models/Dormitory.js"; 
import Settlement from "../models/Settlement.js"; 
import AccommodationApplication from "../models/AccommodationApplication.js";
import Joi from "joi";
import User from "../models/User.js"; // Імпортуємо модель User

export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const facultyName = req.user.faculty_name; 
        const dormitoryId = req.user.dormitory_id;

        let applicationsQuery = `SELECT da.*, u.email FROM dorm_applications da JOIN users u ON da.user_id = u.id`;
        const queryParams = [];
        let whereClauses = [];

        if (role === "student") {
            whereClauses.push(`da.user_id = ?`);
            queryParams.push(userId);
        } else if (["admin", "faculty_dean_office", "student_council_head", "student_council_member"].includes(role)) {
            if (!facultyName) {
                const userFromDB = await User.findById(userId);
                if (!userFromDB?.is_profile_complete) {
                     return res.status(403).json({ error: "Профіль не завершено. Будь ласка, оберіть факультет.", code: "PROFILE_INCOMPLETE_FACULTY" });
                }
                return res.status(403).json({ error: "Назва факультету не визначена для цієї ролі, хоча профіль мав би бути завершеним." });
            }
            whereClauses.push(`da.faculty = ?`); 
            queryParams.push(facultyName);
        } else if (role === "dorm_manager") {
             // Для коменданта немає прямої фільтрації в dorm_applications за гуртожитком
        } else if (role !== "superadmin") {
             if (whereClauses.length === 0) { 
                return res.status(403).json({ error: "Немає доступу до даних дашборду" });
            }
        }
        
        if (whereClauses.length > 0) {
            applicationsQuery += ` WHERE ${whereClauses.join(" AND ")}`;
        }

        applicationsQuery += ` ORDER BY da.created_at DESC LIMIT 5`;
        
        let applications = [];
        if (role === "superadmin" || whereClauses.length > 0 || role === "dorm_manager") { 
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
        const facultyName = req.user.faculty_name;

        let query = `SELECT da.*, u.email FROM dorm_applications da JOIN users u ON da.user_id = u.id`;
        const queryParams = [];
        let whereClauses = [];

        if (role === "student") {
            whereClauses.push(`da.user_id = ?`);
            queryParams.push(userId);
        } else if (["admin", "faculty_dean_office"].includes(role)) {
            if (!facultyName) { 
                const userFromDB = await User.findById(userId);
                if (!userFromDB?.is_profile_complete) {
                     return res.status(403).json({ error: "Профіль не завершено. Будь ласка, оберіть факультет.", code: "PROFILE_INCOMPLETE_FACULTY" });
                }
                return res.status(403).json({ error: "Назва факультету не вказана для цієї ролі" });
            }
            whereClauses.push(`da.faculty = ?`); 
            queryParams.push(facultyName);
        } else if (role === "dorm_manager") {
            // Немає фільтрації для коменданта
        } else if (role !== "superadmin") { 
            return res.status(403).json({ error: "Немає доступу до заявок" });
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(" AND ")}`;
        }
        
        query += ` ORDER BY da.created_at DESC LIMIT 10`;

        let rows = [];
         if (role === "superadmin" || whereClauses.length > 0 || role === "dorm_manager") { 
            [rows] = await pool.execute(query, queryParams);
        }
        
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
        if (role === "dorm_manager" && dormitoryId) {
            dormitories = await Dormitory.findAll({ id: dormitoryId });
        } else if ((["admin", "faculty_dean_office"].includes(role)) && facultyId) {
             const [linkedDorms] = await pool.query(
                `SELECT d.* FROM dormitories d 
                 JOIN faculty_dormitories fd ON d.id = fd.dormitory_id 
                 WHERE fd.faculty_id = ?`,
                [facultyId]
            );
            dormitories = linkedDorms;
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
        if (role === "dorm_manager" && dormitoryId) {
            settlements = await Settlement.findAll({ dormitory_id: dormitoryId });
        } else if ((["admin", "faculty_dean_office"].includes(role)) && facultyId) {
            const [linkedSettlements] = await pool.query(
                `SELECT s.* FROM settlements s
                 JOIN users u ON s.user_id = u.id
                 WHERE u.faculty_id = ?`, 
                [facultyId]
            );
            settlements = linkedSettlements;
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
        const { page = 1, limit = 10, search = "", status = "" } = req.query;
        let filter = {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            status,
            requestingUserRole: req.user.role,
        };
        if (req.user.role === "student") {
            filter.userId = req.user.userId;
        } else if (["admin", "superadmin"].includes(req.user.role)){
        } else if (["faculty_dean_office", "student_council_head", "student_council_member"].includes(req.user.role)) {
            if (!req.user.faculty_id) {
                return res.status(403).json({ error: "Факультет не вказаний для цієї ролі" });
            }
            filter.requestingUserFacultyId = req.user.faculty_id;
        } else if (req.user.role === "dorm_manager") {
            if (!req.user.dormitory_id) {
                 return res.status(403).json({ error: "Гуртожиток не вказаний для цієї ролі" });
            }
            filter.dormitory_id = req.user.dormitory_id;
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
        const [userProfileRows] = await pool.query(`SELECT up.faculty_id, up.group_id, up.course, u.name as full_name, up.phone as phone_number
                                                  FROM user_profiles up
                                                  JOIN users u ON u.id = up.user_id
                                                  WHERE up.user_id = ?`, [userId]);
        if (!userProfileRows[0]) {
            return res.status(400).json({ error: "Профіль користувача не знайдено. Будь ласка, заповніть профіль." });
        }
        const userProfile = userProfileRows[0];
        if (!userProfile.faculty_id || !userProfile.group_id || !userProfile.course || !userProfile.full_name || !userProfile.phone_number) {
             return res.status(400).json({ error: "Не всі дані в профілі заповнені (факультет, група, курс, ПІБ, телефон). Будь ласка, оновіть профіль." });
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
             WHERE user_id = ? AND status IN ('pending', 'approved', 'approved_by_faculty', 'approved_by_dorm', 'settled')`,
            [userId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: "У вас вже є активна заявка" });
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
            full_name: userProfile.full_name,
            surname: userProfile.full_name.split(' ')[0],
            phone_number: userProfile.phone_number,
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
        if (application.status !== "pending") {
            return res.status(400).json({ error: "Тільки заявки зі статусом 'pending' можна скасувати" });
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