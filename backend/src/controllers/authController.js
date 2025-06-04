import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
} from "../utils/emailSender.js";
import redisClient from "../config/redis.js";
import pool from "../config/db.js";
import { OAuth2Client } from "google-auth-library";
import Joi from "joi";
import Dormitory from "../models/Dormitory.js";
import Faculties from "../models/Faculties.js";
import UserProfile from "../models/UserProfile.js";
import { isProfileComplete } from "../utils/profileUtils.js";

const validatePassword = (password) => {
    if (!password) return false;
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 8;
    const hasUpperCase =
        process.env.PASSWORD_REQUIRE_UPPERCASE === "true"
            ? /[A-Z]/.test(password)
            : true;
    const hasNumber =
        process.env.PASSWORD_REQUIRE_NUMBERS === "true"
            ? /[0-9]/.test(password)
            : true;
    const hasSymbol =
        process.env.PASSWORD_REQUIRE_SYMBOLS === "true"
            ? /[!@#$%^&*(),.?":{}|<>]/.test(password)
            : true;
    return (
        password.length >= minLength && hasUpperCase && hasNumber && hasSymbol
    );
};
const getPasswordRequirementsMessage = () => {
    let message = `Пароль повинен містити мінімум ${
        process.env.PASSWORD_MIN_LENGTH || 8
    } символів`;
    if (process.env.PASSWORD_REQUIRE_UPPERCASE === "true")
        message += ", хоча б одну велику літеру";
    if (process.env.PASSWORD_REQUIRE_NUMBERS === "true")
        message += ", хоча б одну цифру";
    if (process.env.PASSWORD_REQUIRE_SYMBOLS === "true")
        message += ", хоча б один символ";
    return message;
};
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && re.test(String(email).toLowerCase());
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    } catch (error) {
        console.error("[GoogleSignIn] Помилка перевірки токена:", error.message);
        throw new Error("Недійсний або прострочений Google ID-токен");
    }
}

