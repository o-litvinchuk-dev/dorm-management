// src/routes/v1/eventRoutes.js
import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
    createEvent,
    getEventById,
    getAllEventsForUser,
    getAllEventsAdmin,
    updateEvent,
    deleteEvent
} from "../../controllers/eventController.js";

const router = express.Router();

// Для адмінів/комендантів/деканатів
router.post("/admin/events", authenticate, authorize("POST", "/api/v1/admin/events"), createEvent);
router.get("/admin/events", authenticate, authorize("GET", "/api/v1/admin/events"), getAllEventsAdmin); // Загальний список для адмінки
router.put("/admin/events/:eventId", authenticate, authorize("PUT", "/api/v1/admin/events/:eventId"), updateEvent);
router.delete("/admin/events/:eventId", authenticate, authorize("DELETE", "/api/v1/admin/events/:eventId"), deleteEvent);

// Для авторизованих користувачів (студентів в основному)
router.get("/secure/events", authenticate, authorize("GET", "/api/v1/secure/events"), getAllEventsForUser);
router.get("/secure/events/:eventId", authenticate, authorize("GET", "/api/v1/secure/events/:eventId"), getEventById); // Можливо, потрібна додаткова перевірка доступу в контролері

export default router;