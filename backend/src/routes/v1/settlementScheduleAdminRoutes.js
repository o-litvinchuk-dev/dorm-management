import express from "express";
import {
    createScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    getScheduleEntries // Can also be used by admin to see all
} from "../../controllers/SettlementScheduleController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

router.use(authenticate); // All admin routes for schedule require authentication

router.post(
    "/",
    authorize("POST", "/api/v1/admin/settlement-schedule"),
    createScheduleEntry
);

router.get( // Admin can also get all entries, potentially with more filters later
    "/",
    authorize("GET", "/api/v1/admin/settlement-schedule"), // Could be same as student or more specific
    getScheduleEntries
);


router.put(
    "/:id",
    authorize("PUT", "/api/v1/admin/settlement-schedule/:id"),
    updateScheduleEntry
);

router.delete(
    "/:id",
    authorize("DELETE", "/api/v1/admin/settlement-schedule/:id"),
    deleteScheduleEntry
);

export default router;