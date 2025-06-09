import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../utils/api";
import { ToastService } from "../utils/toastConfig";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!localStorage.getItem("accessToken")) return;
        try {
            const response = await api.get("/secure/notifications");
            const fetchedNotifications = response.data || [];
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
        } catch (error) {
            console.warn("[UserContext] Failed to fetch notifications:", error.message);
        }
    }, []);

    // Нова функція для позначення як прочитане
    const markNotificationAsRead = useCallback(async (notificationId) => {
        try {
            await api.put(`/secure/notifications/${notificationId}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        } catch (error) {
            console.error("Error marking notification as read in context:", error);
            ToastService.error("Помилка", "Не вдалося оновити статус сповіщення.");
        }
    }, []);

    // Нова функція для видалення
    const deleteNotificationFromContext = useCallback(async (notificationId) => {
        try {
            await api.delete(`/secure/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            // Оновлюємо лічильник, перераховуючи його з нового стану
            setUnreadCount(prev => notifications.filter(n => n.id !== notificationId && !n.read).length);
        } catch (error) {
            console.error("Error deleting notification in context:", error);
            ToastService.error("Помилка", "Не вдалося видалити сповіщення.");
        }
    }, [notifications]);

    // Нова функція для позначення всіх як прочитаних
    const markAllNotificationsAsRead = useCallback(async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;
        try {
            // В ідеалі бекенд повинен мати один ендпоінт для цього, але поки робимо так
            await Promise.all(unreadIds.map(id => api.put(`/secure/notifications/${id}/read`)));
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
            ToastService.error("Помилка", "Не вдалося оновити всі сповіщення.");
        }
    }, [notifications]);

    const refreshUser = useCallback(async () => {
        if (refreshing) return;
        setRefreshing(true);
        setIsLoading(true);
        try { 
            const validateResponse = await api.get("/auth/validate-token");
            const userDataFromToken = validateResponse.data.user;
            const profileResponse = await api.get("/secure/profile");
            const profileData = profileResponse.data;

            const facultyIdValue = profileData.faculty_id || userDataFromToken.faculty_id;
            const dormitoryIdValue = profileData.dormitory_id || userDataFromToken.dormitory_id;

            const updatedUser = {
                id: userDataFromToken.id,
                email: userDataFromToken.email,
                role: userDataFromToken.role,
                name: profileData.name || userDataFromToken.name || "",
                avatar: profileData.avatar || userDataFromToken.avatar || null,
                gender: profileData.gender || userDataFromToken.gender || "not_specified",
                faculty_id: facultyIdValue ? String(facultyIdValue) : null,
                faculty_name: profileData.faculty_name || userDataFromToken.faculty_name || null,
                dormitory_id: dormitoryIdValue ? String(dormitoryIdValue) : null,
                dormitory_name: profileData.dormitory_name || userDataFromToken.dormitory_name || null,
                phone: profileData.phone || userDataFromToken.phone || "",
                course: profileData.course || null,
                group_name: profileData.group_name || null,
                is_profile_complete: profileData.is_profile_complete || false,
                sessionId: userDataFromToken.sessionId,
            };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            await fetchNotifications();
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                logout();
            }
        } finally {
            setRefreshing(false);
            setIsLoading(false);
        }
    }, [refreshing, fetchNotifications]);

    useEffect(() => {
        let intervalId;
        if (user) {
            fetchNotifications();
            intervalId = setInterval(fetchNotifications, 30000);
        }
        return () => clearInterval(intervalId);
    }, [user, fetchNotifications]);
    
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            refreshUser();
        } else {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setNotifications([]);
        setUnreadCount(0);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("sessionId");
        localStorage.removeItem("user");
        ToastService.success("Ви вийшли з системи");
    }, []);

    return (
        <UserContext.Provider value={{ 
            user, setUser, refreshUser, isLoading, refreshing, logout, 
            notifications, unreadCount, fetchNotifications,
            markNotificationAsRead, deleteNotificationFromContext, markAllNotificationsAsRead 
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};