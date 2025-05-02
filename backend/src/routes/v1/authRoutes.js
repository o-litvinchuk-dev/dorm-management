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
    validateToken
} from "../../controllers/authController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();

// Маршрути для аутентифікації
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.post("/refresh-token", refreshToken);
router.get("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google-signin", googleSignIn);
router.get("/validate-token", authenticate, validateToken);


export default router;