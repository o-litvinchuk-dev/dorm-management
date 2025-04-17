import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

console.log("Setting up auth routes...");

// Add logging to see if routes are registered
router.post("/login", (req, res, next) => {
    console.log("Login route hit");
    authController.login(req, res, next);
});

router.post("/register", authController.register);
router.post("/verify-2fa", authController.verify2FA);
router.post("/setup-2fa", authController.setup2FA);
router.post("/disable-2fa", authController.disable2FA);
router.post("/refresh-token", authController.refreshToken);

export default router;
