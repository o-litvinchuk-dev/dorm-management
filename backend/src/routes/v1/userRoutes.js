import express from "express";
import {
    assignFacultyDeanOffice,
    assignDormManagerRole,
    assignStudentCouncilRole,
    getAllUsers,
    updateUserRole,
} from "../../controllers/userController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

router.get(
  "/all",
  authenticate,
  authorize("GET", "/api/v1/users/all"),
  getAllUsers
);

router.put(
  "/:id/role",
  authenticate,
  authorize("PUT", "/api/v1/users/:id/role"), // This should be a generic permission for admins to change roles
  updateUserRole
);

router.post(
  "/assign-faculty-dean-office",
  authenticate,
  authorize("POST", "/api/v1/users/assign-role"), // Changed to a more generic permission
  assignFacultyDeanOffice
);

router.post(
  "/assign-dorm-manager",
  authenticate,
  authorize("POST", "/api/v1/users/assign-role"), // Changed to a more generic permission
  assignDormManagerRole
);

router.post(
  "/assign-student-council",
  authenticate,
  authorize("POST", "/api/v1/users/assign-role"), // Changed to a more generic permission
  assignStudentCouncilRole
);

export default router;