import DormApplication from "../models/DormApplication.js";

export const getApplications = async (req, res) => {
  try {
    const applications = await DormApplication.findAll();
    res.json(applications);
  } catch (error) {
    console.error("[AdminController] Помилка отримання заявок:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};