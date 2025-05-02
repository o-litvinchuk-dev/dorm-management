import pool from "../config/db.js";
import DormApplication from "../models/DormApplication.js";
import Dormitory from "../models/Dormitory.js";
import Settlement from "../models/Settlement.js";

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [applications] = await pool.execute(
      `SELECT * FROM dorm_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    const [notifications] = await pool.execute(
      `SELECT id, title, description, created_at, \`read\` 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    res.json({
      applications,
      notifications,
    });
  } catch (error) {
    console.error("[SecureController] Помилка отримання даних дашборду:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      `SELECT * FROM dorm_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("[SecureController] Помилка отримання заявок:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getDormitories = async (req, res) => {
  try {
    const dormitories = await Dormitory.findAll();
    res.json(dormitories);
  } catch (error) {
    console.error("[SecureController] Помилка отримання гуртожитків:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.findAll();
    res.json(settlements);
  } catch (error) {
    console.error("[SecureController] Помилка отримання розкладу поселення:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};