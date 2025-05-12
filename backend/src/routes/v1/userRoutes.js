import express from "express";
import {
    assignFacultyDeanOfficeRole,
    assignDormManagerRole,
    assignStudentCouncilRole,
} from "../../controllers/userController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

router.post(
    "/assign-faculty-dean-office",
    authenticate,
    authorize("POST", "/api/v1/users/assign-faculty-dean-office"),
    assignFacultyDeanOfficeRole
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

export default router;