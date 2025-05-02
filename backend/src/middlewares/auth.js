import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { checkPermission, getEnforcer } from "../config/permissions.js";

export const authenticate = async (req, res, next) => {
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
        };
        console.log("[Auth] Користувач автентифікований:", req.user);
        next();
    } catch (error) {
        console.error("[Auth] Помилка автентифікації:", error.message);
        return res.status(403).json({ error: "Недійсний токен" });
    }
};

export const authorize = (action, resource) => async (req, res, next) => {
    const enforcer = await getEnforcer();
    const { user } = req;

    try {
        const allowed = await enforcer.enforce(user.role, resource, action);
        if (!allowed) {
            console.log("[Auth] Недостатньо прав, роль користувача:", user.role);
            return res.status(403).json({
                error: "Недостатньо прав для виконання цієї дії",
            });
        }
        next();
    } catch (error) {
        console.error("[Auth] Помилка авторизації:", error);
        res.status(500).json({ error: "Помилка сервера при перевірці прав" });
    }
};

// Експорт функції checkPermission для використання в маршрутах
export { checkPermission };