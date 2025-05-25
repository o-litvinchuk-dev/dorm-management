import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../utils/api";
import { ToastService } from "../utils/toastConfig";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // To prevent multiple concurrent refreshes

  const refreshUser = useCallback(async (isInitialAttempt = false) => {
    console.log(`[UserContext] Attempting to refresh user data. Is initial: ${isInitialAttempt}, Refreshing state: ${refreshing}`);
    if (refreshing && !isInitialAttempt) {
      console.log("[UserContext] Refresh already in progress, skipping subsequent call.");
      return;
    }
    setRefreshing(true);
    if (isInitialAttempt) {
      setIsLoading(true);
    }

    try {
      const validateResponse = await api.get("/auth/validate-token");
      const userDataFromToken = validateResponse.data.user;
      console.log("[UserContext] Token validated successfully. User data from token:", userDataFromToken);

      const profileResponse = await api.get("/secure/profile");
      const profileData = profileResponse.data;
      console.log("[UserContext] Profile data fetched successfully:", profileData);

      const updatedUser = {
        id: userDataFromToken.id,
        email: userDataFromToken.email,
        role: userDataFromToken.role,
        name: profileData.name || userDataFromToken.name || "",
        avatar: profileData.avatar || userDataFromToken.avatar || null,
        // --- FIX IS HERE ---
        // Prioritize gender from profileData as it might be more up-to-date,
        // then from token, then default.
        gender: profileData.gender || userDataFromToken.gender || "not_specified", 
        // --- END OF FIX ---
        faculty_id: profileData.faculty_id || userDataFromToken.faculty_id || null,
        faculty_name: profileData.faculty_name || userDataFromToken.faculty_name || null,
        dormitory_id: profileData.dormitory_id || userDataFromToken.dormitory_id || null,
        dormitory_name: profileData.dormitory_name || userDataFromToken.dormitory_name || null,
        phone: profileData.phone || null, // from user_profiles
        course: profileData.course || null, // from user_profiles
        group_name: profileData.group_name || null, // from user_profiles (via user_profiles table)
        is_profile_complete: profileData.is_profile_complete || false, // from users table, updated by profileUtils
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log("[UserContext] User data refreshed and set in context and localStorage:", updatedUser);
    } catch (error) {
      console.error("[UserContext] Error refreshing user data:", error.response?.data?.error || error.message, error.response?.status);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("[UserContext] Auth error (401/403) during refresh, clearing user session.");
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    } finally {
      setRefreshing(false);
      setIsLoading(false);
      console.log("[UserContext] Refresh/loading process finished.");
    }
  }, [refreshing]); // Added refreshing to dependency array

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      console.log("[UserContext] useEffect (initial mount): Token found, calling refreshUser.");
      refreshUser(true); 
    } else {
      console.log("[UserContext] useEffect (initial mount): No token found, setting user to null and isLoading to false.");
      setUser(null);
      setIsLoading(false);
    }
  }, []); // Removed refreshUser from here to avoid loop if it causes re-render

  const logout = useCallback(() => {
    console.log("[UserContext] Logging out user.");
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    ToastService.success("Ви вийшли з системи");
    // No navigate here, let components handle navigation after logout
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