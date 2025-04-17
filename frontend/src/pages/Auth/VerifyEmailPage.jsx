import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      // Витягуємо токен із параметрів URL
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (!token) {
        console.warn("[VerifyEmailPage] Токен відсутній");
        ToastService.error("Токен відсутній");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      try {
        console.log("[VerifyEmailPage] Відправка запиту для підтвердження email:", { token });
        const response = await api.get(`/auth/verify-email?token=${token}`);
        console.log("[VerifyEmailPage] Email успішно підтверджено:", response.data);
        ToastService.success("Email успішно підтверджено", "Ви можете увійти в систему");
        setTimeout(() => navigate("/login?verified=success"), 3000);
      } catch (error) {
        console.error("[VerifyEmailPage] Помилка підтвердження email:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error || "Не вдалося підтвердити email";
        ToastService.error(errorMessage);
        setTimeout(() => navigate("/login?error=verification_failed"), 3000);
      }
    };

    verifyEmail();
  }, [location, navigate]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>Підтвердження email</h2>
      <p>Зачекайте, ми перевіряємо ваш email...</p>
    </div>
  );
};

export default VerifyEmailPage;