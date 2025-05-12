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

// Password validation
const validatePassword = (password) => {
    if (!password) return false;
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return password.length >= minLength && hasUpperCase && hasNumber;
};

// Email validation
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

// Handle Google user (provided but redundant; kept for compatibility)
const handleGoogleUser = async (payload) => {
    const { sub: googleId, email, name, picture } = payload;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.execute(
            `SELECT * FROM users WHERE email = ? LIMIT 1`,
            [email]
        );

        if (existing.length > 0) {
            const user = existing[0];
            if (user.provider !== "google") {
                throw new Error(
                    "Ця пошта вже використовується для локального входу"
                );
            }
            return user;
        }

        const hashedPassword = await bcrypt.hash(
            email + process.env.JWT_SECRET,
            12
        );

        const [result] = await connection.execute(
            `INSERT INTO users (email, password, name, avatar, google_id, provider, isVerified, role) 
             VALUES (?, ?, ?, ?, ?, 'google', 1, 'student')`,
            [email, hashedPassword, name, picture, googleId]
        );

        await connection.commit();
        return {
            id: result.insertId,
            email,
            name,
            avatar: picture,
            provider: "google",
            role: "student",
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

// Google Sign-In
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
            user = await User.findById(user.id);
        } else {
            const hashedPassword = await bcrypt.hash(payload.email + process.env.JWT_SECRET, 12);
            user = await User.create({
                email: payload.email,
                password: hashedPassword,
                name: payload.name,
                avatar: payload.picture,
                provider: "google",
                google_id: payload.sub,
                isVerified: true,
                role: "student",
                token_version: 0,
            });
            await pool.execute(
                `INSERT INTO user_profiles (user_id) VALUES (?)`,
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
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Додавання деталей гуртожитку та факультету для відповідних ролей
        let additionalFields = {};
        if (user.role === "dorm_manager" && user.dormitory_id) {
            const dormitory = await Dormitory.findById(user.dormitory_id);
            additionalFields.dormitory_id = user.dormitory_id;
            additionalFields.dormitory_name = dormitory?.name || null;
        }
        if (
            ["student_council_head", "student_council_member"].includes(user.role) &&
            user.faculty_id
        ) {
            const faculty = await Faculties.findById(user.faculty_id);
            additionalFields.faculty_id = user.faculty_id;
            additionalFields.faculty_name = faculty?.name || null;
        }
        if (user.role === "faculty_dean_office" && user.faculty_id) {
            const faculty = await Faculties.findById(user.faculty_id);
            additionalFields.faculty_id = user.faculty_id;
            additionalFields.faculty_name = faculty?.name || null;
        }

        // Перевірка завершеності профілю
        const isComplete = await isProfileComplete(user.id, user.role);

        // Оновлення is_profile_complete, якщо значення відрізняється
        if (user.is_profile_complete !== (isComplete ? 1 : 0)) {
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
                role: user.role,
                is_profile_complete: isComplete,
                ...additionalFields,
            },
        });
    } catch (error) {
        console.error("Помилка Google Sign-In:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
};

// Register
export const register = async (req, res) => {
    console.log("[Register] Початок обробки запиту.");

    try {
        const { email, password, name } = req.body;

        if (!email || !validateEmail(email)) {
            console.error("[Register] Помилка валідації email");
            return res.status(400).json({ error: "Невірний формат email" });
        }

        if (!password || !validatePassword(password)) {
            console.error("[Register] Помилка валідації паролю");
            return res.status(400).json({
                error: "Пароль повинен містити мінімум 8 символів, хоча б одну велику літеру та одну цифру",
            });
        }

        console.log("[Register] Перевірка наявності користувача...");
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            console.error("[Register] Користувач вже існує");
            return res.status(409).json({
                error: "Користувач з цією адресою вже зареєстрований",
            });
        }

        console.log("[Register] Хешування паролю...");
        const hashedPassword = await bcrypt.hash(password, 12);
        console.log("[Register] Пароль успішно захешований");

        const role = req.body.role || "student";
        const user = await User.create({
            email,
            password: hashedPassword,
            isVerified: false,
            role,
            name: name || null,
        });

        await pool.execute(`INSERT INTO user_profiles (user_id) VALUES (?)`, [user.id]);
        console.log("[Register] Користувач створений. ID:", user.id);

        if (!process.env.JWT_SECRET) {
            console.error("[Register] Відсутній JWT_SECRET");
            return res.status(500).json({
                error: "Помилка сервера: відсутній JWT_SECRET",
            });
        }

        console.log("[Register] Генерація JWT токена...");
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        console.log("[Register] Токен згенеровано:", token.substring(0, 15) + "...");

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("[Register] Відсутні поштові налаштування");
            return res.status(500).json({
                error: "Помилка сервера: відсутні поштові налаштування",
            });
        }

        try {
            console.log("[Register] Спроба відправки листа...");
            await sendVerificationEmail(email, token);
            console.log("[Register] Лист успішно відправлено");
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
                role: user.role,
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

// Verify Email
export const verifyEmail = async (req, res) => {
    console.log("[VerifyEmail] Початок обробки. Query параметри:", req.query);

    try {
        const { token } = req.query;
        console.log(
            "[VerifyEmail] Отримано токен:",
            token?.substring(0, 15) + "..."
        );

        if (!token) {
            console.error("[VerifyEmail] Токен відсутній");
            return res.redirect(
                `${
                    process.env.FRONTEND_URL
                }/login?verified=error&message=${encodeURIComponent(
                    "Токен відсутній"
                )}`
            );
        }

        try {
            console.log("[VerifyEmail] Спроба верифікації токена...");
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(
                "[VerifyEmail] Токен валідний. ID користувача:",
                decoded.userId
            );

            await User.verifyUser(decoded.userId);
            console.log("[VerifyEmail] Користувача успішно верифіковано");

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
                }/login?verified=error&message=${encodeURIComponent(
                    errorMessage
                )}`
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

// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("[Login] Початок обробки запиту. Email:", email);

        if (!email || !validateEmail(email)) {
            console.log("[Login] Невірний формат email:", email);
            return res.status(400).json({
                error: "Невірний формат email",
                code: "INVALID_EMAIL_FORMAT",
            });
        }

        if (!password || !validatePassword(password)) {
            console.log("[Login] Пароль не відповідає вимогам:", password);
            return res.status(400).json({
                error: "Пароль повинен містити мінімум 8 символів, хоча б одну велику літеру та одну цифру",
                code: "INVALID_PASSWORD_FORMAT",
            });
        }

        console.log("[Login] Пошук користувача за email:", email);
        const user = await User.findByEmail(email);
        if (!user) {
            console.log("[Login] Користувача не знайдено:", email);
            return res.status(404).json({
                error: "Акаунт не знайдено",
                code: "USER_NOT_FOUND",
            });
        }

        console.log("[Login] Перевірка пароля для користувача:", user.id);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("[Login] Невірний пароль для користувача:", user.id);
            return res.status(401).json({
                error: "Невірний пароль",
                code: "INVALID_PASSWORD",
            });
        }

        if (!user.isVerified) {
            console.log("[Login] Користувач не верифікований:", user.id);
            return res.status(403).json({
                error: "Електронну адресу не підтверджено",
                code: "EMAIL_NOT_VERIFIED",
            });
        }

        console.log("[Login] Оновлення токенів для користувача:", user.id);
        const newTokenVersion = await User.incrementTokenVersion(user.id);

        const accessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                tokenVersion: newTokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("[Login] Оновлення Redis для користувача:", user.id);
        await redisClient.del(`refresh:${user.id}`);
        await redisClient.setEx(`refresh:${user.id}`, 604800, refreshToken);

        // Додавання деталей гуртожитку та факультету для відповідних ролей
        let additionalFields = {};
        if (user.role === "dorm_manager" && user.dormitory_id) {
            const dormitory = await Dormitory.findById(user.dormitory_id);
            additionalFields.dormitory_id = user.dormitory_id;
            additionalFields.dormitory_name = dormitory?.name || null;
        }
        if (
            ["student_council_head", "student_council_member"].includes(user.role) &&
            user.faculty_id
        ) {
            const faculty = await Faculties.findById(user.faculty_id);
            additionalFields.faculty_id = user.faculty_id;
            additionalFields.faculty_name = faculty?.name || null;
        }
        if (user.role === "faculty_dean_office" && user.faculty_id) {
            const faculty = await Faculties.findById(user.faculty_id);
            additionalFields.faculty_id = user.faculty_id;
            additionalFields.faculty_name = faculty?.name || null;
        }

        // Перевірка завершеності профілю
        const isComplete = await isProfileComplete(user.id, user.role);

        // Оновлення is_profile_complete, якщо значення відрізняється
        if (user.is_profile_complete !== (isComplete ? 1 : 0)) {
            await pool.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [isComplete ? 1 : 0, user.id]
            );
        }

        console.log("[Login] Успішний вхід для користувача:", user.id);
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
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

// Logout
export const logout = async (req, res) => {
    try {
        const userId = req.user.userId;

        await redisClient.del(`refresh:${userId}`);
        await User.incrementTokenVersion(userId);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Помилка виходу:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Refresh Token
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
                .json({ error: "Недійсний або прострочений токен" });
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
            { expiresIn: "1d" }
        );

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error("[RefreshToken] Помилка:", error);
        res.status(403).json({ error: "Невірний або прострочений токен" });
    }
};

// Validate Token
export const validateToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [userRows] = await pool.query(
            `
            SELECT 
                u.id, u.email, u.name, u.avatar, u.role, u.is_profile_complete, u.faculty_id, u.dormitory_id,
                f.name AS faculty_name,
                d.name AS dormitory_name
            FROM users u
            LEFT JOIN faculties f ON u.faculty_id = f.id
            LEFT JOIN dormitories d ON u.dormitory_id = d.id
            WHERE u.id = ?
            `,
            [userId]
        );

        if (!userRows[0]) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        const user = userRows[0];
        const isComplete = await isProfileComplete(userId, user.role);

        // Оновлення is_profile_complete, якщо значення відрізняється
        if (user.is_profile_complete !== (isComplete ? 1 : 0)) {
            await pool.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [isComplete ? 1 : 0, userId]
            );
        }

        res.json({
            isValid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                faculty_id: user.faculty_id || null,
                faculty_name: user.faculty_name || null,
                dormitory_id: user.dormitory_id || null,
                dormitory_name: user.dormitory_name || null,
                is_profile_complete: isComplete,
            },
        });
    } catch (error) {
        console.error("[ValidateToken] Помилка:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

// Forgot Password
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
                error: "Цей акаунт зареєстровано через Google",
                code: "GOOGLE_ACCOUNT",
            });
        }

        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log(`[ForgotPassword] Токен для userID ${user.id} генеровано.`);

        if (!redisClient.isOpen) {
            console.log("[Redis] Перевірка з'єднання: не підключено, намагаємося підключитись.");
            await redisClient.connect();
        }

        console.log("[Redis] Стан підключення:", redisClient.isReady ? "Готово" : "Не готово");

        await redisClient.del(`reset:${user.id}`);
        await redisClient.setEx(`reset:${user.id}`, 60 * 60, resetToken);
        console.log("[Redis] Токен успішно збережено");

        const storedToken = await redisClient.get(`reset:${user.id}`);
        console.log("[Redis] Отриманий токен:", storedToken?.substring(0, 15));

        if (!storedToken || storedToken !== resetToken) {
            console.error("[ForgotPassword] Токен не збігається після запису в Redis.");
            return res.status(500).json({ error: "Невдала перевірка токена." });
        }

        const resetUrl = `${process.env.FRONTEND_URL}/new-password?token=${resetToken}`;

        try {
            await sendPasswordResetEmail(email, resetUrl);
            res.json({ message: "Лист для скидання пароля відправлено." });
        } catch (emailErr) {
            console.error("[Email] Помилка відправки листа:", emailErr);
            res.status(500).json({
                error: "Помилка відправки листа для скидання пароля.",
            });
        }
    } catch (error) {
        console.error("[ForgotPassword] Помилка:", {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            error: "Помилка сервера",
            details: process.env.NODE_ENV === "development" ? error.message : null,
        });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    console.log("[ResetPassword] Початок обробки запиту");

    try {
        const { token } = req.query;
        const { password } = req.body;

        console.log("[ResetPassword] Повний токен з запиту:", token?.slice(0, 15) + "...");
        console.log(
            "[ResetPassword] Поточний час сервера:",
            new Date().toISOString()
        );

        if (!token) {
            return res.status(401).json({ error: "Токен не надано" });
        }

        if (!token.match(/^[\w-]+\.[\w-]+\.[\w-_.+/=]*$/)) {
            console.error("[ResetPassword] Недійсний формат токена");
            return res.status(401).json({ error: "Недійсний формат токена" });
        }

        const unverifiedDecoded = jwt.decode(token);
        console.log(
            "[ResetPassword] Декодований токен (без верифікації):",
            unverifiedDecoded
        );

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(
            "[ResetPassword] Час життя токена:",
            decoded.exp - decoded.iat
        );

        const redisKeys = await redisClient.keys("reset:*");
        console.log("[ResetPassword] Всі ключі reset:* у Redis:", redisKeys);

        const storedToken = await redisClient.get(`reset:${decoded.userId}`);
        const ttl = await redisClient.ttl(`reset:${decoded.userId}`);
        console.log(
            `[ResetPassword] TTL для reset:${decoded.userId}: ${ttl} секунд`
        );

        if (!storedToken) {
            console.error("[ResetPassword] Токен вже використаний або недійсний");
            return res.status(401).json({ 
                error: "Токен вже використаний або недійсний",
                code: "TOKEN_EXPIRED_OR_USED"
            });
        }

        if (token !== storedToken) {
            console.error("[ResetPassword] Неспівпадіння токенів:", {
                отримано: token?.slice(0, 15),
                в_redis: storedToken?.slice(0, 15),
            });
            return res.status(401).json({ error: "Недійсний токен" });
        }

        await redisClient.del(`reset:${decoded.userId}`);

        const passwordValidation = validatePassword(password);
        if (!passwordValidation) {
            console.error(
                "[ResetPassword] Невірний формат пароля"
            );
            return res.status(400).json({
                error: "Пароль не відповідає вимогам",
                details: "Пароль повинен містити мінімум 8 символів, хоча б одну велику літеру та одну цифру"
            });
        }

        console.log("[ResetPassword] Хешування нового пароля");
        const hashedPassword = await bcrypt.hash(password, 12);
        console.log("[ResetPassword] Хеш успішно створений");

        console.log(
            `[ResetPassword] Виклик User.updatePassword для ${decoded.userId}`
        );
        const result = await User.updatePassword(
            decoded.userId,
            hashedPassword
        );

        if (result.affectedRows === 0) {
            console.error("[ResetPassword] Жодного запису не оновлено");
            throw new Error("Немає записів для оновлення");
        }
        console.log(`[ResetPassword] Оновлено записів: ${result.affectedRows}`);

        console.log("[ResetPassword] Інкремент версії токена");
        await User.incrementTokenVersion(decoded.userId);

        console.log("[ResetPassword] Видалення токенів з Redis");
        await redisClient.del(`refresh:${decoded.userId}`);
        console.log("[ResetPassword] Redis токени видалені");

        console.log("[ResetPassword] Відправка успішної відповіді");
        res.json({
            success: true,
            message: "Пароль успішно оновлено. Увійдіть з новим паролем.",
        });
    } catch (error) {
        console.error("[ResetPassword] Критична помилка:", {
            message: error.message,
            stack: error.stack,
            query: req.query,
            body: req.body,
        });

        if (error.name === "TokenExpiredError") {
            console.error("[ResetPassword] Токен протермінований");
            return res.status(401).json({ error: "Час дії токену минув" });
        }

        if (error.message.includes("Немає записів")) {
            console.error("[ResetPassword] Користувач не знайдений");
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.status(500).json({
            error: "Помилка сервера",
            details:
                process.env.NODE_ENV === "development" ? error.message : null,
        });
    }
};

// Get Profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [user] = await pool.query(
            `
            SELECT 
                u.id, u.email, u.name, u.avatar, u.role, u.faculty_id, u.dormitory_id,
                up.birthday, up.phone, up.about_me, up.interests, up.room, 
                up.dormitory, up.instagram, up.telegram, 
                up.faculty_id AS profile_faculty_id, up.group_name, up.course,
                f.name AS faculty_name,
                d.name AS dormitory_name
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN faculties f ON u.faculty_id = f.id
            LEFT JOIN dormitories d ON u.dormitory_id = d.id
            WHERE u.id = ?
            `,
            [userId]
        );

        if (!user[0]) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        const isComplete = await isProfileComplete(userId, user[0].role);

        const profile = {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            avatar: user[0].avatar,
            role: user[0].role,
            is_profile_complete: isComplete,
            birthday: user[0].birthday?.toISOString().split("T")[0] || null,
            phone: user[0].phone || null,
            about_me: user[0].about_me || null,
            interests: user[0].interests || null,
            room: user[0].room || null,
            dormitory: user[0].dormitory || null,
            instagram: user[0].instagram || null,
            telegram: user[0].telegram || null,
            dormitory_id: user[0].dormitory_id || null,
            dormitory_name: user[0].dormitory_name || null,
        };

        if (user[0].role === "student") {
            profile.faculty_id = user[0].profile_faculty_id || null;
            profile.faculty_name = user[0].faculty_name || null;
            profile.group_name = user[0].group_name || null;
            profile.course = user[0].course || null;
        } else if (["faculty_dean_office", "student_council_head", "student_council_member"].includes(user[0].role)) {
            profile.faculty_id = user[0].faculty_id || null;
            profile.faculty_name = user[0].faculty_name || null;
        }

        res.json(profile);
    } catch (error) {
        console.error("[GetProfile] Помилка:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

// Update Profile
// Update Profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const profileData = req.body;

        // Flexible Joi schema for all possible fields
        const schema = Joi.object({
            name: Joi.string().max(255).optional().allow(null),
            birthday: Joi.date().max(new Date()).optional().allow(null),
            phone: Joi.string().pattern(/^\+380\d{9}$/).optional().allow(null),
            aboutMe: Joi.string().max(1000).optional().allow(null),
            interests: Joi.string().max(255).optional().allow(null),
            room: Joi.string().max(10).optional().allow(null),
            dormitory: Joi.string().max(50).optional().allow(null),
            instagram: Joi.string().uri().optional().allow(null),
            telegram: Joi.string().uri().optional().allow(null),
            faculty_id: Joi.number().integer().positive().optional().allow(null),
            group_name: Joi.string().max(255).optional().allow(null),
            course: Joi.number().integer().min(1).max(6).optional().allow(null),
            dormitory_id: Joi.number().integer().positive().optional().allow(null),
        }).unknown(false); // Disallow unknown fields

        // Validate incoming data
        const { error } = schema.validate(profileData, { abortEarly: false });
        if (error) {
            const errorDetails = error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message,
            }));
            return res.status(400).json({ error: "Невалідні дані", details: errorDetails });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Step 1: Update `users` table
            const userUpdates = {};
            if (profileData.name !== undefined) {
                userUpdates.name = profileData.name;
            }

            // Update faculty_id in users for specific roles
            if (
                ["faculty_dean_office", "student_council_head", "student_council_member"].includes(role) &&
                profileData.faculty_id !== undefined
            ) {
                // Validate faculty_id existence
                const [faculty] = await connection.execute(
                    `SELECT id FROM faculties WHERE id = ?`,
                    [profileData.faculty_id]
                );
                if (profileData.faculty_id && !faculty[0]) {
                    return res.status(400).json({
                        error: "Невалідні дані",
                        details: [{ field: "faculty_id", message: "Факультет не існує" }],
                    });
                }
                userUpdates.faculty_id = profileData.faculty_id || null;
            }

            // Update dormitory_id in users for dorm_manager
            if (role === "dorm_manager" && profileData.dormitory_id !== undefined) {
                // Validate dormitory_id existence
                const [dormitory] = await connection.execute(
                    `SELECT id FROM dormitories WHERE id = ?`,
                    [profileData.dormitory_id]
                );
                if (profileData.dormitory_id && !dormitory[0]) {
                    return res.status(400).json({
                        error: "Невалідні дані",
                        details: [{ field: "dormitory_id", message: "Гуртожиток не існує" }],
                    });
                }
                userUpdates.dormitory_id = profileData.dormitory_id || null;
            }

            // Apply updates to users table
            if (Object.keys(userUpdates).length > 0) {
                const fields = Object.keys(userUpdates)
                    .map(field => `${field} = ?`)
                    .join(", ");
                const values = [...Object.values(userUpdates), userId];
                await connection.execute(
                    `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    values
                );
            }

            // Step 2: Update `user_profiles` table
            // Ensure user_profiles record exists
            await connection.execute(
                `INSERT INTO user_profiles (user_id) VALUES (?) 
                 ON DUPLICATE KEY UPDATE user_id = user_id`,
                [userId]
            );

            // Collect profile fields to update
            const profileUpdates = {};
            if (profileData.birthday !== undefined) profileUpdates.birthday = profileData.birthday || null;
            if (profileData.phone !== undefined) profileUpdates.phone = profileData.phone || null;
            if (profileData.aboutMe !== undefined) profileUpdates.about_me = profileData.aboutMe || null;
            if (profileData.interests !== undefined) profileUpdates.interests = profileData.interests || null;
            if (profileData.room !== undefined) profileUpdates.room = profileData.room || null;
            if (profileData.dormitory !== undefined) profileUpdates.dormitory = profileData.dormitory || null;
            if (profileData.instagram !== undefined) profileUpdates.instagram = profileData.instagram || null;
            if (profileData.telegram !== undefined) profileUpdates.telegram = profileData.telegram || null;

            // Student-specific fields in user_profiles
            if (role === "student") {
                if (profileData.faculty_id !== undefined) {
                    // Validate faculty_id existence
                    const [faculty] = await connection.execute(
                        `SELECT id FROM faculties WHERE id = ?`,
                        [profileData.faculty_id]
                    );
                    if (profileData.faculty_id && !faculty[0]) {
                        return res.status(400).json({
                            error: "Невалідні дані",
                            details: [{ field: "faculty_id", message: "Факультет не існує" }],
                        });
                    }
                    profileUpdates.faculty_id = profileData.faculty_id || null;
                }
                if (profileData.group_name !== undefined) profileUpdates.group_name = profileData.group_name || null;
                if (profileData.course !== undefined) profileUpdates.course = profileData.course || null;
            }

            // Apply updates to user_profiles table
            if (Object.keys(profileUpdates).length > 0) {
                const fields = Object.keys(profileUpdates)
                    .map(field => `${field} = ?`)
                    .join(", ");
                const values = [...Object.values(profileUpdates), userId];
                await connection.execute(
                    `UPDATE user_profiles SET ${fields} WHERE user_id = ?`,
                    values
                );
            }

            // Step 3: Recalculate is_profile_complete
            const isComplete = await isProfileComplete(userId, role);

            // Update is_profile_complete in users table
            await connection.execute(
                `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [isComplete ? 1 : 0, userId]
            );

            await connection.commit();

            // Step 4: Fetch updated user data
            const [updatedUser] = await pool.query(
                `
                SELECT 
                    u.id, u.email, u.name, u.avatar, u.role, u.faculty_id, u.dormitory_id,
                    up.birthday, up.phone, up.about_me, up.interests, up.room, 
                    up.dormitory, up.instagram, up.telegram, 
                    up.faculty_id AS profile_faculty_id, up.group_name, up.course,
                    f.name AS faculty_name,
                    d.name AS dormitory_name
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN faculties f ON u.faculty_id = f.id
                LEFT JOIN dormitories d ON u.dormitory_id = d.id
                WHERE u.id = ?
                `,
                [userId]
            );

            if (!updatedUser[0]) {
                throw new Error("Користувача не знайдено після оновлення");
            }

            const user = updatedUser[0];
            const responseUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                is_profile_complete: isComplete,
                birthday: user.birthday?.toISOString().split("T")[0] || null,
                phone: user.phone || null,
                about_me: user.about_me || null,
                interests: user.interests || null,
                room: user.room || null,
                dormitory: user.dormitory || null,
                instagram: user.instagram || null,
                telegram: user.telegram || null,
                dormitory_id: user.dormitory_id || null,
                dormitory_name: user.dormitory_name || null,
            };

            if (role === "student") {
                responseUser.faculty_id = user.profile_faculty_id || null;
                responseUser.faculty_name = user.faculty_name || null;
                responseUser.group_name = user.group_name || null;
                responseUser.course = user.course || null;
            } else if (["faculty_dean_office", "student_council_head", "student_council_member"].includes(role)) {
                responseUser.faculty_id = user.faculty_id || null;
                responseUser.faculty_name = user.faculty_name || null;
            }

            res.json({
                message: "Профіль успішно оновлено",
                user: responseUser,
            });
        } catch (error) {
            await connection.rollback();
            console.error("[UpdateProfile] Помилка:", error);
            res.status(400).json({
                error: "Помилка при оновленні профілю",
                details: error.message.includes("Факультет не існує") || error.message.includes("Гуртожиток не існує")
                    ? [{ field: error.message.includes("Факультет") ? "faculty_id" : "dormitory_id", message: error.message }]
                    : [{ field: "general", message: "Помилка сервера" }],
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("[UpdateProfile] Помилка:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
};

// Is Profile Complete
// Is Profile Complete
export const isProfileComplete = async (userId, role) => {
    try {
        // Fetch user data
        const [userRows] = await pool.execute(
            `SELECT name, faculty_id, dormitory_id, isVerified FROM users WHERE id = ?`,
            [userId]
        );
        // Fetch profile data
        const [profileRows] = await pool.execute(
            `SELECT phone, faculty_id, group_name, course 
             FROM user_profiles 
             WHERE user_id = ?`,
            [userId]
        );

        const user = userRows[0];
        const profile = profileRows[0] || {};

        // Base requirements for all roles
        if (!user?.name || !user?.isVerified || !profile?.phone) {
            return false;
        }

        // Role-specific requirements
        switch (role) {
            case "student":
                return !!(
                    profile.faculty_id &&
                    profile.group_name &&
                    profile.course &&
                    profile.course >= 1 &&
                    profile.course <= 6
                );
            case "dorm_manager":
                return !!user.dormitory_id;
            case "faculty_dean_office":
            case "student_council_head":
            case "student_council_member":
                return !!user.faculty_id;
            case "admin":
            case "superadmin":
                return true;
            default:
                console.warn(`[isProfileComplete] Невідома роль: ${role}`);
                return false;
        }
    } catch (error) {
        console.error("[isProfileComplete] Помилка перевірки профілю:", error);
        return false;
    }
};
export default {
    register,
    verifyEmail,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
    verifyGoogleToken,
    googleSignIn,
    getProfile,
    updateProfile,
    logout,
    validateToken,
    isProfileComplete,
};