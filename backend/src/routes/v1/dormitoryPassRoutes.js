import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { getMyPass, verifyPassPublic, revokePassAdmin } from "../../controllers/dormitoryPassController.js";

const router = express.Router();

router.get(
    "/secure/my-pass",
    authenticate,
    authorize("GET", "/api/v1/secure/my-pass"),
    getMyPass
);

// Public route - no 'authenticate' or 'authorize'
router.get("/passes/public-verify/:passIdentifier", verifyPassPublic);

router.put(
    "/admin/passes/:passId/revoke",
    authenticate,
    authorize("PUT", "/api/v1/admin/passes/:passId/revoke"), // Add to rbac_policy
    revokePassAdmin
);


export default router;