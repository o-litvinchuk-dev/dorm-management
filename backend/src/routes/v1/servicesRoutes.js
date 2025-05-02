import { Router } from "express";
import { getServices, createDormApplication } from "../../controllers/serviceController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = Router();

router.get("/", getServices);
router.post("/settlement", authenticate, authorize("POST", "/api/v1/services/settlement"), createDormApplication);

export default router;