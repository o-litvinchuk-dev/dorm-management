import express from "express";
import { getDormManagerStats } from "../../controllers/dormManagerController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

router.get(
  "/stats",
  authenticate,
  authorize("GET", "/api/v1/dorm-manager/stats"), // Ensure this matches Casbin policy
  getDormManagerStats
);

export default router;