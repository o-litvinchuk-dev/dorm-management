import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
} from "../../controllers/notificationController.js";
import { getProfile, updateProfile } from "../../controllers/authController.js";
import {
  getApplications,
  getDormitories,
  getSettlements,
  getAccommodationApplications,
  getDashboardData,
  getMyAccommodationApplications,
  createAccommodationApplication,
  getAccommodationApplicationById,
  cancelAccommodationApplication,
  getMySettlementAgreements, // Added new controller
  getSettlementAgreementByIdForUser, // Added new controller
} from "../../controllers/secureController.js";
import User from "../../models/User.js";
import {
  getMyReservations,
  cancelMyReservation,
} from "../../controllers/roomReservationController.js";

const router = Router();
router.use(authenticate);

router.get(
  "/users",
  authorize("GET", "/api/v1/secure/users"),
  async (req, res) => {
    try {
      const users = await User.findByFacultyId(req.user.faculty_id || null);
      res.json(users);
    } catch (error) {
      console.error("[SecureRoutes] Помилка отримання користувачів:", error);
      res.status(500).json({ error: "Помилка сервера" });
    }
  }
);

router.get("/profile", authorize("GET", "/api/v1/secure/profile"), getProfile);
router.patch(
  "/profile",
  authorize("PATCH", "/api/v1/secure/profile"),
  updateProfile
);

router.get(
  "/notifications",
  authorize("GET", "/api/v1/secure/notifications"),
  getNotifications
);
router.post(
  "/notifications",
  authorize("POST", "/api/v1/secure/notifications"),
  createNotification
);
router.put(
  "/notifications/:id/read",
  authorize("PUT", "/api/v1/secure/notifications/:id/read"),
  markNotificationAsRead
);
router.delete(
  "/notifications/:id",
  authorize("DELETE", "/api/v1/secure/notifications/:id"),
  deleteNotification
);

router.get(
  "/applications",
  authorize("GET", "/api/v1/applications"),
  getApplications
);
router.get(
  "/dormitories",
  authorize("GET", "/api/v1/secure/dormitories"),
  getDormitories
);
router.get(
  "/settlement",
  authorize("GET", "/api/v1/settlement"),
  getSettlements
);

router.get(
  "/accommodation-applications",
  authorize("GET", "/api/v1/admin/accommodation-applications"),
  getAccommodationApplications
);

router.get(
  "/dashboard",
  authorize("GET", "/api/v1/secure/dashboard"),
  getDashboardData
);

router.get(
  "/my-accommodation-applications",
  authorize("GET", "/api/v1/accommodation-applications/my"),
  getMyAccommodationApplications
);
router.get(
  "/my-accommodation-applications/:id",
  authorize("GET", "/api/v1/accommodation-applications/my/:id"),
  getAccommodationApplicationById
);
router.delete(
  "/my-accommodation-applications/:id",
  authorize("DELETE", "/api/v1/accommodation-applications/my/:id"),
  cancelAccommodationApplication
);

router.get(
  "/my-reservations",
  authorize("GET", "/api/v1/secure/my-reservations"),
  getMyReservations
);
router.delete(
  "/my-reservations/:reservationId",
  authorize("DELETE", "/api/v1/secure/my-reservations/:reservationId"),
  cancelMyReservation
);

// New settlement agreement routes
router.get(
  "/my-settlement-agreements",
  authorize("GET", "/api/v1/secure/my-settlement-agreements"),
  getMySettlementAgreements
);

router.get(
  "/my-settlement-agreements/:id",
  authorize("GET", "/api/v1/secure/my-settlement-agreements/:id"),
  getSettlementAgreementByIdForUser
);

export default router;