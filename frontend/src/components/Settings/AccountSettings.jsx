import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { toast } from "react-toastify";
import styles from "./styles/SettingsPage.module.css";

const AccountSettings = () => {
  const [userData, setUserData] = useState({ name: "", email: "", avatar: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/secure/profile");
        setUserData({
          name: response.data.name || "",
          email: response.data.email || "",
          avatar: response.data.avatar || "",
        });
      } catch (error) {
        toast.error("Не вдалося завантажити дані користувача", {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUserData({ ...userData, avatar: url });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(userData.email)) {
      toast.error("Невірний формат email", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    try {
      await api.patch("/secure/profile", userData);
      toast.success("Дані успішно оновлено", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      toast.error("Не вдалося оновити дані", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  if (isLoading) return <div className={styles.spinner}></div>;

  return (
    <div className={styles.settingsSection}>
      <h3 className={styles.sectionTitle}>Обліковий запис</h3>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Ім'я</label>
          <input
            type="text"
            name="name"
            value={userData.name}
            onChange={handleChange}
            className={styles.inputField}
            placeholder="Введіть ім'я"
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Email</label>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            className={styles.inputField}
            placeholder="Введіть email"
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Аватар</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className={styles.inputField}
          />
          {userData.avatar && (
            <img src={userData.avatar} alt="Avatar" className={styles.avatarPreview} />
          )}
        </div>
        <button type="submit" className={styles.submitButton}>
          Зберегти
        </button>
      </form>
    </div>
  );
};

export default AccountSettings;