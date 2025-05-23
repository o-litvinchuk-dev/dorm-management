import React, { useEffect, useState } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import styles from "./styles/Dashboard.module.css";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                console.log("[Dashboard] Access token:", token ? "Присутній" : "Відсутній");
                if (!token) {
                    console.log("[Dashboard] Токен відсутній, перенаправлення на логін");
                    navigate("/login");
                    return;
                }

                const { data } = await api.get("/secure/dashboard");
                console.log("[Dashboard] Дані отримані:", data);
                setDashboardData(data);
                setIsLoading(false);
            } catch (error) {
                console.error("[Dashboard] Помилка отримання даних:", error.response?.data || error.message);
                const errorCode = error.response?.data?.code; 
                const errorStatus = error.response?.status; 

                if (errorStatus === 403 && (errorCode === "PROFILE_INCOMPLETE_FACULTY" || errorCode === "FACULTY_NAME_MISSING_ON_COMPLETE_PROFILE")) { 
                    console.log(`[Dashboard] Profile/Faculty data issue (${errorCode}). AuthRequiredRoute should handle redirection or display an appropriate message.`); 
                    // The AuthRequiredRoute should redirect to /complete-profile.
                    // If this page renders before redirect, or user navigates here manually,
                    // we avoid logging out. Let AuthRequiredRoute handle it or show specific error.
                    setIsLoading(false); 
                } else if (errorStatus === 401) { 
                    // This path should ideally be handled by the API interceptor's refresh logic.
                    // If it still reaches here, it means refresh failed or it's a direct 401 not caught by interceptor for some reason.
                    console.log("[Dashboard] 401 Unauthorized error, likely session expired. Performing logout.");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user"); 
                    navigate("/login");
                } else if (errorStatus === 403) { 
                    // For other 403 errors not related to profile completion
                    console.log("[Dashboard] Unhandled 403 error. Logging out as a precaution.");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user"); 
                    navigate("/login");
                } else {
                    // For other errors (e.g., 500, network errors if not caught by interceptor)
                    setIsLoading(false);
                }
            }
        };
        fetchDashboardData();
    }, [navigate]);

    const handleSidebarToggle = (state) => {
        setIsSidebarExpanded(state);
    };

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar
                onToggle={handleSidebarToggle}
                isExpanded={isSidebarExpanded}
                isMobile={isMobile}
            />
            <div
                className={`${styles.mainContent} ${
                    !isSidebarExpanded ? styles.sidebarCollapsed : ""
                }`}
            >
                <Navbar
                    user={dashboardData}
                    isSidebarExpanded={isSidebarExpanded}
                    onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
                />
                <div className={styles.dashboardContainer}>
  {isLoading ? (
    <div className={styles.loading}>Завантаження...</div>
  ) : dashboardData ? (
    <>
      <h1 className={styles.dashboardTitle}>
        Ласкаво просимо, {dashboardData.email}
      </h1>
      <div className={styles.dashboardInfo}>
        <p>Ваша роль: {dashboardData.role}</p>
      </div>
    </>
  ) : (
    <p className={styles.errorMessage}>Не вдалося завантажити дані</p>
  )}
</div>
            </div>
        </div>
    );
};
export default DashboardPage;