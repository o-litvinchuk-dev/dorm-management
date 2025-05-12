import express from "express";
import {
  getAccommodationApplications,
  getAccommodationApplicationById,
  updateApplicationStatus,
  addApplicationComment,
  getApplicationComments,
} from "../../controllers/adminAccommodationController.js"; // Виправлено шлях імпорту
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// Middleware to check admin or dorm_admin role
const authorizeAdmin = (req, res, next) => {
  const allowedRoles = ["superadmin", "admin", "dorm_admin"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Доступ заборонено" });
  }
  next();
};

// Apply authentication and authorization to all routes
router.use(authenticate, authorizeAdmin);

// Routes
router.get("/", getAccommodationApplications);
router.get("/:id", getAccommodationApplicationById);
router.put("/:id/status", updateApplicationStatus);
router.post("/:id/comments", addApplicationComment);
router.get("/:id/comments", getApplicationComments);

export default router;