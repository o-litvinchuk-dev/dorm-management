import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import UserProfile from "../../components/Profile/UserProfile";
import styles from "./styles/ProfilePage.module.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const navigate = useNavigate();

  // Функція для отримання даних профілю з сервера
  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/secure/profile');
      setUser(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Функція для оновлення даних профілю
  const handleUpdate = async (formData) => {
    try {
      await api.patch('/secure/profile', formData);
      await fetchProfile(); // Оновлюємо дані після успішного PATCH-запиту
    } catch (err) {
      handleError(err);
      throw err; // Перекидаємо помилку для обробки в компоненті UserProfile
    }
  };

  // Обробка помилок
  const handleError = (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken'); // Видаляємо токен при неавторизованому доступі
      navigate('/login'); // Перенаправляємо на сторінку входу
    } else {
      setError(err.response?.data?.error || 'Помилка сервера'); // Відображаємо повідомлення про помилку
    }
  };

  // Завантажуємо профіль при монтуванні компонента
  useEffect(() => {
    fetchProfile();
  }, []);

  // Відображаємо завантаження, якщо дані ще не отримані
  if (loading) return <div className={styles.loading}>Завантаження...</div>;

  // Основний рендер сторінки
  return (
    <div className={styles.profileLayout}>
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        onToggle={setIsSidebarExpanded} 
      />
      <div className={`${styles.mainContent} ${
        !isSidebarExpanded ? styles.sidebarCollapsed : ""
      }`}>
        <Navbar 
          user={user} 
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} 
        />
        <div className={styles.profileContainer}>
          {error && <p className={styles.errorMessage}>{error}</p>}
          <div className={styles.profileContent}>
            {user && <UserProfile userData={user} onUpdate={handleUpdate} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;