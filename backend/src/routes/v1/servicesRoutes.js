import { Router } from "express";
import { getServices, createDormApplication, submitAccommodationApplication } from "../../controllers/serviceController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Specific rate limiter for accommodation applications
const applicationSubmissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Max 5 submissions per window per user
  message: { error: "Ви перевищили ліміт подачі заявок на сьогодні. Спробуйте пізніше.", code: "TOO_MANY_APPLICATIONS" },
  keyGenerator: (req) => {
    // Key by user ID if authenticated
    return req.user?.userId || req.ip;
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

router.get("/", getServices);
router.post("/settlement", authenticate, authorize("POST", "/api/v1/services/settlement"), createDormApplication);
router.post(
  "/accommodation-application",
  authenticate,
  applicationSubmissionLimiter, // Apply specific rate limiter
  authorize("POST", "/api/v1/services/accommodation-application"),
  submitAccommodationApplication
);

export default router;