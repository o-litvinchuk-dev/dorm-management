import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../utils/api";
import { ToastService } from "../utils/toastConfig";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshUser = useCallback(async () => {
    setRefreshing(true);
    try {
      // Validate token and get basic user data
      const validateResponse = await api.get("/auth/validate-token");
      const userData = validateResponse.data.user;

      // Get full profile
      const profileResponse = await api.get("/secure/profile");
      const profileData = profileResponse.data;

      // Construct user object with all required fields
      const updatedUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.name || profileData.name || "",
        avatar: userData.avatar || profileData.avatar || null,
        faculty_id: userData.faculty_id || profileData.faculty_id || null,
        faculty_name: userData.faculty_name || profileData.faculty_name || null,
        dormitory_id: userData.dormitory_id || profileData.dormitory_id || null,
        dormitory_name: userData.dormitory_name || profileData.dormitory_name || null,
        phone: profileData.phone || null,
        course: profileData.course || null,
        group_name: profileData.group_name || null,
        is_profile_complete: profileData.is_profile_complete || false,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Помилка валідації токена:", error);
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      ToastService.error("Сесія недійсна", "Будь ласка, увійдіть знову");
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      refreshUser();
    } else if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    ToastService.success("Ви вийшли з системи");
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, isLoading, refreshing, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};