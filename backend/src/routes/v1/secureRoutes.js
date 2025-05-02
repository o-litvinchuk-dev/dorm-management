import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
} from "../../controllers/notificationController.js";
import { getProfile, updateProfile } from "../../controllers/authController.js";
import { getApplications, getDormitories, getSettlements } from "../../controllers/secureController.js";
import { checkPermission } from "../../config/permissions.js";

const router = Router();

// Захищені маршрути з авторизацією
// router.get("/dashboard", authenticate, authorize("GET", "/api/v1/secure/dashboard"), getDashboardData); // Закоментовано
router.get("/profile", authenticate, authorize("GET", "/api/v1/secure/profile"), getProfile);
router.patch("/profile", authenticate, authorize("PATCH", "/api/v1/secure/profile"), updateProfile);
router.get("/notifications", authenticate, authorize("GET", "/api/v1/secure/notifications"), getNotifications);
router.put("/notifications/:id/read", authenticate, authorize("PUT", "/api/v1/secure/notifications/:id/read"), markNotificationAsRead);
router.delete("/notifications/:id", authenticate, authorize("DELETE", "/api/v1/secure/notifications/:id"), deleteNotification);
router.post("/notifications", authenticate, authorize("POST", "/api/v1/secure/notifications"), createNotification);
router.get("/applications", checkPermission("secure"), getApplications);
router.get("/dormitories", checkPermission("secure"), getDormitories);
router.get("/settlement", checkPermission("secure"), getSettlements);

export { router as secureRoutes };