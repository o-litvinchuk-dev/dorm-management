import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
} from "../../controllers/notificationController.js";
import { getProfile, updateProfile } from "../../controllers/authController.js";
import {
  getApplications,
  getDormitories,
  getSettlements,
  getAccommodationApplications,
  getDashboardData,
} from "../../controllers/secureController.js";
import User from "../../models/User.js";

const router = Router();

// Отримання списку користувачів
router.get(
  "/users",
  authenticate,
  authorize("GET", "/api/v1/secure/users"),
  async (req, res) => {
    try {
      const users = await User.findByFacultyId(req.user.faculty_id || null);
      res.json(users);
    } catch (error) {
      console.error("[SecureRoutes] Помилка отримання користувачів:", error);
      res.status(500).json({ error: "Помилка сервера" });
    }
  }
);

router.get("/profile", authenticate, authorize("GET", "/api/v1/secure/profile"), getProfile);
router.patch("/profile", authenticate, authorize("PATCH", "/api/v1/secure/profile"), updateProfile);
router.get("/notifications", authenticate, authorize("GET", "/api/v1/secure/notifications"), getNotifications);
router.put(
  "/notifications/:id/read",
  authenticate,
  authorize("PUT", "/api/v1/secure/notifications/:id/read"),
  markNotificationAsRead
);
router.delete(
  "/notifications/:id",
  authenticate,
  authorize("DELETE", "/api/v1/secure/notifications/:id"),
  deleteNotification
);
router.post("/notifications", authenticate, authorize("POST", "/api/v1/secure/notifications"), createNotification);
router.get("/applications", authenticate, authorize("GET", "/api/v1/applications"), getApplications);
router.get("/dormitories", authenticate, authorize("GET", "/api/v1/secure/dormitories"), getDormitories);
router.get("/settlement", authenticate, authorize("GET", "/api/v1/settlement"), getSettlements);
router.get(
  "/accommodation-applications",
  authenticate,
  authorize("GET", "/api/v1/admin/accommodation-applications"),
  getAccommodationApplications
);
router.get("/dashboard", authenticate, authorize("GET", "/api/v1/secure/dashboard"), getDashboardData);

export default router;