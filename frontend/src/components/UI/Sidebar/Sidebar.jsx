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
  ShieldCheckIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon, // Icon for Application Presets
  BuildingStorefrontIcon,
  BookmarkSquareIcon,
  HomeModernIcon,
  MagnifyingGlassCircleIcon,
  BuildingLibraryIcon,
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
  ShieldCheckIcon as ShieldCheckSolidIcon,
  AcademicCapIcon as AcademicCapSolidIcon,
  WrenchScrewdriverIcon as WrenchScrewdriverSolidIcon, // Icon for Application Presets
  BuildingStorefrontIcon as BuildingStorefrontSolidIcon,
  BookmarkSquareIcon as BookmarkSquareSolidIcon,
  HomeModernIcon as HomeModernSolidIcon,
  MagnifyingGlassCircleIcon as MagnifyingGlassCircleSolidIcon,
  BuildingLibraryIcon as BuildingLibrarySolidIcon,
} from "@heroicons/react/24/solid";
import api from "../../../utils/api";

const Sidebar = ({ onToggle }) => {
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [tooltipData, setTooltipData] = useState({
    visible: false,
    content: "",
    top: 0,
    left: 0,
  });
  const sidebarRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = // This check is for the whole admin section, individual items have role checks
    user &&
    [
      "admin",
      "superadmin",
      "dorm_manager",
      "student_council_head",
      "student_council_member",
      "faculty_dean_office",
    ].includes(user.role);

  useEffect(() => {
    const path = location.pathname.slice(1).split("/")[0] || "dashboard";
    const currentPath = location.pathname.slice(1);

    // Update adminSubPaths to include the new route if it's namespaced under admin
    // For "admin/application-presets", it's already included.
    const adminSubPaths = [
      "admin/management",
      "admin/accommodation-applications",
      "dean/groups",
      "adminApplications", // Consider renaming or removing if it's old
      "admin/application-presets", // This is the route for Application Presets
      "admin/room-reservations",
      "dorm-manager/rooms",
    ];

    let matchedTab = path;

    if (adminSubPaths.some((subPath) => currentPath.startsWith(subPath))) {
      // For nested admin routes, use the first two segments for active state
      // e.g., "admin/management", "admin/application-presets"
      matchedTab = currentPath.split("/").slice(0, 2).join("/");
      if (
        !adminSubPaths.includes(matchedTab) &&
        currentPath.startsWith("adminApplications") // Legacy or specific case
      ) {
        matchedTab = "adminApplications";
      }
    } else if (currentPath.startsWith("services/rooms")) {
      matchedTab = "services/rooms/search";
    } else if (currentPath.startsWith("services/")) {
      matchedTab = "services";
    } else if (currentPath === "my-reservations"){
        matchedTab = "my-reservations";
    }
    // Add other specific path checks if needed

    const allTabs = [
      "dashboard",
      "applications", // Student's own applications
      "my-accommodation-applications",
      "dormitories",
      "services",
      "services/rooms/search",
      "settlement",
      "my-reservations",
      "settings",
      "help",
      "logout",
      ...adminSubPaths,
    ];

    if (allTabs.includes(matchedTab)) {
      setActiveTab(matchedTab);
    } else {
      // Fallback to parent path if full matchedTab is not in allTabs
      const parentPath = currentPath.split("/")[0];
      if (allTabs.includes(parentPath)) {
        setActiveTab(parentPath);
      } else {
        setActiveTab(path); // Default to the first segment
      }
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

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      logout();
      navigate("/login");
    }
  }, [navigate, logout]);

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
    [navigate, hideTooltip, handleLogout]
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
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        tooltipData.visible
      ) {
        hideTooltip();
      }
    },
    [tooltipData.visible, hideTooltip]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const getIcon = useCallback((iconName, isActive) => {
    const icons = {
      dashboard: isActive ? ChartBarSolidIcon : ChartBarIcon,
      applications: isActive ? DocumentTextSolidIcon : DocumentTextIcon,
      "my-accommodation-applications": isActive ? DocumentTextSolidIcon : DocumentTextIcon,
      dormitories: isActive ? HomeModernSolidIcon : HomeModernIcon,
      services: isActive ? ClipboardDocumentListSolidIcon : ClipboardDocumentListIcon,
      "services/rooms/search": isActive ? MagnifyingGlassCircleSolidIcon : MagnifyingGlassCircleIcon,
      settlement: isActive ? CalendarSolidIcon : CalendarIcon,
      "my-reservations": isActive ? BookmarkSquareSolidIcon : BookmarkSquareIcon,
      settings: isActive ? Cog6ToothSolidIcon : Cog6ToothIcon,
      help: isActive ? QuestionMarkCircleSolidIcon : QuestionMarkCircleIcon,
      logout: isActive ? ArrowLeftOnRectangleSolidIcon : ArrowLeftOnRectangleIcon,
      adminApplications: isActive ? DocumentTextSolidIcon : DocumentTextIcon, // Consider specific icon
      "admin/management": isActive ? ShieldCheckSolidIcon : ShieldCheckIcon,
      "admin/accommodation-applications": isActive ? ClipboardDocumentListSolidIcon : ClipboardDocumentListIcon,
      "dean/groups": isActive ? AcademicCapSolidIcon : AcademicCapIcon,
      "admin/application-presets": isActive ? WrenchScrewdriverSolidIcon : WrenchScrewdriverIcon,
      "admin/room-reservations": isActive ? BuildingStorefrontSolidIcon : BuildingStorefrontIcon,
      "dorm-manager/rooms": isActive ? BuildingLibrarySolidIcon : BuildingLibraryIcon,
    };
    const IconComponent = icons[iconName] || QuestionMarkCircleIcon; // Default icon
    return <IconComponent className={styles.menuIcon} />;
  }, []);

  const renderMenuItem = (name, label) => (
    <button
      key={name}
      className={`${styles.menuItem} ${
        activeTab === name ? styles.active : ""
      }`}
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

  const menuItems = {
    main: [
      { name: "dashboard", label: "Головна" },
      { name: "my-accommodation-applications", label: "Мої заявки на поселення" },
      { name: "my-reservations", label: "Мої бронювання кімнат" },
      { name: "dormitories", label: "Гуртожитки" },
      { name: "services", label: "Послуги" },
      { name: "services/rooms/search", label: "Пошук кімнат" },
      { name: "settlement", label: "Розклад поселення" },
    ],
    admin: [
      // { name: "adminApplications", label: "Адмін-заявки (старі)", roles: ["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"] },
      { name: "admin/accommodation-applications", label: "Заявки на поселення", roles: ["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"] },
      { name: "admin/room-reservations", label: "Бронювання Кімнат", roles: ["admin", "superadmin", "dorm_manager"] },
      { name: "admin/management", label: "Керування системою", roles: ["superadmin"] },
      { name: "dean/groups", label: "Управління групами", roles: ["faculty_dean_office", "admin", "superadmin"] },
      { 
        name: "admin/application-presets", 
        label: "Налаштування Заяв", 
        roles: ["admin", "superadmin", "faculty_dean_office", "dorm_manager"] // Додано dorm_manager
      },
      { name: "dorm-manager/rooms", label: "Керування кімнатами", roles: ["dorm_manager", "admin", "superadmin"] },
    ],
    settings: [{ name: "settings", label: "Налаштування" }],
    bottom: [
      { name: "help", label: "Допомога" },
      { name: "logout", label: "Вийти" },
    ],
  };

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebarContainer} ${
        !isSidebarOpen ? styles.collapsed : ""
      }`}
    >
      <div className={styles.logoContainer}>
        <img
          src="/logo2.svg" // Переконайтесь, що цей шлях правильний
          alt="Dorm Life Logo"
          className={styles.logoImage}
        />
        {isSidebarOpen && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Dorm Life</span>
            <span className={styles.logoSubtitle}>Campus Management</span>
          </div>
        )}
      </div>

      <button
        className={styles.toggleButton}
        onClick={toggleSidebar}
        type="button"
        aria-label={
          isSidebarOpen ? "Згорнути бічну панель" : "Розгорнути бічну панель"
        }
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
              {menuItems.main.map((item) =>
                renderMenuItem(item.name, item.label)
              )}
            </div>

            {isAdmin && ( // Перевіряє, чи користувач має будь-яку з адмінських ролей
              <div className={styles.sidebarSection}>
                {renderSectionHeader("Управління")}
                {menuItems.admin
                  .filter((item) => user && item.roles.includes(user.role)) // Фільтруємо конкретні пункти меню
                  .map((item) => renderMenuItem(item.name, item.label))}
              </div>
            )}

            <div className={styles.sidebarSection}>
              {renderSectionHeader("Налашт.")}
              {menuItems.settings.map((item) =>
                renderMenuItem(item.name, item.label)
              )}
            </div>
          </div>
        </div>
        <div className={styles.bottomSection}>
          {menuItems.bottom.map((item) =>
            renderMenuItem(item.name, item.label)
          )}
        </div>
      </div>

      {!isSidebarOpen && tooltipData.visible && (
        <div
          className={styles.tooltip}
          style={{
            top: `${tooltipData.top}px`,
            left: `${tooltipData.left}px`,
          }}
          onClick={(e) => e.stopPropagation()} // Запобігає закриттю тултіпа при кліку на нього
        >
          <div className={styles.tooltipArrow}></div>
          <div className={styles.tooltipContent}>{tooltipData.content}</div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;