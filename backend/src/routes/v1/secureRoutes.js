import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { checkPermission } from "../../config/permissions.js";
import { getDashboardData } from "../../controllers/secureController.js";
import { getProfile, updateProfile } from "../../controllers/authController.js";

const router = Router();

// Маршрути
router.get("/dashboard", authenticate, getDashboardData);

router.get("/admin", authenticate, authorize(["admin"]), (req, res) => {
    res.json({ message: "Адмінська панель" });
});

router.put(
    "/users/:id",
    authenticate,
    checkPermission("manage:users"),
    (req, res) => {
        // Логіка оновлення користувача
    }
);

// Маршрути для профілю
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);

// Експорт іменованого маршрутника
export { router as secureRoutes };
