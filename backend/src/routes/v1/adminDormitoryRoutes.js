import express from "express";
import {
  createDormitory,
  getDormitories,
  getDormitoryById,
  updateDormitory,
  deleteDormitory,
} from "../../controllers/DormitoryController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("POST", "/api/v1/admin/dormitories"),
  createDormitory
);
router.get(
  "/",
  authenticate,
  authorize("GET", "/api/v1/admin/dormitories"),
  getDormitories
);
router.get(
  "/:id",
  authenticate,
  authorize("GET", "/api/v1/admin/dormitories/:id"),
  getDormitoryById
);
router.put(
  "/:id",
  authenticate,
  authorize("PUT", "/api/v1/admin/dormitories/:id"),
  updateDormitory
);
router.delete(
  "/:id",
  authenticate,
  authorize("DELETE", "/api/v1/admin/dormitories/:id"),
  deleteDormitory
);

export default router;