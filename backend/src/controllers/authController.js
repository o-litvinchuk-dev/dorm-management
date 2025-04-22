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

// Валідація пароля
const validatePassword = (password) => {
    if (!password) return false;
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return password.length >= minLength && hasUpperCase && hasNumber;
};

// Валідація email
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

// Google Sign-In
export const googleSignIn = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: "Токен відсутній" });
        }

        const payload = await verifyGoogleToken(token); // Функція для верифікації токена Google
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
            // Оновлюємо token_version при вході
            await User.incrementTokenVersion(user.id);
            user = await User.findById(user.id);
        } else {
            const hashedPassword = await bcrypt.hash(payload.email + process.env.JWT_SECRET, 12);
            user = await User.create({
                email: payload.email,
                password: hashedPassword,
                name: payload.name, // Передаємо ім’я з Google
                avatar: payload.picture,
                provider: "google",
                google_id: payload.sub,
                isVerified: true,
                role: "student",
                token_version: 0,
            });
            // Create an entry in user_profiles
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
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ accessToken, refreshToken });
    } catch (error) {
        console.error("Помилка Google Sign-In:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
};

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

        // Перевірка наявності користувача
        console.log("[Register] Перевірка наявності користувача...");
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            console.error("[Register] Користувач вже існує");
            return res.status(409).json({
                error: "Користувач з цією адресою вже зареєстрований",
            });
        }

        // Хешування пароля
        console.log("[Register] Хешування паролю...");
        const hashedPassword = await bcrypt.hash(password, 12);
        console.log("[Register] Пароль успішно захешований");

        // Створення користувача
        console.log("[Register] Спробуємо створити користувача...");
        const role = req.body.role || "student";
        const user = await User.create({
            email,
            password: hashedPassword,
            isVerified: false,
            role,
            name: name || null,
        });
        // Create an entry in user_profiles
        await pool.execute(
            `INSERT INTO user_profiles (user_id) VALUES (?)`,
            [user.id]
        );
        console.log("[Register] Користувач створений. ID:", user.id);

        // Перевірка JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error("[Register] Відсутній JWT_SECRET");
            return res.status(500).json({
                error: "Помилка сервера: відсутній JWT_SECRET",
            });
        }

        // Генерація JWT токена
        console.log("[Register] Генерація JWT токена...");
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        console.log(
            "[Register] Токен згенеровано:",
            token.substring(0, 15) + "..."
        );

        // Перевірка поштових налаштувань
        console.log("[Register] Перевірка поштових налаштувань...");
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("[Register] Відсутні поштові налаштування");
            return res.status(500).json({
                error: "Помилка сервера: відсутні поштові налаштування",
            });
        }

        // Відправка email
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

        // Успішна відповідь
        return res
            .status(201)
            .json({ message: "Лист з підтвердженням успішно відправлено" });
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

        // Пошук користувача
        console.log("[Login] Пошук користувача за email:", email);
        const user = await User.findByEmail(email);
        if (!user) {
            console.log("[Login] Користувача не знайдено:", email);
            return res.status(404).json({
                error: "Акаунт не знайдено",
                code: "USER_NOT_FOUND",
            });
        }

        // Перевірка пароля
        console.log("[Login] Перевірка пароля для користувача:", user.id);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("[Login] Невірний пароль для користувача:", user.id);
            return res.status(401).json({
                error: "Невірний пароль",
                code: "INVALID_PASSWORD",
            });
        }

        // Перевірка верифікації email
        if (!user.isVerified) {
            console.log("[Login] Користувач не верифікований:", user.id);
            return res.status(403).json({
                error: "Електронну адресу не підтверджено",
                code: "EMAIL_NOT_VERIFIED",
            });
        }

        // Оновлення токенів
        console.log("[Login] Оновлення токенів для користувача:", user.id);
        const newTokenVersion = await User.incrementTokenVersion(user.id);

        const accessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                tokenVersion: newTokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Оновлення Redis
        console.log("[Login] Оновлення Redis для користувача:", user.id);
        await redisClient.del(`refresh:${user.id}`);
        await redisClient.setEx(`refresh:${user.id}`, 604800, refreshToken);

        console.log("[Login] Успішний вхід для користувача:", user.id);
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
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
      
      // Видаляємо рефреш токен з Redis
      await redisClient.del(`refresh:${userId}`);
      
      // Інкрементуємо версію токена
      await User.incrementTokenVersion(userId);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Помилка виходу:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

const errorHandler = (error, req, res) => {
    console.error("[ErrorHandler] Помилка:", error);
    res.status(500).json({
        error: "Внутрішня помилка сервера",
        ...(process.env.NODE_ENV === "development" && {
            details: error.message,
        }),
    });
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
                .json({ error: "Недійсний або протермінований токен" });
        }

        const newAccessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error("[RefreshToken] Помилка:", error);
        res.status(403).json({ error: "Невірний або прострочений токен" });
    }
};

