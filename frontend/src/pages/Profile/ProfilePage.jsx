// src/pages/Profile/ProfilePage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../utils/api";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import MyProfileForm from "../../components/Profile/MyProfileForm";
import styles from "./styles/ProfilePage.module.css";
import { useUser } from "../../contexts/UserContext";
import { ToastService } from "../../utils/toastConfig";

const ProfilePage = () => {
  const { user: currentUserContext, refreshUser, isLoading: isUserContextLoading } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/secure/profile');
      setProfileData(data);
    } catch (err) {
      console.error("[ProfilePage] Error fetching profile:", err);
      const errorMessage = err.response?.data?.error || 'Невідома помилка.';
      const errorCode = err.response?.data?.code;

      if (err.response?.status === 401 || err.response?.status === 403) {
        if (errorCode === "PROFILE_INCOMPLETE_FACULTY" || errorCode === "DORMITORY_NOT_ASSIGNED") {
          setError(errorMessage || 'Профіль не повністю заповнений для вашої ролі.');
          ToastService.warning("Профіль не заповнений", errorMessage || 'Будь ласка, заповніть усі обов\'язкові поля.');
          if (location.pathname !== "/complete-profile") {
            navigate("/complete-profile", { state: { from: location }, replace: true });
            return;
          }
        } else {
          setError(errorMessage || 'Помилка авторизації. Будь ласка, увійдіть знову.');
          ToastService.sessionExpired();
          setTimeout(() => navigate("/login", { replace: true }), 1000);
          return;
        }
      } else {
        setError(errorMessage || 'Не вдалося завантажити профіль. Спробуйте пізніше.');
        ToastService.error("Помилка завантаження профілю", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, location]);

  const handleUpdate = useCallback(async (formData, newAvatarFile, newBannerFile) => {
    setLoading(true);
    setError('');
    try {
      const formPayload = new FormData();
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== undefined) {
           formPayload.append(key, value);
        }
      });
      
      // Append files if they exist
      if (newAvatarFile) {
        formPayload.append('avatar', newAvatarFile, 'avatar.png');
      }
      if (newBannerFile) {
        formPayload.append('banner', newBannerFile, 'banner.png');
      }
      
      // Using PATCH for profile updates, as we're not replacing the entire resource
      await api.patch('/secure/profile', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await refreshUser();
      await fetchProfile(); 
      ToastService.success("Профіль успішно оновлено!");
      return true; 
    } catch (err) {
      console.error("[ProfilePage] Error updating profile:", err);
      const errorMessage = err.response?.data?.error || 'Невідома помилка.';
      setError(errorMessage || 'Помилка при оновленні профілю. Перевірте введені дані.');
      ToastService.error("Помилка оновлення профілю", errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUser, fetchProfile]);

  useEffect(() => {
    if (!isUserContextLoading && currentUserContext) {
      fetchProfile();
    } else if (!isUserContextLoading && !currentUserContext) {
      navigate("/login", { replace: true });
    }
  }, [currentUserContext, isUserContextLoading, fetchProfile, navigate]);

  const isLoadingOverall = isUserContextLoading || (loading && !profileData);

  if (isLoadingOverall) {
    return (
      <div className={styles.layout}>
        <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
        <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
          <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} />
          <div className={styles.loadingContainer}>
             <div className={styles.spinner}></div>
             <span>Завантаження профілю...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUserContext) {
    return null;
  }

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} />
        <div className={styles.pageContainer}>
          {error && <p className={styles.errorMessage}>{error}</p>}
          {profileData ? (
            <MyProfileForm
              initialUserData={profileData}
              onUpdate={handleUpdate}
              loading={loading}
            />
          ) : !error && (
            <div className={styles.loadingContainer}>
              <span>Профіль не знайдено.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;