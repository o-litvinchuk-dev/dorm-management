// src/middlewares/auth.js
import jwt from "jsonwebtoken";
import { getEnforcer } from "../config/permissions.js";
import User from "../models/User.js";
import Faculties from "../models/Faculties.js";
import Dormitory from "../models/Dormitory.js";

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("[Auth] Токен відсутній у заголовку");
    return res.status(401).json({ error: "Немає токена", code: "TOKEN_MISSING" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[Auth] Токен верифіковано, userId:", decoded.userId);

    // Додано перевірки на обов'язкові поля в пейлоаді токена
    if (!decoded.userId || decoded.tokenVersion === undefined || !decoded.sessionId) {
      console.log("[Auth] Некоректний пейлоад токена:", decoded);
      return res.status(403).json({ error: "Недійсний токен: некоректний пейлоад", code: "INVALID_TOKEN_PAYLOAD" });
    }

    const userFromDb = await User.findById(decoded.userId);
    if (!userFromDb) {
      console.log("[Auth] Користувача не знайдено для userId:", decoded.userId);
      return res.status(403).json({ error: "Користувача не знайдено", code: "USER_NOT_FOUND" });
    }

    // Перевірка token_version для інвалідації всіх токенів користувача після зміни пароля
    if (userFromDb.token_version !== decoded.tokenVersion) {
      console.log("[Auth] Невідповідність tokenVersion:", {
        db: userFromDb.token_version,
        token: decoded.tokenVersion,
      });
      return res.status(403).json({ error: "Недійсний токен: версія токена застаріла", code: "TOKEN_VERSION_MISMATCH" });
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

    req.user = {
      userId: userFromDb.id,
      role: userFromDb.role,
      email: userFromDb.email,
      name: userFromDb.name,
      avatar: userFromDb.avatar,
      faculty_id: userFromDb.faculty_id || null,
      faculty_name: facultyName,
      dormitory_id: userFromDb.dormitory_id || null,
      dormitory_name: dormitoryName,
      is_profile_complete: userFromDb.is_profile_complete === 1,
      sessionId: decoded.sessionId, // Додано sessionId до об'єкта req.user
    };

    console.log("[Auth] Користувач автентифікований:", { id: req.user.userId, role: req.user.role, sessionId: req.user.sessionId });
    next();
  } catch (error) {
    console.error("[Auth] Помилка автентифікації:", error.name, error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Токен прострочено", code: "TOKEN_EXPIRED" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Недійсний токен", code: "INVALID_TOKEN" });
    }
    // Загальна помилка автентифікації, якщо не підпадає під інші категорії JWT
    return res.status(500).json({ error: "Помилка автентифікації", details: error.message, code: "AUTHENTICATION_FAILED" });
  }
};

const authorize = (action, resource) => async (req, res, next) => {
  try {
    const user = req.user;
    console.log("[Authorize] Перевірка доступу:", { user: user.role, action, resource });

    // Супер-адмін завжди має повний доступ
    if (user.role === "superadmin") {
      console.log("[Authorize] Доступ дозволено для superadmin");
      return next();
    }

    const enforcer = await getEnforcer();
    const allowed = await enforcer.enforce(user.role, resource, action);
    console.log("[Authorize] Результат перевірки Casbin:", { allowed, user: user.role, action, resource });

    if (!allowed) {
      console.log("[Authorize] Доступ заборонено:", { user: user.role, action, resource });
      return res.status(403).json({ error: "Недостатньо прав для виконання цієї дії", code: "INSUFFICIENT_PERMISSIONS" });
    }

    console.log("[Authorize] Доступ дозволено:", { user: user.role, action, resource });
    next();
  } catch (error) {
    console.error("[Authorize] Помилка:", error);
    return res.status(500).json({ error: "Помилка авторизації", details: error.message });
  }
};

export { authenticate, authorize };