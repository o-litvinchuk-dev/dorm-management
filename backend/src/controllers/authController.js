// src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Залишаємо для verifyEmail та resetPassword
import User from "../models/User.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailSender.js";
import redisClient from "../config/redis.js";
import pool from "../config/db.js";
import { OAuth2Client } from "google-auth-library";
import Joi from "joi";
import Dormitory from "../models/Dormitory.js";
import Faculties from "../models/Faculties.js";
import UserProfile from "../models/UserProfile.js";
import { isProfileComplete } from "../utils/profileUtils.js";
import { generateTokens as generateTokensService } from "../services/tokenService.js"; // Додано імпорт
import { v4 as uuidv4 } from "uuid"; // Додано імпорт
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { encrypt, decrypt } from "../utils/crypto.js";


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
      const newTokenVersion = await User.incrementTokenVersion(user.id); // Отримуємо нову версію токена
      user = await User.findById(user.id); // Оновлюємо об'єкт користувача після інкременту

      const sessionId = uuidv4(); // Генеруємо новий sessionId
      const { accessToken, refreshToken } = generateTokensService(user, sessionId, newTokenVersion); // Передаємо sessionId та newTokenVersion
      
      await redisClient.del(`refresh:${user.id}:*`); // Очищаємо всі старі refresh токени для цього user_id
      await redisClient.setEx(`refresh:${user.id}:${sessionId}`, parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS), refreshToken); // Зберігаємо з sessionId

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
        sessionId, // Повертаємо sessionId
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
        token_version: 0, // Початкова версія токена
        gender: payload.gender || 'not_specified',
      });
      await pool.execute(
        `INSERT INTO user_profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id`,
        [user.id]
      );

      const sessionId = uuidv4(); // Генеруємо новий sessionId для нового користувача
      const { accessToken, refreshToken } = generateTokensService(user, sessionId, user.token_version); // Передаємо sessionId
      
      await redisClient.setEx(`refresh:${user.id}:${sessionId}`, parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS), refreshToken); // Зберігаємо з sessionId

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
        sessionId, // Повертаємо sessionId
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
    }
  } catch (error) {
    console.error("Помилка Google Sign-In:", error);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
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

    const newTokenVersion = await User.incrementTokenVersion(user.id); // Інкрементуємо token_version
    const sessionId = uuidv4(); // Генеруємо унікальний sessionId
    const { accessToken, refreshToken } = generateTokensService(user, sessionId, newTokenVersion); // Передаємо sessionId та newTokenVersion

    await redisClient.del(`refresh:${user.id}:*`); // Очищаємо всі старі refresh токени для цього user_id
    await redisClient.setEx(`refresh:${user.id}:${sessionId}`, parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS), refreshToken); // Зберігаємо з sessionId

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
      sessionId, // Повертаємо sessionId
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
    const sessionId = req.user.sessionId; // Отримуємо sessionId з req.user

    if (userId && sessionId) {
      await redisClient.del(`refresh:${userId}:${sessionId}`); // Видаляємо конкретний refresh токен
    }
    await User.incrementTokenVersion(userId); // Інвалідуємо всі інші токени для цього user

    res.status(200).json({ success: true, message: "Вихід успішний" });
  } catch (error) {
    console.error("Помилка виходу:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Токен оновлення відсутній", code: "REFRESH_TOKEN_MISSING" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Токен оновлення прострочено", code: "REFRESH_TOKEN_EXPIRED" });
      }
      return res.status(401).json({ error: "Недійсний токен оновлення", code: "INVALID_REFRESH_TOKEN" });
    }

    // Перевіряємо наявність userId та sessionId у декодованому токені
    if (!decoded.userId || !decoded.sessionId) {
      return res.status(401).json({ error: "Недійсний пейлоад токена оновлення", code: "INVALID_REFRESH_TOKEN_PAYLOAD" });
    }

    const storedToken = await redisClient.get(`refresh:${decoded.userId}:${decoded.sessionId}`);
    if (!storedToken || token !== storedToken) {
      // Якщо токен не знайдено або не збігається, можливо, він був використаний або відкликаний
      return res.status(401).json({ error: "Токен оновлення вже використано або недійсний", code: "REFRESH_TOKEN_USED_OR_INVALID" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: "Користувача не знайдено для токена", code: "USER_NOT_FOUND_FOR_TOKEN" });
    }

    // Генеруємо нові токени, використовуючи ту саму sessionId та поточну token_version користувача
    const { accessToken } = generateTokensService(user, decoded.sessionId, user.token_version);

    res.json({ accessToken });
  } catch (error) {
    console.error("[RefreshToken] Помилка:", error);
    res.status(500).json({ error: "Внутрішня помилка сервера", details: error.message });
  }
};

