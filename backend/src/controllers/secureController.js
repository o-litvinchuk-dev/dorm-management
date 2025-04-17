import User from "../models/User.js";

export const getDashboardData = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }
        res.json({
            message: "Secure dashboard data",
            email: user.email,
            role: user.role,
            name: user.name,
            avatar: user.avatar,
        });
    } catch (error) {
        res.status(500).json({ error: "Помилка сервера" });
    }
};