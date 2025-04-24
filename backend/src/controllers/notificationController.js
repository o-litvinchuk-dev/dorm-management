import Notification from "../models/Notification.js";

export const createNotification = async (req, res) => {
    try {
      const { user_id, title, description } = req.body;
  
      // Basic validation
      if (!user_id || !title || !description) {
        return res.status(400).json({ error: "Необхідні всі поля: user_id, title, description" });
      }
  
      const notificationId = await Notification.create({ user_id, title, description });
      res.status(201).json({ message: "Сповіщення створено", notificationId });
    } catch (error) {
      console.error("Помилка при створенні сповіщення:", error);
      res.status(500).json({ error: "Помилка сервера" });
    }
  };

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.findByUserId(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Помилка отримання сповіщень:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const success = await Notification.markAsRead(id, userId);
    if (!success) {
      return res.status(404).json({ error: "Сповіщення не знайдено" });
    }
    res.json({ message: "Сповіщення позначено як прочитане" });
  } catch (error) {
    console.error("Помилка відмітки сповіщення:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const success = await Notification.delete(id, userId);
    if (!success) {
      return res.status(404).json({ error: "Сповіщення не знайдено" });
    }
    res.json({ message: "Сповіщення видалено" });
  } catch (error) {
    console.error("Помилка видалення сповіщення:", error);
    res.status(500).json({ error: "Помилка сервера" });
  }
};