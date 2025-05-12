import jwt from "jsonwebtoken";
import { getEnforcer } from "../config/permissions.js";
import User from "../models/User.js";

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("[Auth] Токен відсутній у заголовку");
    return res.status(401).json({ error: "Немає токена" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[Auth] Токен верифіковано, userId:", decoded.userId);
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("[Auth] Користувача не знайдено для userId:", decoded.userId);
      return res.status(403).json({ error: "Користувача не знайдено" });
    }
    if (user.token_version !== decoded.tokenVersion) {
      console.log("[Auth] Невідповідність tokenVersion:", {
        db: user.token_version,
        token: decoded.tokenVersion,
      });
      return res.status(403).json({ error: "Недійсний токен" });
    }
    req.user = {
      userId: user.id,
      role: user.role,
      email: user.email,
      avatar: user.avatar,
      faculty_id: user.faculty_id || null,
      dormitory_id: user.dormitory_id || null,
    };
    console.log("[Auth] Користувач автентифікований:", req.user);
    next();
  } catch (error) {
    console.error("[Auth] Помилка автентифікації:", error.message);
    return res.status(403).json({ error: "Недійсний токен" });
  }
};

const authorize = (action, resource) => async (req, res, next) => {
  try {
    const user = req.user;
    console.log("[Authorize] Перевірка доступу:", { user: user.role, action, resource });

    // Перевірка для superadmin
    if (user.role === "superadmin") {
      console.log("[Authorize] Доступ дозволено для superadmin");
      return next();
    }

    const enforcer = await getEnforcer();
    const allowed = await enforcer.enforce(user.role, resource, action);
    console.log("[Authorize] Результат перевірки Casbin:", { allowed, user: user.role, action, resource });
    if (!allowed) {
      console.log("[Authorize] Доступ заборонено:", { user: user.role, action, resource });
      return res.status(403).json({ error: "Недостатньо прав для виконання цієї дії" });
    }
    console.log("[Authorize] Доступ дозволено:", { user: user.role, action, resource });
    next();
  } catch (error) {
    console.error("[Authorize] Помилка:", error);
    return res.status(500).json({ error: "Помилка авторизації" });
  }
};

export { authenticate, authorize };