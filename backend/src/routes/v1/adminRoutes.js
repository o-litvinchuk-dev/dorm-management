import express from "express";
import { getApplications } from "../../controllers/adminController.js";
import { authorize } from "../../middlewares/auth.js";
import {
  getAllReservationsAdmin,
  updateReservationStatusAdmin,
} from "../../controllers/roomReservationController.js";

const router = express.Router();

router.get(
  "/applications",
  authorize("GET", "/api/v1/admin/applications"),
  getApplications
);
router.get(
  "/applications-overview",
  authorize("GET", "/api/v1/admin/applications-overview"),
  async (req, res) => {
    res.json({ message: "Overview endpoint" });
  }
);

router.get(
  "/room-reservations",
  authorize("GET", "/api/v1/admin/room-reservations"),
  getAllReservationsAdmin
);
router.put(
  "/room-reservations/:reservationId/status",
  authorize("PUT", "/api/v1/admin/room-reservations/:reservationId/status"),
  updateReservationStatusAdmin
);

export default router;