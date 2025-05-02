import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { getApplications } from "../../controllers/adminController.js"; // Оновлено шлях

const router = express.Router();

// Захищений маршрут для отримання всіх заявок
router.get(
  "/applications",
  authenticate,
  authorize("GET", "/api/v1/admin/applications"),
  getApplications
);

export default router;