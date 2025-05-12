import express from "express";
import {
  createFacultyDormitory,
  getFacultyDormitories,
  updateFacultyDormitory,
  deleteFacultyDormitory,
} from "../../controllers/facultyDormitoryController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

// Захищені маршрути (тільки superadmin)
router.get("/", authenticate, authorize("GET", "/api/v1/faculty-dormitories"), getFacultyDormitories);
router.post("/", authenticate, authorize("POST", "/api/v1/faculty-dormitories"), createFacultyDormitory);
router.put("/:faculty_id/:dormitory_id", authenticate, authorize("PUT", "/api/v1/faculty-dormitories/:faculty_id/:dormitory_id"), updateFacultyDormitory);
router.delete("/:faculty_id/:dormitory_id", authenticate, authorize("DELETE", "/api/v1/faculty-dormitories/:faculty_id/:dormitory_id"), deleteFacultyDormitory);

export default router;