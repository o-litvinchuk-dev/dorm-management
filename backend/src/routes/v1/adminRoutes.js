import express from "express";
import { getApplications } from "../../controllers/adminController.js";
// Імпортуємо authorize замість checkPermission
import { authorize } from "../../middlewares/auth.js";

const router = express.Router();

// Захищений маршрут для отримання всіх заявок
router.get("/applications", authorize("GET", "/api/v1/admin/applications"), getApplications);

// Захищений маршрут для огляду заявок
router.get("/applications-overview", authorize("GET", "/api/v1/admin/applications-overview"), async (req, res) => {
  // Placeholder for overview endpoint, handled by frontend for now
  res.json({ message: "Overview endpoint" });
});

export default router;