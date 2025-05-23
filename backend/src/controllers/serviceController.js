import Joi from "joi";
import pool from "../config/db.js";
import AccommodationApplication from "../models/AccommodationApplication.js";

export const getServices = (req, res) => {
    const services = [
        {
            id: 1,
            name: "Поселення в гуртожиток",
            description: "Подайте заявку на поселення в гуртожиток.",
            route: "/services/settlement",
        },
        {
            id: 2,
            name: "Створення контракту на поселення",
            description: "Створіть контракт для поселення в гуртожиток.",
            route: "/services/contract",
        },
        {
            id: 3,
            name: "Заява на поселення (нова)",
            description: "Подати нову заяву на поселення в гуртожиток.",
            route: "/services/accommodation-application",
        }
    ];
    res.json(services);
};

export const createDormApplication = async (req, res) => {
    try {
        const { name, surname, faculty, course } = req.body;
        const user_id = req.user.userId;
        if (!name || !surname || !faculty || !course) {
            return res.status(400).json({ error: "Усі поля обов’язкові" });
        }
        return res.status(501).json({ error: "Цей тип заявки (createDormApplication) не реалізовано або застарів." });
    } catch (error) {
        console.error("[createDormApplication] Error:", error);
        res.status(500).json({ error: "Помилка при поданні заявки" });
    }
};