export const googleSignIn = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: "Токен відсутній" });
        }
        const payload = await verifyGoogleToken(token);
        if (!payload.email) {
            return res.status(400).json({ error: "Не вдалося отримати email" });
        }
        let user = await User.findByEmail(payload.email);
        if (user) {
            if (user.provider !== "google") {
                return res.status(409).json({
                    error: "Конфлікт акаунтів",
                    code: "ACCOUNT_CONFLICT",
                });
            }
            await User.incrementTokenVersion(user.id);
            user = await User.findById(user.id); // Re-fetch user to get updated token_version
        } else {
            const hashedPassword = await bcrypt.hash(
                payload.email + process.env.JWT_SECRET,
                12
            );
            user = await User.create({
                email: payload.email,
                password: hashedPassword,
                name: payload.name,
                avatar: payload.picture,
                provider: "google",
                google_id: payload.sub,
                isVerified: true,
                role: process.env.DEFAULT_ROLE || "student",
                token_version: 0,
                gender: payload.gender || 'not_specified',
                // is_profile_complete will be set to 1 by User.create for google provider
            });
            await pool.execute(
                `INSERT INTO user_profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id`,
                [user.id]
            );
        }

        const accessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                tokenVersion: user.token_version,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
        );
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
        );

        await redisClient.del(`refresh:${user.id}`);
        await redisClient.setEx(`refresh:${user.id}`, parseInt(process.env.JWT_REFRESH_EXPIRES, 10) * 24 * 60 * 60 || 7 * 24 * 60 * 60, refreshToken);

        let additionalFields = {};
        if (user.role === "dorm_manager" && user.dormitory_id) {
            const dormitory = await Dormitory.findById(user.dormitory_id);
            additionalFields.dormitory_id = user.dormitory_id;
            additionalFields.dormitory_name = dormitory?.name || null;
        }
        if (
            ["student_council_head", "student_council_member", "faculty_dean_office"].includes(user.role) &&
            user.faculty_id
        ) {
            const faculty = await Faculties.findById(user.faculty_id);
            additionalFields.faculty_id = user.faculty_id;
            additionalFields.faculty_name = faculty?.name || null;
        }

        const isComplete = await isProfileComplete(user.id, user.role);
        const userFromDbForCompletion = await User.findById(user.id); 
        const currentIsProfileCompleteInDB = userFromDbForCompletion?.is_profile_complete === 1;

        if (currentIsProfileCompleteInDB !== isComplete) {
            await pool.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [isComplete ? 1 : 0, user.id]
            );
        }

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                gender: user.gender,
                is_profile_complete: isComplete, 
                ...additionalFields,
            },
        });
    } catch (error) {
        console.error("Помилка Google Sign-In:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
};

export const register = async (req, res) => {
    try {
        const { email, password } = req.body; // Only email and password expected

        if (!email || !validateEmail(email)) {
            return res.status(400).json({ error: "Невірний формат email" });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ error: getPasswordRequirementsMessage() });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                error: "Користувач з цією адресою вже зареєстрований",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const role = req.body.role || process.env.DEFAULT_ROLE || "student";

        const user = await User.create({
            email,
            password: hashedPassword,
            role,
            // name, gender, and is_profile_complete will use defaults from User.create
        });

        await pool.execute(
            `INSERT INTO user_profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id`,
            [user.id]
        );

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                error: "Помилка сервера: відсутній JWT_SECRET",
            });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
                error: "Помилка сервера: відсутні поштові налаштування",
            });
        }
        try {
            await sendVerificationEmail(email, token);
        } catch (emailError) {
            console.error("[Register] Помилка відправки листа:", emailError);
            return res.status(500).json({
                error: "Не вдалося відправити лист",
                details:
                    process.env.NODE_ENV === "development"
                        ? emailError.message
                        : undefined,
            });
        }

        const isComplete = await isProfileComplete(user.id, user.role);

        return res.status(201).json({
            message: "Лист з підтвердженням успішно відправлено",
            user: {
                id: user.id,
                email: user.email,
                name: user.name, 
                avatar: user.avatar, 
                role: user.role,
                gender: user.gender, 
                is_profile_complete: isComplete, 
            },
        });
    } catch (error) {
        console.error("[Register] Критична помилка:", error);
        return res.status(500).json({
            error: "Внутрішня помилка сервера",
            ...(process.env.NODE_ENV === "development" && {
                details: error.message,
            }),
        });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.redirect(
                `${
                    process.env.FRONTEND_URL
                }/login?verified=error&message=${encodeURIComponent(
                    "Токен відсутній"
                )}`
            );
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            await User.verifyUser(decoded.userId);
            return res.redirect(
                `${process.env.FRONTEND_URL}/login?verified=success`
            );
        } catch (verifyError) {
            console.error("[VerifyEmail] Помилка верифікації:", verifyError);
            const errorMessage =
                verifyError.name === "TokenExpiredError"
                    ? "Час дії токену минув"
                    : "Недійсний токен підтвердження";
            return res.redirect(
                `${
                    process.env.FRONTEND_URL
                }/login?verified=error&message=${encodeURIComponent(errorMessage)}`
            );
        }
    } catch (error) {
        console.error("[VerifyEmail] Загальна помилка:", error);
        return res.redirect(
            `${
                process.env.FRONTEND_URL
            }/login?verified=error&message=${encodeURIComponent(
                "Внутрішня помилка сервера"
            )}`
        );
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                error: "Невірний формат email",
                code: "INVALID_EMAIL_FORMAT",
            });
        }
        if (!password) {
            return res.status(400).json({
                error: "Пароль обов'язковий",
                code: "PASSWORD_REQUIRED",
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                error: "Акаунт не знайдено",
                code: "USER_NOT_FOUND",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                error: "Невірний пароль",
                code: "INVALID_PASSWORD",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                error: "Електронну адресу не підтверджено",
                code: "EMAIL_NOT_VERIFIED",
            });
        }

        const newTokenVersion = await User.incrementTokenVersion(user.id);

        const accessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                tokenVersion: newTokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
        );
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
        );

        await redisClient.del(`refresh:${user.id}`);
        await redisClient.setEx(`refresh:${user.id}`, parseInt(process.env.JWT_REFRESH_EXPIRES, 10) * 24 * 60 * 60 || 7 * 24 * 60 * 60, refreshToken);

        let additionalFields = {};
        if (user.role === "dorm_manager" && user.dormitory_id) {
            const dormitory = await Dormitory.findById(user.dormitory_id);
            additionalFields.dormitory_id = user.dormitory_id;
            additionalFields.dormitory_name = dormitory?.name || null;
        }
        if (
            ["student_council_head", "student_council_member", "faculty_dean_office"].includes(user.role) &&
            user.faculty_id
        ) {
            const faculty = await Faculties.findById(user.faculty_id);
            additionalFields.faculty_id = user.faculty_id;
            additionalFields.faculty_name = faculty?.name || null;
        }

        const isComplete = await isProfileComplete(user.id, user.role);
        const userFromDb = await User.findById(user.id);
        const currentIsProfileCompleteInDB = userFromDb?.is_profile_complete === 1;

        if (currentIsProfileCompleteInDB !== isComplete) {
            await pool.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [isComplete ? 1 : 0, user.id]
            );
        }

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                gender: user.gender,
                is_profile_complete: isComplete,
                ...additionalFields,
            },
        });
    } catch (error) {
        console.error("[Login] Критична помилка:", {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            error: "Внутрішня помилка сервера",
            code: "INTERNAL_SERVER_ERROR",
        });
    }
};

