import { Router } from "express";
import { getPublicProfile } from "../../controllers/publicProfileController.js"; // New controller

const router = Router();

// Public profile endpoint
router.get("/users/:userId/profile", getPublicProfile);

export default router;