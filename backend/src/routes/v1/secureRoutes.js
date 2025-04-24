import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotification, // Import the new controller function
} from "../../controllers/notificationController.js";
import { getDashboardData } from "../../controllers/secureController.js";
import { getProfile, updateProfile } from "../../controllers/authController.js";

const router = Router();

// Existing routes
router.get("/dashboard", authenticate, getDashboardData);
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);
router.get("/notifications", authenticate, getNotifications);
router.put("/notifications/:id/read", authenticate, markNotificationAsRead);
router.delete("/notifications/:id", authenticate, deleteNotification);

// New POST route for creating notifications
router.post("/notifications", authenticate, createNotification);

export { router as secureRoutes };