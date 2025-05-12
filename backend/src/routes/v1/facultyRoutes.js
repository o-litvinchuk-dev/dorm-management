import express from "express";
import {
  createFaculty,
  getFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
} from "../../controllers/facultyController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

// Публічний маршрут
router.get("/", getFaculties);

// Захищені маршрути (тільки superadmin)
router.post("/", authenticate, authorize("POST", "/api/v1/faculties"), createFaculty);
router.get("/:id", authenticate, authorize("GET", "/api/v1/faculties/:id"), getFacultyById);
router.put("/:id", authenticate, authorize("PUT", "/api/v1/faculties/:id"), updateFaculty);
router.delete("/:id", authenticate, authorize("DELETE", "/api/v1/faculties/:id"), deleteFaculty);

export default router;