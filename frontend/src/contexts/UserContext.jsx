import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../utils/api";
import { ToastService } from "../utils/toastConfig";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Initial isLoading state
    const [refreshing, setRefreshing] = useState(false);

    const refreshUser = useCallback(async () => { // Removed isInitialAttempt parameter
        console.log(`[UserContext] Attempting to refresh user data. Refreshing state: ${refreshing}`);
        if (refreshing) {
            console.log("[UserContext] Refresh already in progress, skipping subsequent call.");
            return;
        }
        setRefreshing(true);
        setIsLoading(true); // Set isLoading to true at the start of any refresh attempt

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
                gender: profileData.gender || userDataFromToken.gender || "not_specified",
                faculty_id: profileData.faculty_id || userDataFromToken.faculty_id || null,
                faculty_name: profileData.faculty_name || userDataFromToken.faculty_name || null,
                dormitory_id: profileData.dormitory_id || userDataFromToken.dormitory_id || null,
                dormitory_name: profileData.dormitory_name || userDataFromToken.dormitory_name || null,
                phone: profileData.phone || null,
                course: profileData.course || null,
                group_name: profileData.group_name || null,
                is_profile_complete: profileData.is_profile_complete || false,
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
            setIsLoading(false); // Always set isLoading to false at the end of the refresh
            console.log("[UserContext] Refresh/loading process finished.");
        }
    }, [refreshing]); // Keep 'refreshing' as a dependency. `setUser` and `setIsLoading` are stable.

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            console.log("[UserContext] useEffect (initial mount): Token found, calling refreshUser.");
            refreshUser(); // Call without 'true'
        } else {
            console.log("[UserContext] useEffect (initial mount): No token found, setting user to null and isLoading to false.");
            setUser(null);
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // `refreshUser` is memoized with `refreshing`, to prevent re-runs due to `refreshUser` itself changing if not memoized properly.

    const logout = useCallback(() => {
        console.log("[UserContext] Logging out user.");
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