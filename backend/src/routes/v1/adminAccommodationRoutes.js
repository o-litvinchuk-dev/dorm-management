import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import {
  getAccommodationApplications,
  getAccommodationApplicationById,
  updateApplicationStatus,
  addApplicationComment,
  getApplicationComments
} from "../../controllers/adminAccommodationController.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("GET", "/api/v1/admin/accommodation-applications"),
  getAccommodationApplications
);

router.get(
  "/:id",
  authenticate,
  authorize("GET", "/api/v1/admin/accommodation-applications/:id"),
  getAccommodationApplicationById
);

router.put(
  "/:id/status",
  authenticate,
  authorize("PUT", "/api/v1/admin/accommodation-applications/:id/status"),
  updateApplicationStatus
);

router.post(
  "/:id/comments",
  authenticate,
  authorize("POST", "/api/v1/admin/accommodation-applications/:id/comments"),
  addApplicationComment
);

router.get(
  "/:id/comments",
  authenticate,
  authorize("GET", "/api/v1/admin/accommodation-applications/:id/comments"),
  getApplicationComments
);

export default router;