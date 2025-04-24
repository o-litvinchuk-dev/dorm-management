import React, { useState } from "react";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import styles from "./styles/SettingsPage.module.css";

const SecuritySettings = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Паролі не співпадають", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Пароль має бути не коротше 8 символів", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    try {
      await api.post("/auth/reset-password", {
        password: passwordData.newPassword,
      });
      toast.success("Пароль успішно змінено", {
        position: "top-right",
        autoClose: 3000,
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error("Не вдалося змінити пароль", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className={styles.settingsSection}>
      <h3 className={styles.sectionTitle}>Безпека</h3>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Поточний пароль</label>
          <input
            type={showPassword.current ? "text" : "password"}
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handleChange}
            className={styles.inputField}
            placeholder="Введіть поточний пароль"
          />
          <span
            className={styles.passwordToggle}
            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
          >
            {showPassword.current ? (
              <EyeSlashIcon className={styles.toggleIcon} />
            ) : (
              <EyeIcon className={styles.toggleIcon} />
            )}
          </span>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Новий пароль</label>
          <input
            type={showPassword.new ? "text" : "password"}
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handleChange}
            className={styles.inputField}
            placeholder="Введіть новий пароль"
          />
          <span
            className={styles.passwordToggle}
            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
          >
            {showPassword.new ? (
              <EyeSlashIcon className={styles.toggleIcon} />
            ) : (
              <EyeIcon className={styles.toggleIcon} />
            )}
          </span>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Підтвердження нового пароля</label>
          <input
            type={showPassword.confirm ? "text" : "password"}
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handleChange}
            className={styles.inputField}
            placeholder="Підтвердьте новий пароль"
          />
          <span
            className={styles.passwordToggle}
            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
          >
            {showPassword.confirm ? (
              <EyeSlashIcon className={styles.toggleIcon} />
            ) : (
              <EyeIcon className={styles.toggleIcon} />
            )}
          </span>
        </div>
        <button type="submit" className={styles.submitButton}>
          Змінити пароль
        </button>
      </form>
    </div>
  );
};

export default SecuritySettings;