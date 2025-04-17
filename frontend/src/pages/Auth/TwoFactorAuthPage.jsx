import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "../../components/Auth/LoginForm/LoginForm.module.css";
import { useUser } from "../../contexts/UserContext";

const TwoFactorAuthPage = () => {
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { forceRefresh } = useUser();
  const { email, password, rememberDevice = false } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      console.warn("[2FAPage] Код не введено");
      ToastService.validationError("Введіть код");
      return;
    }

    console.log("[2FAPage] Початок перевірки 2FA:", { email, useBackupCode, rememberDevice });

    try {
      setIsLoading(true);
      const payload = {
        email,
        password,
        twoFactorCode: useBackupCode ? undefined : code,
        backupCode: useBackupCode ? code : undefined,
        rememberDevice,
      };
      console.log("[2FAPage] Відправка запиту:", payload);

      const response = await api.post("/auth/verify-2fa", payload, { _noAuth: true });

      console.log("[2FAPage] Успішна перевірка 2FA:", response.data);

      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("sessionId", response.data.sessionId);
      if (response.data.deviceId) {
        localStorage.setItem("deviceId", response.data.deviceId);
      }
      forceRefresh();
      ToastService.success("Вітаємо!", "Ви успішно авторизувалися");
      navigate("/dashboard");
    } catch (error) {
      console.error("[2FAPage] Помилка перевірки 2FA:", error.response?.data || error.message);
      if (error.response?.data?.code === "INVALID_2FA_CODE") {
        ToastService.invalid2FACode();
      } else if (error.response?.data?.code === "INVALID_BACKUP_CODE") {
        ToastService.invalidBackupCode();
      } else if (error.response?.data?.code === "USER_NOT_FOUND") {
        ToastService.invalidEmail();
      } else if (!error.response) {
        ToastService.networkError();
      } else {
        ToastService.handleApiError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !password) {
    console.warn("[2FAPage] Відсутні email або password, перенаправлення на login");
    ToastService.error("Помилка", "Недостатньо даних для 2FA");
    navigate("/login");
    return null;
  }

  return (
    <div className={styles.formContainer}>
      <h2>Двофакторна автентифікація</h2>
      <p>Введіть код із вашого додатка аутентифікації або резервний код для {email}</p>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            {useBackupCode ? "Резервний код" : "Код 2FA"}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            className={styles.inputField}
            placeholder={useBackupCode ? "Введіть резервний код" : "Введіть код 2FA"}
            disabled={isLoading}
          />
        </div>
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            checked={useBackupCode}
            onChange={() => setUseBackupCode(!useBackupCode)}
            id="useBackupCode"
            disabled={isLoading}
          />
          <label htmlFor="useBackupCode">Використати резервний код</label>
        </div>
        <button type="submit" className={styles.loginButton} disabled={isLoading}>
          {isLoading ? "Перевірка..." : "Підтвердити"}
        </button>
      </form>
      <button
        type="button"
        className={styles.forgotPassword}
        onClick={() => navigate("/login")}
        disabled={isLoading}
      >
        Повернутися до входу
      </button>
    </div>
  );
};

export default TwoFactorAuthPage;