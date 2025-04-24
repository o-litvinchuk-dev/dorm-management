import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { toast } from "react-toastify";
import styles from "./styles/SettingsPage.module.css";

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: false,
    appNotifications: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/settings/notifications");
        setSettings(response.data);
      } catch (error) {
        toast.error("Не вдалося завантажити налаштування сповіщень", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (setting) => {
    const newValue = !settings[setting];
    try {
      await api.put("/settings/notifications", { [setting]: newValue });
      setSettings({ ...settings, [setting]: newValue });
      toast.success("Налаштування оновлено", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      toast.error("Не вдалося оновити налаштування", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className={styles.settingsSection}>
      <h3 className={styles.sectionTitle}>Сповіщення</h3>
      <div className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggle("emailNotifications")}
              className={styles.checkbox}
            />
            Email сповіщення
          </label>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.appNotifications}
              onChange={() => handleToggle("appNotifications")}
              className={styles.checkbox}
            />
            Сповіщення в додатку
          </label>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;