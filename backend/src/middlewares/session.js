import pool from "../config/db.js";
import redisClient from "../config/redis.js";
import { v4 as uuidv4 } from "uuid";

export const updateSessionActivity = async (req, res, next) => {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) return next();

  try {
    const [sessions] = await pool.query(
      "SELECT user_id, expires_at FROM sessions WHERE id = ?",
      [sessionId]
    );
    if (sessions.length === 0) {
      return res.status(401).json({ error: "Сесія не знайдена", code: "SESSION_NOT_FOUND" });
    }

    const now = new Date();
    const expiresAt = new Date(sessions[0].expires_at);
    if (now > expiresAt) {
      await pool.execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
      return res.status(401).json({ error: "Сесія прострочена", code: "SESSION_EXPIRED" });
    }

    const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await pool.execute(
      "UPDATE sessions SET last_active_at = ?, expires_at = ? WHERE id = ?",
      [now, newExpiresAt, sessionId]
    );

    // Генерація CSRF токена
    const csrfToken = uuidv4();
    await redisClient.setEx(`csrf:${sessions[0].user_id}:${sessionId}`, 3600, csrfToken);

    // Логування дії
    await pool.execute(
      "INSERT INTO session_logs (user_id, session_id, action, ip_address, device_type) VALUES (?, ?, ?, ?, ?)",
      [sessions[0].user_id, sessionId, "update", req.ip, req.headers["user-agent"] || "Unknown"]
    );

    res.setHeader("X-CSRF-Token", csrfToken);
    next();
  } catch (error) {
    console.error("[SessionActivity] Помилка:", error);
    res.status(500).json({ error: "Помилка сервера", code: "INTERNAL_SERVER_ERROR" });
  }
};