export const logout = async (req, res) => {
    try {
        const userId = req.user.userId;
        await redisClient.del(`refresh:${userId}`);
        await User.incrementTokenVersion(userId);
        res.status(200).json({ success: true, message: "Вихід успішний" });
    } catch (error) {
        console.error("Помилка виходу:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const token =
            req.body.refreshToken || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Токен оновлення відсутній" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
        if (!storedToken || token !== storedToken) {
            return res
                .status(401)
                .json({ error: "Недійсний або прострочений токен оновлення" });
        }
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(403).json({ error: "Користувача не знайдено для токена" });
        }
        const newAccessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                tokenVersion: user.token_version,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
        );
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error("[RefreshToken] Помилка:", error);
        res.status(403).json({ error: "Невірний або прострочений токен оновлення" });
    }
};

export const validateToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userFromDb = await User.findById(userId);

        if (!userFromDb) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        let facultyName = null;
        let dormitoryName = null;

        if (userFromDb.faculty_id) {
            const faculty = await Faculties.findById(userFromDb.faculty_id);
            facultyName = faculty?.name || null;
        }
        if (userFromDb.dormitory_id) {
            const dormitory = await Dormitory.findById(userFromDb.dormitory_id);
            dormitoryName = dormitory?.name || null;
        }

        const isComplete = await isProfileComplete(userId, userFromDb.role);
        const currentIsProfileCompleteInDB = userFromDb.is_profile_complete === 1;
        if (currentIsProfileCompleteInDB !== isComplete) {
            await pool.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [isComplete ? 1 : 0, userId]
            );
        }

        res.json({
            isValid: true,
            user: {
                id: userFromDb.id,
                email: userFromDb.email,
                name: userFromDb.name,
                avatar: userFromDb.avatar,
                role: userFromDb.role,
                gender: userFromDb.gender,
                faculty_id: userFromDb.faculty_id || null,
                faculty_name: facultyName,
                dormitory_id: userFromDb.dormitory_id || null,
                dormitory_name: dormitoryName,
                is_profile_complete: isComplete,
            },
        });
    } catch (error) {
        console.error("[ValidateToken] Помилка:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Будь ласка, вкажіть email." });
        }
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        if (user.provider !== "local") {
            return res.status(403).json({
                error:
                    "Цей акаунт зареєстровано через Google. Скидання паролю недоступне.",
                code: "GOOGLE_ACCOUNT",
            });
        }

        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        if (!redisClient.isOpen) {
            await redisClient.connect().catch(err => {
                console.error("[Redis] Помилка підключення в forgotPassword:", err);
                throw new Error("Помилка Redis: не вдалося підключитися");
            });
        }
        await redisClient.del(`reset:${user.id}`);
        await redisClient.setEx(`reset:${user.id}`, 60 * 60, resetToken);

        const storedToken = await redisClient.get(`reset:${user.id}`);
        if (!storedToken || storedToken !== resetToken) {
            throw new Error("Невдалося зберегти токен для скидання пароля в Redis.");
        }

        const resetUrl = `${process.env.FRONTEND_URL}/new-password?token=${resetToken}`;
        try {
            await sendPasswordResetEmail(email, resetUrl);
            res.json({ message: "Лист для скидання пароля відправлено." });
        } catch (emailErr) {
            console.error("[Email] Помилка відправки листа:", emailErr);
            res.status(500).json({
                error:
                    "Помилка відправки листа для скидання пароля. Спробуйте пізніше.",
            });
        }
    } catch (error) {
        console.error("[ForgotPassword] Загальна помилка:", {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            error: "Помилка сервера при запиті на скидання пароля.",
            details: process.env.NODE_ENV === "development" ? error.message : null,
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        const { password } = req.body;

        if (!token) {
            return res.status(401).json({ error: "Токен не надано", code: "TOKEN_MISSING" });
        }
        if (!token.match(/^[\w-]+\.[\w-]+\.[\w-_.+/=]*$/)) {
            return res.status(401).json({ error: "Недійсний формат токена", code: "INVALID_TOKEN_FORMAT" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded || !decoded.userId) {
            return res.status(401).json({ error: "Недійсний токен (немає userId)", code: "INVALID_TOKEN_PAYLOAD" });
        }

        const storedToken = await redisClient.get(`reset:${decoded.userId}`);
        if (!storedToken) {
            return res.status(401).json({
                error: "Токен вже використаний, недійсний або час життя минув",
                code: "TOKEN_EXPIRED_OR_USED_REDIS"
            });
        }
        if (token !== storedToken) {
            return res.status(401).json({ error: "Недійсний токен (неспівпадіння з Redis)", code: "TOKEN_MISMATCH_REDIS" });
        }

        await redisClient.del(`reset:${decoded.userId}`);

        if (!validatePassword(password)) {
            return res.status(400).json({
                error: getPasswordRequirementsMessage(),
                code: "INVALID_NEW_PASSWORD_FORMAT"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await User.updatePassword(
            decoded.userId,
            hashedPassword
        );
        if (result.affectedRows === 0) {
            throw new Error("Користувача не знайдено для оновлення пароля");
        }
        res.json({
            success: true,
            message: "Пароль успішно оновлено. Увійдіть з новим паролем.",
        });
    } catch (error) {
        console.error("[ResetPassword] Критична помилка:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
            query: req.query,
            body: req.body,
        });
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Час дії токену минув", code: "JWT_TOKEN_EXPIRED" });
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Недійсний токен (помилка верифікації)", code: "JWT_INVALID_SIGNATURE" });
        }
        if (error.message?.includes("Користувача не знайдено")) {
            return res.status(404).json({ error: "Користувача не знайдено", code: "USER_NOT_FOUND_ON_UPDATE" });
        }
        res.status(500).json({
            error: "Помилка сервера при скиданні пароля.",
            details:
                process.env.NODE_ENV === "development" ? error.message : null,
        });
    }
};

async function getProfileInternal(userId) {
    const [userRows] = await pool.query(
        `
        SELECT
            u.id, u.email, u.name, u.avatar, u.role, u.gender,
            u.faculty_id AS user_table_faculty_id,
            u.dormitory_id AS user_table_dormitory_id,
            u.is_profile_complete,
            up.birthday, up.phone, up.about_me, up.interests, up.room,
            up.dormitory, up.instagram, up.telegram,
            up.faculty_id AS profile_faculty_id, up.group_id, up.course,
            f_user.name AS user_faculty_name,
            f_profile.name AS profile_faculty_name,
            d.name AS dormitory_name,
            g.name AS group_name
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN faculties f_user ON u.faculty_id = f_user.id
        LEFT JOIN faculties f_profile ON up.faculty_id = f_profile.id
        LEFT JOIN dormitories d ON u.dormitory_id = d.id
        LEFT JOIN \`groups\` g ON up.group_id = g.id
        WHERE u.id = ?
        `,
        [userId]
    );

    if (!userRows[0]) {
        throw new Error("Користувача не знайдено при отриманні профілю");
    }
    const user = userRows[0];

    const isComplete = await isProfileComplete(userId, user.role); 

    const profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        gender: user.gender,
        is_profile_complete: isComplete, 
        birthday: user.birthday
            ? new Date(user.birthday).toISOString().split("T")[0]
            : null,
        phone: user.phone || null,
        about_me: user.about_me || null,
        interests: user.interests || null,
        room: user.room || null,
        dormitory: user.dormitory || null, 
        instagram: user.instagram || null,
        telegram: user.telegram || null,
        dormitory_id: user.user_table_dormitory_id || null, 
        dormitory_name: user.dormitory_name || null,
    };

    if (user.role === "student") {
        profile.faculty_id = user.profile_faculty_id || null;
        profile.faculty_name = user.profile_faculty_name || null;
        profile.group_id = user.group_id || null;
        profile.group_name = user.group_name || null;
        profile.course = user.course || null;
    } else if (["faculty_dean_office", "student_council_head", "student_council_member"].includes(user.role)) {
        profile.faculty_id = user.user_table_faculty_id || null;
        profile.faculty_name = user.user_faculty_name || null;
    }
    return profile;
}

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profileData = await getProfileInternal(userId);

        const userFromDb = await User.findById(userId);
        if (userFromDb && (userFromDb.is_profile_complete === 1) !== profileData.is_profile_complete) {
            await pool.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [profileData.is_profile_complete ? 1 : 0, userId]
            );
        }
        res.json(profileData);
    } catch (error) {
        console.error("[GetProfile] Помилка:", error);
        res.status(error.message.includes("Користувача не знайдено") ? 404 : 500).json({ error: error.message || "Помилка сервера" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const profileData = req.body;

        const baseSchemaFields = {
            name: Joi.string().trim().max(255).optional().allow(null, '').messages({
                'string.max': 'Ім\'я не може перевищувати 255 символів.'
            }),
            gender: Joi.string().valid('male', 'female', 'other', 'not_specified').optional().allow(null, ''),
            birthday: Joi.date().max('now').optional().allow(null, '').messages({
                'date.max': 'Дата народження не може бути в майбутньому.'
            }),
            phone: Joi.string().trim().pattern(/^\+380\d{9}$/).optional().allow(null, '').messages({
                'string.pattern.base': 'Телефон має бути у форматі +380XXXXXXXXX.'
            }),
            aboutMe: Joi.string().trim().max(1000).optional().allow(null, '').messages({
                'string.max': 'Розділ "Про себе" не може перевищувати 1000 символів.'
            }),
            interests: Joi.string().trim().max(255).optional().allow(null, '').messages({
                'string.max': 'Інтереси не можуть перевищувати 255 символів.'
            }),
            room: Joi.string().trim().max(10).optional().allow(null, '').messages({
                'string.max': 'Номер кімнати не може перевищувати 10 символів.'
            }),
            dormitory: Joi.string().trim().max(50).optional().allow(null, '').messages({
                'string.max': 'Назва гуртожитку не може перевищувати 50 символів.'
            }),
            instagram: Joi.string().trim().pattern(/^([a-zA-Z0-9._]){1,30}$/).optional().allow(null, '').messages({
                'string.pattern.base': 'Невірний формат Instagram username.'
            }),
            telegram: Joi.string().trim().pattern(/^@?[a-zA-Z0-9_]{5,32}$/).optional().allow(null, '').messages({
                'string.pattern.base': 'Невірний формат Telegram username.'
            }),
        };

        let roleSpecificSchema = {};
        if (role === 'student') {
            roleSpecificSchema = {
                faculty_id: Joi.number().integer().positive().optional().allow(null), 
                group_id: Joi.number().integer().positive().optional().allow(null),
                course: Joi.number().integer().min(1).max(6).optional().allow(null),
            };
        } else if (['faculty_dean_office', 'student_council_head', 'student_council_member'].includes(role)) {
            roleSpecificSchema = {
                faculty_id: Joi.number().integer().positive().optional().allow(null),
            };
        } else if (role === 'dorm_manager') {
            roleSpecificSchema = {
                dormitory_id: Joi.number().integer().positive().optional().allow(null),
            };
        }

        const schema = Joi.object({ ...baseSchemaFields, ...roleSpecificSchema }).unknown(false); 
        const { error, value: validatedProfileData } = schema.validate(profileData, { abortEarly: false, stripUnknown: true });

        if (error) {
            const errorDetails = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return res.status(400).json({ error: "Невалідні дані", details: errorDetails });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const userUpdates = {};
            if (validatedProfileData.name !== undefined) userUpdates.name = validatedProfileData.name === "" ? null : validatedProfileData.name;
            if (validatedProfileData.gender !== undefined) userUpdates.gender = validatedProfileData.gender === "" ? 'not_specified' : validatedProfileData.gender;
            
            if (["faculty_dean_office", "student_council_head", "student_council_member"].includes(role) && validatedProfileData.faculty_id !== undefined) {
                if (validatedProfileData.faculty_id) { 
                    const [faculty] = await connection.execute(`SELECT id FROM faculties WHERE id = ?`, [validatedProfileData.faculty_id]);
                    if (!faculty[0]) throw new Error("Факультет не існує");
                }
                userUpdates.faculty_id = validatedProfileData.faculty_id || null;
            }
            if (role === "dorm_manager" && validatedProfileData.dormitory_id !== undefined) {
                if (validatedProfileData.dormitory_id) { 
                    const [dormitory] = await connection.execute(`SELECT id FROM dormitories WHERE id = ?`, [validatedProfileData.dormitory_id]);
                    if (!dormitory[0]) throw new Error("Гуртожиток не існує");
                }
                userUpdates.dormitory_id = validatedProfileData.dormitory_id || null;
            }

            if (Object.keys(userUpdates).length > 0) {
                const userFields = Object.keys(userUpdates).map(field => `\`${field}\` = ?`).join(', ');
                const userValues = [...Object.values(userUpdates), userId];
                await connection.execute(
                    `UPDATE users SET ${userFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    userValues
                );
            }
            
            const profileUpdates = {};
            if (validatedProfileData.birthday !== undefined) profileUpdates.birthday = validatedProfileData.birthday || null;
            if (validatedProfileData.phone !== undefined) profileUpdates.phone = validatedProfileData.phone || null;
            if (validatedProfileData.aboutMe !== undefined) profileUpdates.about_me = validatedProfileData.aboutMe || null;
            if (validatedProfileData.interests !== undefined) profileUpdates.interests = validatedProfileData.interests || null;
            if (validatedProfileData.room !== undefined) profileUpdates.room = validatedProfileData.room || null;
            if (validatedProfileData.dormitory !== undefined) profileUpdates.dormitory = validatedProfileData.dormitory || null; 
            if (validatedProfileData.instagram !== undefined) profileUpdates.instagram = validatedProfileData.instagram ? (validatedProfileData.instagram.startsWith('https://') ? validatedProfileData.instagram : `https://instagram.com/${validatedProfileData.instagram}`) : null;
            if (validatedProfileData.telegram !== undefined) profileUpdates.telegram = validatedProfileData.telegram ? (validatedProfileData.telegram.startsWith('https://') ? validatedProfileData.telegram : `https://t.me/${validatedProfileData.telegram.replace(/^@/, '')}`) : null;

            if (role === "student") {
                if (validatedProfileData.faculty_id !== undefined) {
                    if (validatedProfileData.faculty_id) { 
                        const [faculty] = await connection.execute(`SELECT id FROM faculties WHERE id = ?`, [validatedProfileData.faculty_id]);
                        if (!faculty[0]) throw new Error("Факультет не існує для user_profiles");
                    }
                    profileUpdates.faculty_id = validatedProfileData.faculty_id || null;
                }
                if (validatedProfileData.group_id !== undefined) {
                    if (validatedProfileData.group_id) { 
                        const [group] = await connection.execute(
                            `SELECT id, faculty_id FROM \`groups\` WHERE id = ?`,
                            [validatedProfileData.group_id]
                        );
                        if (!group[0]) throw new Error("Група не існує");
                        
                        const facultyIdForCheck = profileUpdates.faculty_id !== undefined 
                            ? profileUpdates.faculty_id 
                            : (await UserProfile.findByUserId(userId))?.faculty_id; 
                        
                        if (facultyIdForCheck && group[0].faculty_id !== facultyIdForCheck) {
                            throw new Error("Група не належить до обраного факультету");
                        }
                    }
                    profileUpdates.group_id = validatedProfileData.group_id || null;
                }
                if (validatedProfileData.course !== undefined) profileUpdates.course = validatedProfileData.course || null;
            }

            const existingProfile = await UserProfile.findByUserId(userId);
            if (existingProfile) {
                if (Object.keys(profileUpdates).length > 0) {
                    const profileFields = Object.keys(profileUpdates).map(field => `\`${field}\` = ?`).join(', ');
                    const profileValues = [...Object.values(profileUpdates), userId];
                    await connection.execute(`UPDATE user_profiles SET ${profileFields} WHERE user_id = ?`, profileValues);
                }
            } else {
                const allProfileFieldsToInsert = { user_id: userId, ...profileUpdates };
                for (const key in baseSchemaFields) {
                    const profileKey = key === 'aboutMe' ? 'about_me' : key;
                    if (validatedProfileData[key] !== undefined && allProfileFieldsToInsert[profileKey] === undefined) {
                        if (['birthday', 'phone', 'about_me', 'interests', 'room', 'dormitory', 'instagram', 'telegram'].includes(profileKey)) {
                            allProfileFieldsToInsert[profileKey] = validatedProfileData[key] || null;
                        }
                    }
                }

                if (Object.keys(allProfileFieldsToInsert).length > 1) { 
                    const fieldNames = Object.keys(allProfileFieldsToInsert).map(f => `\`${f}\``).join(', ');
                    const placeholders = Object.keys(allProfileFieldsToInsert).map(() => '?').join(', ');
                    await connection.execute(`INSERT INTO user_profiles (${fieldNames}) VALUES (${placeholders})`, Object.values(allProfileFieldsToInsert));
                }
            }

            const isComplete = await isProfileComplete(userId, role);
            await connection.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [isComplete ? 1 : 0, userId]
            );

            await connection.commit();
            const finalProfileData = await getProfileInternal(userId);
            res.json({
                message: "Профіль успішно оновлено",
                user: finalProfileData,
            });
        } catch (error) {
            await connection.rollback();
            console.error("[UpdateProfile] Помилка транзакції:", error);
            const isForeignKeyError = error.message.includes("Факультет не існує") ||
                error.message.includes("Гуртожиток не існує") ||
                error.message.includes("Група не існує") ||
                error.message.includes("Група не належить до обраного факультету");

            const fieldWithError = isForeignKeyError ?
                (error.message.includes("Факультет") ? "faculty_id" :
                (error.message.includes("Гуртожиток") ? "dormitory_id" : "group_id"))
                : "general";

            res.status(400).json({
                error: "Помилка при оновленні профілю",
                details: [{ field: fieldWithError, message: error.message || "Помилка сервера" }],
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[UpdateProfile] Помилка валідації або інша:", error);
        res.status(500).json({ error: "Помилка сервера", details: error.details || error.message });
    }
};

export default {
    register,
    verifyEmail,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
    googleSignIn,
    getProfile,
    updateProfile,
    logout,
    validateToken,
};