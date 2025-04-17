import { Router } from "express";
import {
    register,
    verifyEmail,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    googleSignIn,
} from "../../controllers/authController.js";
import { authenticate } from "../../middlewares/auth.js"

const router = Router();

// Маршрути для аутентифікації
router.post("/register", register);
router.post("/login", login); // Тепер login доступний
router.post("/logout", authenticate, logout);
router.post("/refresh-token", refreshToken);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google-signin", googleSignIn);

export default router;
