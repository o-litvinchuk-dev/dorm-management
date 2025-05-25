import express from "express";
import {
  getAccommodationApplications,
  getAccommodationApplicationById,
  updateApplicationStatus,
  addApplicationComment,
  getApplicationComments,
} from "../../controllers/adminAccommodationController.js";
import { authenticate, authorize } from "../../middlewares/auth.js"; // Імпортуємо authorize

const router = express.Router();

// Застосовуємо authenticate для всіх маршрутів цього роутера
router.use(authenticate);

router.get(
  "/",
  authorize("GET", "/api/v1/admin/accommodation-applications"), // Використовуємо authorize з Casbin
  getAccommodationApplications
);

router.get(
  "/:id",
  authorize("GET", "/api/v1/admin/accommodation-applications/:id"), // Використовуємо authorize з Casbin
  getAccommodationApplicationById
);

router.put(
  "/:id/status",
  authorize("PUT", "/api/v1/admin/accommodation-applications/:id/status"), // Використовуємо authorize з Casbin
  updateApplicationStatus
);

router.post(
  "/:id/comments",
  authorize("POST", "/api/v1/admin/accommodation-applications/:id/comments"), // Використовуємо authorize з Casbin
  addApplicationComment
);

router.get(
  "/:id/comments",
  authorize("GET", "/api/v1/admin/accommodation-applications/:id/comments"), // Використовуємо authorize з Casbin
  getApplicationComments
);

export default router;