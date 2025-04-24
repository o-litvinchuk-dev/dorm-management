import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import styles from "./styles/SettingsPage.module.css";

const InterfaceSettings = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(localStorage.getItem("language") || "uk");

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);
  }, [theme, language]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    toast.success("Тему оновлено", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    toast.success("Мову оновлено", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  return (
    <div className={styles.settingsSection}>
      <h3 className={styles.sectionTitle}>Інтерфейс</h3>
      <div className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Тема</label>
          <select
            value={theme}
            onChange={handleThemeChange}
            className={styles.selectField}
          >
            <option value="light">Світла</option>
            <option value="dark">Темна</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Мова</label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className={styles.selectField}
          >
            <option value="uk">Українська</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default InterfaceSettings;