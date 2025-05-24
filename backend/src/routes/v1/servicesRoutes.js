import { Router } from "express";
import {
  getServices,
  createDormApplication,
  submitAccommodationApplication,
} from "../../controllers/serviceController.js";
import { createSettlementContract } from "../../controllers/settlementContractController.js";
import {
  searchAvailableRooms,
  reserveRoom,
  getRoomDetails,
} from "../../controllers/roomReservationController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();

const applicationSubmissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit each IP/user to 5 application submissions per windowMs
  message: {
    error:
      "Ви перевищили ліміт подачі заявок на сьогодні. Спробуйте пізніше.",
    code: "TOO_MANY_APPLICATIONS",
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip; // Use userId if authenticated, otherwise IP
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.get("/", getServices);

router.post(
  "/settlement",
  authenticate,
  authorize("POST", "/api/v1/services/settlement"),
  createDormApplication
);

router.post(
  "/accommodation-application",
  authenticate,
  applicationSubmissionLimiter,
  authorize("POST", "/api/v1/services/accommodation-application"),
  submitAccommodationApplication
);

router.post(
  "/settlement-agreement",
  authenticate,
  authorize("POST", "/api/v1/services/settlement-agreement"),
  createSettlementContract
);

router.get(
  "/rooms/search",
  authenticate,
  authorize("GET", "/api/v1/services/rooms/search"),
  searchAvailableRooms
);
router.get(
  "/rooms/:roomId",
  authenticate,
  authorize("GET", "/api/v1/services/rooms/:roomId"), // Assuming same permission as search or create specific
  getRoomDetails
);
router.post(
  "/rooms/:roomId/reserve",
  authenticate,
  authorize("POST", "/api/v1/services/rooms/:roomId/reserve"),
  reserveRoom
);

export default router;