export const validateToken = async (req, res) => {
  try {
    // Дані вже додані middleware auth.js
    const userFromDb = req.user;
    if (!userFromDb) { // Це не повинно відбуватися, якщо authenticate відпрацював успішно
      return res.status(404).json({ error: "Користувача не знайдено", code: "USER_NOT_FOUND" });
    }

    let facultyName = null;
    if (userFromDb.faculty_id) {
      const faculty = await Faculties.findById(userFromDb.faculty_id);
      facultyName = faculty?.name || null;
    }

    let dormitoryName = null;
    if (userFromDb.dormitory_id) {
      const dormitory = await Dormitory.findById(userFromDb.dormitory_id);
      dormitoryName = dormitory?.name || null;
    }

    const isComplete = await isProfileComplete(userFromDb.userId, userFromDb.role);
    // Оновлюємо is_profile_complete в базі, якщо він не збігається
    if (userFromDb.is_profile_complete !== isComplete) {
      await pool.execute(
        `UPDATE users SET is_profile_complete = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [isComplete ? 1 : 0, userFromDb.userId]
      );
    }

    res.json({
      isValid: true,
      user: {
        id: userFromDb.userId, // Використовуємо userId з req.user
        email: userFromDb.email,
        name: userFromDb.name,
        avatar: userFromDb.avatar,
        role: userFromDb.role,
        gender: userFromDb.gender,
        faculty_id: userFromDb.faculty_id,
        faculty_name: facultyName,
        dormitory_id: userFromDb.dormitory_id,
        dormitory_name: dormitoryName,
        is_profile_complete: isComplete,
        sessionId: userFromDb.sessionId, // Повертаємо sessionId
      },
    });
  } catch (error) {
    console.error("[ValidateToken] Помилка:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
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
up.dormitory, up.instagram, up.telegram, up.banner,
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
    banner: user.banner,
    role: user.role,
    gender: user.gender,
    is_profile_complete: isComplete,
    birthday: user.birthday ? decrypt(user.birthday) : null,
    // FIX: Перевіряємо, чи є поле зашифрованим перед дешифруванням
    phone: user.phone ? (String(user.phone).includes(':') ? decrypt(user.phone) : user.phone) : null,
    about_me: user.about_me ? decrypt(user.about_me) : null,
    interests: user.interests ? decrypt(user.interests) : null,
    room: user.room ? decrypt(user.room) : null,
    dormitory: user.dormitory ? decrypt(user.dormitory) : null,
    instagram: user.instagram ? decrypt(user.instagram) : null,
    telegram: user.telegram ? decrypt(user.telegram) : null,
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.userId;
    const role = req.user.role;

    const isStudent = role === "student";
    const isFacultyRole = ["faculty_dean_office", "student_council_head", "student_council_member"].includes(role);
    const isDormManager = role === "dorm_manager";

    const profileData = req.body;
    const validationSchema = Joi.object({
      name: Joi.string().trim().max(255).optional().allow(null, ''),
      gender: Joi.string().valid('male', 'female', 'other', 'not_specified').optional(),
      phone: Joi.string().trim().pattern(/^\+380\d{9}$/).optional().allow(null, ''),
      birthday: Joi.date().iso().max('now').optional().allow(null, ''),
      about_me: Joi.string().trim().max(1000).optional().allow(null, ''),
      interests: Joi.string().trim().max(255).optional().allow(null, ''),
      room: Joi.string().trim().max(10).optional().allow(null, ''),
      dormitory: Joi.string().trim().max(50).optional().allow(null, ''),
      instagram: Joi.string().trim().max(255).optional().allow(null, ''),
      telegram: Joi.string().trim().max(255).optional().allow(null, ''),
      faculty_id: Joi.number().integer().positive().optional().allow(null),
      group_id: Joi.number().integer().positive().optional().allow(null),
      course: Joi.number().integer().min(1).max(6).optional().allow(null),
      dormitory_id: Joi.number().integer().positive().optional().allow(null),
    }).unknown(true);
    
    const { error, value: validatedData } = validationSchema.validate(profileData);
    if (error) {
      await connection.rollback();
      return res.status(400).json({ error: "Невалідні дані", details: error.details });
    }
    
    const currentUserProfile = await UserProfile.findByUserId(userId, connection);
    const userUpdates = {};
    const profileUpdates = {};

    if (req.files?.avatar?.[0]) {
      const oldAvatarPath = currentUserProfile?.avatar ? path.join(__dirname, '..', '..', currentUserProfile.avatar) : null;
      userUpdates.avatar = `/uploads/avatars/${req.files.avatar[0].filename}`;
      if(oldAvatarPath && await fs.access(oldAvatarPath).then(() => true).catch(() => false)) {
        await fs.unlink(oldAvatarPath);
      }
    }
    if (req.files?.banner?.[0]) {
      const oldBannerPath = currentUserProfile?.banner ? path.join(__dirname, '..', '..', currentUserProfile.banner) : null;
      profileUpdates.banner = `/uploads/banners/${req.files.banner[0].filename}`;
      if(oldBannerPath && await fs.access(oldBannerPath).then(() => true).catch(() => false)) {
        await fs.unlink(oldBannerPath);
      }
    }
    
    if (validatedData.name !== undefined) userUpdates.name = validatedData.name;
    if (validatedData.gender !== undefined) userUpdates.gender = validatedData.gender;
    if (isFacultyRole && validatedData.faculty_id !== undefined) userUpdates.faculty_id = validatedData.faculty_id || null;
    if (isDormManager && validatedData.dormitory_id !== undefined) userUpdates.dormitory_id = validatedData.dormitory_id || null;

    // FIX: Завжди шифруємо чутливі дані при збереженні
    if (validatedData.phone !== undefined) profileUpdates.phone = validatedData.phone ? encrypt(validatedData.phone) : null;
    if (validatedData.birthday !== undefined) profileUpdates.birthday = validatedData.birthday ? encrypt(new Date(validatedData.birthday).toISOString().split('T')[0]) : null;
    if (validatedData.room !== undefined) profileUpdates.room = validatedData.room ? encrypt(validatedData.room) : null;
    if (validatedData.dormitory !== undefined) profileUpdates.dormitory = validatedData.dormitory ? encrypt(validatedData.dormitory) : null;
    if (validatedData.about_me !== undefined) profileUpdates.about_me = validatedData.about_me ? encrypt(validatedData.about_me) : null;
    if (validatedData.interests !== undefined) profileUpdates.interests = validatedData.interests ? encrypt(validatedData.interests) : null;
    if (validatedData.instagram !== undefined) profileUpdates.instagram = validatedData.instagram ? encrypt(validatedData.instagram) : null;
    if (validatedData.telegram !== undefined) profileUpdates.telegram = validatedData.telegram ? encrypt(validatedData.telegram) : null;

    if (isStudent) {
      if(validatedData.faculty_id !== undefined) profileUpdates.faculty_id = validatedData.faculty_id || null;
      if(validatedData.group_id !== undefined) profileUpdates.group_id = validatedData.group_id || null;
      if(validatedData.course !== undefined) profileUpdates.course = validatedData.course || null;
    }
    
    if (Object.keys(userUpdates).length > 0) {
      const userFields = Object.keys(userUpdates).map(field => `\`${field}\` = ?`).join(', ');
      await connection.execute(`UPDATE users SET ${userFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...Object.values(userUpdates), userId]);
    }
    
    if (Object.keys(profileUpdates).length > 0) {
      if (currentUserProfile) {
        const profileFields = Object.keys(profileUpdates).map(field => `\`${field}\` = ?`).join(', ');
        await connection.execute(`UPDATE user_profiles SET ${profileFields} WHERE user_id = ?`, [...Object.values(profileUpdates), userId]);
      } else {
        await connection.execute(`INSERT INTO user_profiles (user_id, ${Object.keys(profileUpdates).join(', ')}) VALUES (?, ${Object.values(profileUpdates).map(() => '?').join(', ')})`, [userId, ...Object.values(profileUpdates)]);
      }
    }

    const isComplete = await isProfileComplete(userId, role, connection);
    await connection.execute(`UPDATE users SET is_profile_complete = ? WHERE id = ?`, [isComplete ? 1 : 0, userId]);

    await connection.commit();
    res.json({ message: "Профіль успішно оновлено" });
  } catch (error) {
    await connection.rollback();
    console.error("[UpdateProfile] Помилка:", error);
    res.status(500).json({ error: "Помилка сервера", details: error.message });
  } finally {
    connection.release();
  }
};


export default {
  register,
  verifyEmail,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleSignIn,
  getProfile,
  updateProfile,
  validateToken,
};