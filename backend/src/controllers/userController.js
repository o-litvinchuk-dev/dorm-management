import pool from "../config/db.js";
import Joi from "joi";
import User from "../models/User.js";

// Schema for role assignment validation
const roleAssignmentSchema = Joi.object({
    userId: Joi.number().integer().positive().required(),
    role: Joi.string().valid(
        "faculty_dean_office",
        "dorm_manager",
        "student_council_head",
        "student_council_member"
    ).required(),
    facultyId: Joi.number().integer().positive().optional().allow(null), // Required for faculty-related roles
    dormitoryId: Joi.number().integer().positive().optional().allow(null), // Required for dorm_manager
}).unknown(false);

// Assign Faculty Dean Office Role
export const assignFacultyDeanOfficeRole = async (req, res) => {
    try {
        const { userId, facultyId } = req.body;

        // Validate input
        const { error } = roleAssignmentSchema.validate({ userId, role: "faculty_dean_office", facultyId });
        if (error) {
            console.error("[UserController] Joi validation error:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        // Check if faculty exists
        const [faculty] = await pool.query(`SELECT id FROM faculties WHERE id = ?`, [facultyId]);
        if (!faculty[0]) {
            return res.status(404).json({ error: "Факультет не знайдено" });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        // Update user role and faculty_id
        await pool.query(
            `UPDATE users SET role = ?, faculty_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            ["faculty_dean_office", facultyId, userId]
        );

        res.json({ message: "Роль faculty_dean_office успішно призначено" });
    } catch (error) {
        console.error("[UserController] Помилка призначення ролі faculty_dean_office:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

// Assign Dorm Manager Role
export const assignDormManagerRole = async (req, res) => {
    try {
        const { userId, dormitoryId } = req.body;

        // Validate input
        const { error } = roleAssignmentSchema.validate({ userId, role: "dorm_manager", dormitoryId });
        if (error) {
            console.error("[UserController] Joi validation error:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        // Check if dormitory exists
        const [dormitory] = await pool.query(`SELECT id FROM dormitories WHERE id = ?`, [dormitoryId]);
        if (!dormitory[0]) {
            return res.status(404).json({ error: "Гуртожиток не знайдено" });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        // Update user role and dormitory_id
        await pool.query(
            `UPDATE users SET role = ?, dormitory_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            ["dorm_manager", dormitoryId, userId]
        );

        res.json({ message: "Роль dorm_manager успішно призначено" });
    } catch (error) {
        console.error("[UserController] Помилка призначення ролі dorm_manager:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

// Assign Student Council Role
export const assignStudentCouncilRole = async (req, res) => {
    try {
        const { userId, role, facultyId } = req.body;
        const requestingUser = req.user;

        // Validate input
        const { error } = roleAssignmentSchema.validate({ userId, role, facultyId });
        if (error) {
            console.error("[UserController] Joi validation error:", error.details);
            return res.status(400).json({ error: "Невірні вхідні дані", details: error.details });
        }

        // Check if faculty exists
        const [faculty] = await pool.query(`SELECT id FROM faculties WHERE id = ?`, [facultyId]);
        if (!faculty[0]) {
            return res.status(404).json({ error: "Факультет не знайдено" });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        // If requesting user is dorm_manager, check if they can assign for this faculty
        if (requestingUser.role === "dorm_manager") {
            const [facultyDormitories] = await pool.query(
                `SELECT faculty_id FROM faculty_dormitories WHERE dormitory_id = ? AND faculty_id = ?`,
                [requestingUser.dormitory_id, facultyId]
            );
            if (!facultyDormitories[0]) {
                return res.status(403).json({ error: "Немає прав призначати для цього факультету" });
            }
        }

        // Update user role and faculty_id
        await pool.query(
            `UPDATE users SET role = ?, faculty_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [role, facultyId, userId]
        );

        res.json({ message: `Роль ${role} успішно призначено` });
    } catch (error) {
        console.error("[UserController] Помилка призначення ролі student_council:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.message });
    }
};

export default {
    assignFacultyDeanOfficeRole,
    assignDormManagerRole,
    assignStudentCouncilRole,
};