export const validateToken = (req, res) => {
    res.json({ isValid: true, user: req.user });
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

        // Видаляємо всі попередні токени для цього користувача
        await redisClient.del(`reset:${user.id}`);
        
        // Зберігаємо новий токен
        await redisClient.setEx(`reset:${user.id}`, 60 * 60, resetToken); // 1 година
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

export const resetPassword = async (req, res) => {
    console.log("[ResetPassword] Початок обробки запиту");

    try {
        const { token } = req.query;
        const { password } = req.body;

        // Додаткове логування
        console.log("[ResetPassword] Повний токен з запиту:", token?.slice(0, 15) + "...");
        console.log(
            "[ResetPassword] Поточний час сервера:",
            new Date().toISOString()
        );

        if (!token) {
            return res.status(401).json({ error: "Токен не надано" });
        }

        // Перевірка формату токена
        if (!token.match(/^[\w-]+\.[\w-]+\.[\w-_.+/=]*$/)) {
            console.error("[ResetPassword] Недійсний формат токена");
            return res.status(401).json({ error: "Недійсний формат токена" });
        }

        // Декодування без верифікації для діагностики
        const unverifiedDecoded = jwt.decode(token);
        console.log(
            "[ResetPassword] Декодований токен (без верифікації):",
            unverifiedDecoded
        );

        // Верифікація токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(
            "[ResetPassword] Час життя токена:",
            decoded.exp - decoded.iat
        );

        // Діагностика Redis
        const redisKeys = await redisClient.keys("reset:*");
        console.log("[ResetPassword] Всі ключі reset:* у Redis:", redisKeys);

        // Перевірка наявності токена в Redis
        const storedToken = await redisClient.get(`reset:${decoded.userId}`);
        const ttl = await redisClient.ttl(`reset:${decoded.userId}`);
        console.log(
            `[ResetPassword] TTL для reset:${decoded.userId}: ${ttl} секунд`
        );

        // Перевірка на одноразовість токена
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

        // Видаляємо токен ОДРАЗУ після перевірки
        await redisClient.del(`reset:${decoded.userId}`);

        // Валідація пароля
        const validatePassword = (password) => {
            if (!password) return { isValid: false, errors: ["Пароль не надано"] };
            const errors = [];
            if (password.length < 8) errors.push("Мінімум 8 символів");
            if (!/[A-Z]/.test(password)) errors.push("Хоча б одна велика літера");
            if (!/[0-9]/.test(password)) errors.push("Хоча б одна цифра");
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        };

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            console.error(
                "[ResetPassword] Невірний формат пароля:",
                passwordValidation.errors
            );
            return res.status(400).json({
                error: "Пароль не відповідає вимогам",
                details: passwordValidation.errors.join(", ")
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

export const getProfile = async (req, res) => {
    try {
      const userId = req.user.userId;
  
      const [user] = await pool.query(
        `
        SELECT 
          u.id, u.email, u.name, u.avatar, u.role,
          up.birthday, up.phone, up.about_me, 
          up.interests, up.room, up.dormitory, 
          up.instagram, up.telegram
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?
      `,
        [userId]
      );
  
      if (!user[0]) {
        return res.status(404).json({ error: "Користувача не знайдено" });
      }
  
      // Ensure user_profiles exists
      if (!user[0].about_me && !user[0].phone && !user[0].birthday) {
        await pool.execute(
          `INSERT INTO user_profiles (user_id) VALUES (?) 
           ON DUPLICATE KEY UPDATE user_id = user_id`,
          [userId]
        );
      }
  
      res.json({
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        avatar: user[0].avatar,
        role: user[0].role,
        birthday: user[0].birthday?.toISOString().split("T")[0] || null,
        phone: user[0].phone || null,
        about_me: user[0].about_me || null,
        interests: user[0].interests || null,
        room: user[0].room || null,
        dormitory: user[0].dormitory || null,
        instagram: user[0].instagram || null,
        telegram: user[0].telegram || null,
      });
    } catch (error) {
      console.error("Помилка отримання профілю:", error);
      res.status(500).json({ error: "Помилка сервера" });
    }
  };
  
  export const updateProfile = async (req, res) => {
    try {
      const userId = req.user.userId;
      const profileData = req.body;
  
      const schema = Joi.object({
        birthday: Joi.date().max(new Date()).optional().allow(null),
        phone: Joi.string().pattern(/^\+380\d{9}$/).optional().allow(null),
        aboutMe: Joi.string().max(1000).optional().allow(null),
        interests: Joi.string().max(255).optional().allow(null),
        room: Joi.string().max(10).optional().allow(null),
        dormitory: Joi.string().max(50).optional().allow(null),
        instagram: Joi.string().uri().optional().allow(null),
        telegram: Joi.string().uri().optional().allow(null),
      });
  
      const { error } = schema.validate(profileData, { abortEarly: false });
      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }));
        return res.status(400).json({ error: "Невалідні дані", details: errorDetails });
      }
  
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
  
        // Ensure user_profiles exists
        await connection.execute(
            `INSERT INTO user_profiles (user_id) VALUES (?) 
             ON DUPLICATE KEY UPDATE user_id = user_id`,
            [userId]
        );
  
        await connection.query(
          `
          UPDATE user_profiles 
          SET 
            birthday = ?, 
            phone = ?, 
            about_me = ?, 
            interests = ?, 
            room = ?, 
            dormitory = ?, 
            instagram = ?, 
            telegram = ?
          WHERE user_id = ?
        `,
          [
            profileData.birthday || null,
            profileData.phone || null,
            profileData.aboutMe || null,
            profileData.interests || null,
            profileData.room || null,
            profileData.dormitory || null,
            profileData.instagram || null,
            profileData.telegram || null,
            userId,
          ]
        );
  
        await connection.commit();
        res.json({ message: "Профіль оновлено" });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Помилка оновлення профілю:", error);
      res.status(500).json({ error: "Помилка сервера" });
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
  };

