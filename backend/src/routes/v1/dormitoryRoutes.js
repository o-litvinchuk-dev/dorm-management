import { Router } from "express";
import {
  createDormitory,
  getDormitories,
  getDormitoryById,
  updateDormitory,
  deleteDormitory,
} from "../../controllers/DormitoryController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = Router();

router.get(
  "/dormitories", // Ресурс: /api/v1/dormitories
  authenticate,
  authorize("GET", "/api/v1/dormitories"),
  getDormitories
);

router.get(
  "/dormitories/:id", // Ресурс: /api/v1/dormitories/:id
  authenticate,
  authorize("GET", "/api/v1/dormitories/:id"), // <--- Перевірте, що тут правильний ресурс
  getDormitoryById
);

router.post(
  "/dormitories",
  authenticate,
  authorize("POST", "/api/v1/dormitories"),
  createDormitory
);

router.put(
  "/dormitories/:id",
  authenticate,
  authorize("PUT", "/api/v1/dormitories/:id"),
  updateDormitory
);

router.delete(
  "/dormitories/:id",
  authenticate,
  authorize("DELETE", "/api/v1/dormitories/:id"),
  deleteDormitory
);

export default router;