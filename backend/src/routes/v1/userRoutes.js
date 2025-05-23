import express from "express";
import {
    assignFacultyDeanOfficeRole,
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
  authorize("PUT", "/api/v1/users/:id/role"),
  updateUserRole
);

router.post(
  "/assign-faculty-dean-office",
  authenticate,
  authorize("POST", "/api/v1/users/assign-faculty-dean-office"),
  assignFacultyDeanOffice
);
router.post(
  "/assign-dorm-manager",
  authenticate,
  authorize("POST", "/api/v1/users/assign-dorm-manager"),
  assignDormManagerRole
);
router.post(
  "/assign-student-council",
  authenticate,
  authorize("POST", "/api/v1/users/assign-student-council"),
  assignStudentCouncilRole
);
router.get("/all", authenticate, authorize("GET", "/api/v1/users/all"), getAllUsers);
router.put("/:id/role", authenticate, authorize("PUT", "/api/v1/users/:id/role"), updateUserRole);

export default router;