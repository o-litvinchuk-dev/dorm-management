import express from "express";
import {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
} from "../../controllers/GroupController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

router.post(
  "/faculties/:facultyId/groups",
  authenticate,
  authorize("POST", "/api/v1/faculties/:facultyId/groups"),
  createGroup
);
router.get(
  "/faculties/:facultyId/groups",
  authenticate,
  authorize("GET", "/api/v1/faculties/:facultyId/groups"),
  getGroups
);
router.put(
  "/groups/:id",
  authenticate,
  authorize("PUT", "/api/v1/groups/:id"),
  updateGroup
);
router.delete(
  "/groups/:id",
  authenticate,
  authorize("DELETE", "/api/v1/groups/:id"),
  deleteGroup
);

export default router;