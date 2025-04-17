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
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.log("[Dashboard] Помилка авторизації, очищення токенів");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    navigate("/login");
                } else {
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