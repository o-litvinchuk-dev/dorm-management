import React, { useState, useEffect } from "react";
import axios from "axios";
import { PencilIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import instagramIcon from "../../images/instagram-icon.svg";
import telegramIcon from "../../images/telegram-icon.svg";
import styles from "./UserProfile.module.css";

// Визначаємо URL бекенду як константу (для Vite використовуємо import.meta.env)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const UserProfile = ({ initialUserData }) => {
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState(initialUserData || {});
  const [formData, setFormData] = useState({
    name: userData.name || "",
    email: userData.email || "",
    birthday: userData.birthday || "",
    phone: userData.phone || "",
    about_me: userData.about_me || "",
    interests: userData.interests || "",
    dormitory: userData.dormitory || "",
    room: userData.room || "",
    instagram: userData.instagram || "",
    telegram: userData.telegram || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Функція оновлення токена
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("Токен оновлення відсутній");

      const response = await axios.post(`${BACKEND_URL}/api/v1/auth/refresh-token`, {
        refreshToken,
      });

      const newAccessToken = response.data.accessToken;
      localStorage.setItem("accessToken", newAccessToken);
      return newAccessToken;
    } catch (err) {
      console.error("Помилка оновлення токена:", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login"; // Перенаправлення на сторінку входу при невдачі
      throw err;
    }
  };

  // Екземпляр Axios з інтерцепторами для оновлення токена
  const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      return Promise.reject(error);
    }
  );

  // Завантаження профілю при монтуванні
  useEffect(() => {
    fetchProfile();
  }, []);

  // Отримання профілю користувача
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/v1/secure/profile");
      setUserData(response.data);
      setFormData({
        name: response.data.name || "",
        email: response.data.email || "",
        birthday: response.data.birthday || "",
        phone: response.data.phone || "",
        about_me: response.data.about_me || "",
        interests: response.data.interests || "",
        dormitory: response.data.dormitory || "",
        room: response.data.room || "",
        instagram: response.data.instagram?.replace("https://instagram.com/", "") || "",
        telegram: response.data.telegram?.replace("https://t.me/", "") || ""
      });
    } catch (err) {
      setError("Не вдалося завантажити профіль");
      console.error("Помилка завантаження профілю:", err);
    } finally {
      setLoading(false);
    }
  };

  // Обробка змін у формі
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Обробка відправлення форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Формуємо дані для відправки, конвертуючи порожні рядки в null
    const payload = {
      birthday: formData.birthday || null,
      phone: formData.phone || null,
      aboutMe: formData.about_me || null,
      interests: formData.interests || null,
      room: formData.room || null,
      dormitory: formData.dormitory || null,
      instagram: formData.instagram ? `https://instagram.com/${formData.instagram.replace(/^@/, "")}` : null,
      telegram: formData.telegram ? `https://t.me/${formData.telegram.replace(/^@/, "")}` : null,
    };

    try {
      const response = await axiosInstance.patch("/api/v1/secure/profile", payload);
      setUserData({ ...userData, ...formData });
      setEditMode(false);
      setSuccessMessage("Профіль успішно оновлено");
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Помилка при оновленні профілю";
      setError(errorMessage);
      console.error("Помилка оновлення профілю:", err);
    } finally {
      setLoading(false);
    }
  };

  // Обробка скасування редагування
  const handleCancel = () => {
    setFormData({
      name: userData.name || "",
      email: userData.email || "",
      birthday: userData.birthday || "",
      phone: userData.phone || "",
      about_me: userData.about_me || "",
      interests: userData.interests || "",
      dormitory: userData.dormitory || "",
      room: userData.room || "",
      instagram: userData.instagram?.replace("https://instagram.com/", "") || "",
      telegram: userData.telegram?.replace("https://t.me/", "") || ""
    });
    setEditMode(false);
    setError(null);
  };

  if (loading && !userData.email) {
    return <div className={styles.loading}>Завантаження...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}></div>

      <div className={styles.profileBody}>
        <div className={styles.profileContent}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          {successMessage && (
            <div className={styles.successMessage}>{successMessage}</div>
          )}

          <div className={styles.profileTopSection}>
            <div className={styles.mainInfo}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>
                  {userData.avatar && (
                    <img src={userData.avatar} alt="Avatar" />
                  )}
                </div>
                <div className={styles.socialLinks}>
                  {formData.instagram && (
                    <a
                      href={
                        formData.instagram.startsWith("http")
                          ? formData.instagram
                          : `https://instagram.com/${formData.instagram.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={instagramIcon}
                        alt="Instagram"
                        className={styles.socialIcon}
                      />
                    </a>
                  )}
                  {formData.telegram && (
                    <a
                      href={
                        formData.telegram.startsWith("http")
                          ? formData.telegram
                          : `https://t.me/${formData.telegram.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={telegramIcon}
                        alt="Telegram"
                        className={styles.socialIcon}
                      />
                    </a>
                  )}
                </div>
              </div>

              <div className={styles.userInfo}>
                {editMode ? (
                  <input
                    className={styles.nameInput}
                    value={formData.name}
                    onChange={handleChange}
                    name="name"
                    disabled
                  />
                ) : (
                  <h1 className={styles.userName}>{formData.name}</h1>
                )}
                <p className={styles.userEmail}>{formData.email}</p>
                <span className={styles.userStatus}>
                  {userData.role || "Студент"}
                </span>
              </div>
            </div>

            <button
              className={styles.editButton}
              onClick={() => (editMode ? handleCancel() : setEditMode(true))}
              disabled={loading}
            >
              {editMode ? (
                <XMarkIcon className={styles.editIcon} />
              ) : (
                <PencilIcon className={styles.editIcon} />
              )}
              {editMode ? "Скасувати" : "Редагувати"}
            </button>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoSection}>
              <h3>Про себе</h3>
              {editMode ? (
                <textarea
                  className={styles.textarea}
                  value={formData.about_me}
                  onChange={handleChange}
                  name="about_me"
                  maxLength={1000}
                />
              ) : (
                <p>{formData.about_me || "Інформація відсутня"}</p>
              )}
            </div>

            <div className={styles.infoSection}>
              <h3>Інтереси</h3>
              {editMode ? (
                <input
                  className={styles.inputField}
                  value={formData.interests}
                  onChange={handleChange}
                  name="interests"
                  maxLength={255}
                />
              ) : (
                <p>{formData.interests || "Інтереси не вказані"}</p>
              )}
            </div>

            <div className={styles.infoSection}>
              <h3>Контактна інформація</h3>
              <div className={styles.detailsGrid}>
                <div>
                  <label>Телефон:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.phone}
                      onChange={handleChange}
                      name="phone"
                      placeholder="+380xxxxxxxxx"
                      pattern="\+380[0-9]{9}"
                    />
                  ) : (
                    <span>{formData.phone || "Не вказано"}</span>
                  )}
                </div>
                <div>
                  <label>Дата народження:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      type="date"
                      value={formData.birthday}
                      onChange={handleChange}
                      name="birthday"
                      max={new Date().toISOString().split("T")[0]}
                    />
                  ) : (
                    <span>{formData.birthday || "Не вказано"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h3>Поселення</h3>
              <div className={styles.detailsGrid}>
                <div>
                  <label>Гуртожиток:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.dormitory}
                      onChange={handleChange}
                      name="dormitory"
                      maxLength={50}
                    />
                  ) : (
                    <span>{formData.dormitory || "Не вказано"}</span>
                  )}
                </div>
                <div>
                  <label>Кімната:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.room}
                      onChange={handleChange}
                      name="room"
                      maxLength={10}
                    />
                  ) : (
                    <span>{formData.room || "Не вказано"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h3>Соціальні мережі</h3>
              <div className={styles.detailsGrid}>
                <div>
                  <label>Instagram:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.instagram}
                      onChange={handleChange}
                      name="instagram"
                      placeholder="username"
                    />
                  ) : (
                    <span>{formData.instagram || "Не вказано"}</span>
                  )}
                </div>
                <div>
                  <label>Telegram:</label>
                  {editMode ? (
                    <input
                      className={styles.inputField}
                      value={formData.telegram}
                      onChange={handleChange}
                      name="telegram"
                      placeholder="@username"
                    />
                  ) : (
                    <span>{formData.telegram || "Не вказано"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {editMode && (
            <button
              className={styles.saveButton}
              onClick={handleSubmit}
              disabled={loading}
            >
              <CheckIcon className={styles.checkIcon} />
              {loading ? "Зберігання..." : "Зберегти зміни"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;