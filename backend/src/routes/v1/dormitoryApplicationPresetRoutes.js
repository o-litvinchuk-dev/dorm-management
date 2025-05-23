import express from "express";
import {
    createPreset,
    getPresetForDormitory,
    getAllPresets,
    getPresetById,
    updatePreset,
    deletePreset,
} from "../../controllers/dormitoryApplicationPresetController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

// For Dean/Admin to create and manage presets
// Base path is /api/v1/application-presets
router.post("/", authenticate, authorize("POST", "/api/v1/application-presets"), createPreset);
router.get("/", authenticate, authorize("GET", "/api/v1/application-presets"), getAllPresets);
router.get("/:id", authenticate, authorize("GET", "/api/v1/application-presets/:id"), getPresetById);
router.put("/:id", authenticate, authorize("PUT", "/api/v1/application-presets/:id"), updatePreset);
router.delete("/:id", authenticate, authorize("DELETE", "/api/v1/application-presets/:id"), deletePreset);

// For Student to fetch a preset for a specific dormitory
// Path will be /api/v1/application-presets/dormitory/:dormitoryId
router.get("/dormitory/:dormitoryId", authenticate, authorize("GET", "/api/v1/application-presets/dormitory/:dormitoryId"), getPresetForDormitory);

export default router;