export const submitAccommodationApplication = async (req, res) => {
    try {
        console.log("[AccommodationApplication] Received request from user:", req.user.userId, "with body:", req.body);
        const schema = Joi.object({
            faculty_id: Joi.number().integer().positive().required().messages({
                "number.base": "ID факультету має бути числом",
                "number.positive": "ID факультету має бути позитивним числом",
                "any.required": "ID факультету є обов'язковим",
            }),
            group_id: Joi.number().integer().positive().required().messages({
                "number.base": "ID групи має бути числом",
                "number.positive": "ID групи має бути позитивним числом",
                "any.required": "ID групи є обов'язковим",
            }),
            course: Joi.number().integer().min(1).max(6).required().messages({
                "number.base": "Курс повинен бути числом",
                "number.min": "Курс повинен бути не менше 1",
                "number.max": "Курс повинен бути не більше 6",
                "any.required": "Курс є обов'язковим",
            }),
            full_name: Joi.string().min(1).max(255).required().messages({
                "string.empty": "ПІБ не може бути порожнім",
                "string.max": "ПІБ не може перевищувати 255 символів",
                "any.required": "ПІБ є обов'язковим",
            }),
            surname: Joi.string().min(1).max(100).required().messages({
                "string.empty": "Прізвище не може бути порожнім",
                "string.max": "Прізвище не може перевищувати 100 символів",
                "any.required": "Прізвище є обов'язковим",
            }),
            phone_number: Joi.string()
                .pattern(/^\+380\d{9}$/)
                .required()
                .messages({
                    "string.pattern.base": "Номер телефону повинен бути у форматі +380XXXXXXXXX",
                    "any.required": "Номер телефону є обов'язковим",
                }),
            dormitory_id: Joi.number().integer().positive().required().messages({
                "number.base": "ID гуртожитку повинен бути числом",
                "number.positive": "ID гуртожитку повинен бути позитивним числом",
                "any.required": "ID гуртожитку є обов'язковим",
            }),
            start_date: Joi.date().iso().required().messages({
                "date.format": "Дата початку повинна бути у форматі ISO (РРРР-ММ-ДД)",
                "any.required": "Дата початку є обов'язковою",
            }),
            end_date: Joi.date()
                .iso()
                .greater(Joi.ref("start_date"))
                .required()
                .messages({
                    "date.greater": "Дата закінчення повинна бути пізніше дати початку",
                    "date.format": "Дата закінчення повинна бути у форматі ISO (РРРР-ММ-ДД)",
                    "any.required": "Дата закінчення є обов'язковою",
                }),
            application_date: Joi.date().iso().required().messages({
                "date.format": "Дата заявки повинна бути у форматі ISO (РРРР-ММ-ДД)",
                "any.required": "Дата заявки є обов'язковою",
            }),
            preferred_room: Joi.string().max(10).allow(null, "").optional(),
            comments: Joi.string().max(1000).allow(null, "").optional(),
        }).unknown(false);

        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorDetails = error.details.map((detail) => detail.message);
            console.error("[AccommodationApplication] Validation error:", errorDetails);
            return res.status(400).json({
                error: "Невалідні дані",
                code: "VALIDATION_ERROR",
                details: errorDetails,
            });
        }

        const [groupRows] = await pool.query(
            "SELECT id, faculty_id, course FROM `groups` WHERE id = ?",
            [value.group_id]
        );
        if (!groupRows[0]) {
            console.error("[AccommodationApplication] Invalid group_id:", value.group_id);
            return res.status(400).json({
                error: "Обрана група не існує",
                code: "INVALID_GROUP",
            });
        }
        const groupData = groupRows[0];
        if (groupData.faculty_id !== value.faculty_id) {
            console.error(
                "[AccommodationApplication] Group does not belong to selected faculty:",
                groupData.faculty_id,
                value.faculty_id
            );
            return res.status(400).json({
                error: "Обрана група не належить до обраного факультету",
                code: "GROUP_FACULTY_MISMATCH",
            });
        }
        if (groupData.course !== value.course) {
            console.error(
                "[AccommodationApplication] Course mismatch: Form course vs Group's actual course",
                value.course,
                groupData.course
            );
            return res.status(400).json({
                error: `Курс (${value.course}) не відповідає курсу обраної групи (${groupData.course})`,
                code: "COURSE_GROUP_MISMATCH",
            });
        }
        const [facultyDormitoryRows] = await pool.query(
            `SELECT faculty_id FROM faculty_dormitories WHERE faculty_id = ? AND dormitory_id = ?`,
            [value.faculty_id, value.dormitory_id]
        );
        if (!facultyDormitoryRows[0]) {
            console.error(
                "[AccommodationApplication] Dormitory not accessible for selected faculty:",
                value.dormitory_id,
                value.faculty_id
            );
            return res.status(400).json({
                error: "Обраний гуртожиток недоступний для обраного факультету",
                code: "DORMITORY_FACULTY_MISMATCH",
            });
        }

        const [existingIdenticalPendingApplication] = await pool.query(
            `SELECT id, status FROM accommodation_applications
             WHERE user_id = ? AND dormitory_id = ? AND start_date = ? AND end_date = ?
             AND status IN ('pending', 'approved_by_faculty', 'approved_by_dorm')`,
            [req.user.userId, value.dormitory_id, new Date(value.start_date).toISOString().split("T")[0], new Date(value.end_date).toISOString().split("T")[0]]
        );

        if (existingIdenticalPendingApplication[0]) {
            console.error(
                "[AccommodationApplication] User already has an identical pending/active application:",
                existingIdenticalPendingApplication[0].id, "with status:", existingIdenticalPendingApplication[0].status
            );
            return res.status(409).json({
                error: "У вас вже є активна заявка на цей гуртожиток та період, яка ще розглядається.",
                code: "DUPLICATE_IDENTICAL_PENDING_APPLICATION",
            });
        }


        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const applicationData = {
                user_id: req.user.userId,
                faculty_id: value.faculty_id,
                course: value.course,
                group_id: value.group_id,
                full_name: value.full_name,
                surname: value.surname,
                phone_number: value.phone_number,
                dormitory_id: value.dormitory_id,
                start_date: new Date(value.start_date).toISOString().split("T")[0],
                end_date: new Date(value.end_date).toISOString().split("T")[0],
                application_date: new Date(value.application_date).toISOString().split("T")[0],
                status: "pending",
                preferred_room: value.preferred_room || null,
                comments: value.comments || null,
            };
            console.log("[AccommodationApplication] Data to be created:", applicationData);
            const applicationId = await AccommodationApplication.create(applicationData);
            await connection.commit();
            res.status(201).json({
                success: true,
                message: "Заявку успішно подано",
                applicationId,
            });
        } catch (dbError) {
            await connection.rollback();
            console.error("[AccommodationApplication] Database error during transaction:", dbError);
            throw dbError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[AccommodationApplication] Error in submitAccommodationApplication:", {
            message: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            body: req.body,
            code: error.code,
        });
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).json({
                error: "Невалідні дані: один із вказаних ID (гуртожиток, факультет, група) не існує.",
                code: "FOREIGN_KEY_VIOLATION",
            });
        }
        if (!res.headersSent) {
            res.status(500).json({
                error: "Помилка сервера при обробці заявки",
                code: "INTERNAL_SERVER_ERROR",
                details: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        } else {
            console.error("[AccommodationApplication] Headers already sent, cannot send error response.");
        }
    }
};

export default {
    getServices,
    createDormApplication,
    submitAccommodationApplication,
};