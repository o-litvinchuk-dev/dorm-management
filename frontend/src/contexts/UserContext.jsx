// src/contexts/UserContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../utils/api";
import { ToastService } from "../utils/toastConfig";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshUser = useCallback(async () => {
    console.log(`[UserContext] Attempting to refresh user data. Refreshing state: ${refreshing}`);
    if (refreshing) {
      console.log("[UserContext] Refresh already in progress, skipping subsequent call.");
      return;
    }
    setRefreshing(true);
    setIsLoading(true);
    try {
      // validate-token повертає sessionId в user об'єкті
      const validateResponse = await api.get("/auth/validate-token");
      const userDataFromToken = validateResponse.data.user;
      console.log("[UserContext] Token validated successfully. User data from token:", userDataFromToken);
      
      // Профіль може бути потрібен для оновлення полів, які не в JWT
      const profileResponse = await api.get("/secure/profile");
      const profileData = profileResponse.data;
      console.log("[UserContext] Profile data fetched successfully:", profileData);

      const updatedUser = {
        id: userDataFromToken.id,
        email: userDataFromToken.email,
        role: userDataFromToken.role,
        name: profileData.name || userDataFromToken.name || "",
        avatar: profileData.avatar || userDataFromToken.avatar || null,
        gender: profileData.gender || userDataFromToken.gender || "not_specified",
        faculty_id: profileData.faculty_id || userDataFromToken.faculty_id || null,
        faculty_name: profileData.faculty_name || userDataFromToken.faculty_name || null,
        dormitory_id: profileData.dormitory_id || userDataFromToken.dormitory_id || null,
        dormitory_name: profileData.dormitory_name || userDataFromToken.dormitory_name || null,
        phone: profileData.phone || null,
        course: profileData.course || null,
        group_name: profileData.group_name || null,
        is_profile_complete: profileData.is_profile_complete || false,
        sessionId: userDataFromToken.sessionId, // Зберігаємо sessionId
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Оновлюємо localStorage
      console.log("[UserContext] User data refreshed and set in context and localStorage:", updatedUser);
    } catch (error) {
      console.error("[UserContext] Error refreshing user data:", error.response?.data?.error || error.message, error.response?.status);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("[UserContext] Auth error (401/403) during refresh, clearing user session.");
        ToastService.sessionExpired(); // Нове повідомлення
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("sessionId"); // Очищаємо sessionId
        localStorage.removeItem("user");
      }
    } finally {
      setRefreshing(false);
      setIsLoading(false);
      console.log("[UserContext] Refresh/loading process finished.");
    }
  }, [refreshing]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    const sessionId = localStorage.getItem("sessionId");

    if (token && storedUser && sessionId) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Якщо збережений користувач і sessionId збігаються, можна тимчасово встановити його,
        // а потім оновити через refreshUser. Це зменшує "блимання" інтерфейсу.
        if (parsedUser.sessionId === sessionId) {
            setUser(parsedUser);
            setIsLoading(true); // Все ще завантажуємо для перевірки актуальності
            refreshUser();
        } else {
            console.log("[UserContext] SessionId mismatch in localStorage, forcing full refresh and clearing data.");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("sessionId");
            localStorage.removeItem("user");
            setUser(null);
            setIsLoading(false);
        }
      } catch (e) {
          console.error("[UserContext] Failed to parse stored user or sessionId, clearing data.", e);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("sessionId");
          localStorage.removeItem("user");
          setUser(null);
          setIsLoading(false);
      }
    } else {
      console.log("[UserContext] useEffect (initial mount): No token or stored user/session, setting user to null and isLoading to false.");
      setUser(null);
      setIsLoading(false);
    }
  }, []); // Залежності прибрані для одноразового запуску на маунті

  const logout = useCallback(() => {
    console.log("[UserContext] Logging out user.");
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("sessionId"); // Очищаємо sessionId
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