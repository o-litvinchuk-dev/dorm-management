import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../../contexts/UserContext";
import styles from "./Sidebar.module.css";
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  DocumentTextIcon as DocumentTextSolidIcon,
  CalendarIcon as CalendarSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
  QuestionMarkCircleIcon as QuestionMarkCircleSolidIcon,
  ArrowLeftOnRectangleIcon as ArrowLeftOnRectangleSolidIcon,
  ClipboardDocumentListIcon as ClipboardDocumentListSolidIcon,
} from "@heroicons/react/24/solid";
import api from "../../../utils/api";

const Sidebar = ({ onToggle }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [tooltipData, setTooltipData] = useState({ visible: false, content: "", top: 0, left: 0 });
  const sidebarRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user && ["admin", "superadmin", "dorm_admin"].includes(user.role);

  useEffect(() => {
    const pathSegments = location.pathname.slice(1).split("/");
    const basePath = pathSegments[0] || "dashboard";
    const mainTabs = [
      "dashboard",
      "applications",
      "dormitories",
      "services",
      "settlement",
      "settings",
      "help",
      "logout",
      "adminApplications",
    ];

    if (mainTabs.includes(basePath)) {
      setActiveTab(basePath);
    } else if (pathSegments[0] === "services") {
      setActiveTab("services");
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
    if (onToggle) onToggle(isSidebarOpen);
  }, [isSidebarOpen, onToggle]);

  const hideTooltip = useCallback(() => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setTooltipData((prev) => ({ ...prev, visible: false }));
  }, []);

  const showTooltip = useCallback(
    (e, label) => {
      if (!isSidebarOpen) {
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipData({
          visible: true,
          content: label,
          top: rect.top + window.scrollY + rect.height / 2,
          left: rect.right + 10,
        });
      }
    },
    [isSidebarOpen]
  );

  const handleNavigation = useCallback(
    (tab) => {
      setActiveTab(tab);
      hideTooltip();
      if (tab === "logout") {
        handleLogout();
      } else {
        navigate(`/${tab}`);
      }
    },
    [navigate, hideTooltip]
  );

  const handleLogout = useCallback(
    async () => {
      try {
        await api.post("/auth/logout");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
    [navigate]
  );

  const toggleSidebar = useCallback(() => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    hideTooltip();
  }, [isSidebarOpen, hideTooltip]);

  useEffect(() => {
    if (isSidebarOpen) hideTooltip();
  }, [isSidebarOpen, hideTooltip]);

  const handleClickOutside = useCallback(
    (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && tooltipData.visible) {
        hideTooltip();
      }
    },
    [tooltipData.visible, hideTooltip]
  );

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [handleClickOutside]);

  const getIcon = useCallback((iconName, isActive) => {
    const icons = {
      dashboard: isActive ? ChartBarSolidIcon : ChartBarIcon,
      applications: isActive ? DocumentTextSolidIcon : DocumentTextIcon,
      dormitories: isActive ? UserGroupSolidIcon : UserGroupIcon,
      services: isActive ? ClipboardDocumentListSolidIcon : ClipboardDocumentListIcon,
      settlement: isActive ? CalendarSolidIcon : CalendarIcon,
      settings: isActive ? Cog6ToothSolidIcon : Cog6ToothIcon,
      help: isActive ? QuestionMarkCircleSolidIcon : QuestionMarkCircleIcon,
      logout: isActive ? ArrowLeftOnRectangleSolidIcon : ArrowLeftOnRectangleIcon,
      adminApplications: isActive ? DocumentTextSolidIcon : DocumentTextIcon,
    };
    const IconComponent = icons[iconName];
    return <IconComponent className={styles.menuIcon} />;
  }, []);

  const renderMenuItem = (name, label) => (
    <button
      key={name}
      className={`${styles.menuItem} ${activeTab === name ? styles.active : ""}`}
      onClick={() => handleNavigation(name)}
      onMouseEnter={(e) => showTooltip(e, label)}
      onMouseLeave={hideTooltip}
      data-name={name}
      type="button"
    >
      {getIcon(name, activeTab === name)}
      <span className={styles.menuText}>{label}</span>
    </button>
  );

  const renderSectionHeader = (title) => (
    <div key={title} className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>{title}</span>
    </div>
  );

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebarContainer} ${!isSidebarOpen ? styles.collapsed : ""}`}
    >
      <div className={styles.logoContainer}>
        <img src="/logo2.svg" alt="Dorm Life Logo" className={styles.logoImage} />
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>Dorm Life</span>
          <span className={styles.logoSubtitle}>Campus Management</span>
        </div>
      </div>

      <button
        className={styles.toggleButton}
        onClick={toggleSidebar}
        type="button"
        aria-label={isSidebarOpen ? "Згорнути бічну панель" : "Розгорнути бічну панель"}
      >
        {isSidebarOpen ? (
          <ChevronLeftIcon className={styles.toggleIcon} />
        ) : (
          <ChevronRightIcon className={styles.toggleIcon} />
        )}
      </button>

      <div className={styles.sidebarContent}>
        <div className={styles.sidebarScroll}>
          <div className={styles.sidebarMain}>
            <div className={styles.sidebarSection}>
              {renderSectionHeader("Основне")}
              {renderMenuItem("dashboard", "Головна")}
              {renderMenuItem("applications", "Мої заявки")}
              {renderMenuItem("dormitories", "Гуртожитки")}
              {renderMenuItem("services", "Послуги")}
              {renderMenuItem("settlement", "Розклад поселення")}
            </div>

            {isAdmin && (
              <div className={styles.sidebarSection}>
                {renderSectionHeader("Управління")}
                {renderMenuItem("adminApplications", "Усі заявки")}
              </div>
            )}

            <div className={styles.sidebarSection}>
              {renderSectionHeader("Налашт.")}
              {renderMenuItem("settings", "Налаштування")}
            </div>
          </div>
        </div>

        <div className={styles.bottomSection}>
          {renderMenuItem("help", "Допомога")}
          {renderMenuItem("logout", "Вийти")}
        </div>
      </div>

      {!isSidebarOpen && tooltipData.visible && (
        <div
          className={styles.tooltip}
          style={{ top: `${tooltipData.top}px`, left: `${tooltipData.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.tooltipArrow}></div>
          <div className={styles.tooltipContent}>{tooltipData.content}</div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;