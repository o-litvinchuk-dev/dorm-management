import { Router } from "express";
import { getServices, createDormApplication } from "../../controllers/serviceController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();

router.get("/", getServices);
router.post("/settlement", authenticate, createDormApplication);

export default router;