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
  ShieldCheckIcon, // Keep for superadmin management link
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  BuildingStorefrontIcon,
  BookmarkSquareIcon,
  HomeModernIcon,
  MagnifyingGlassCircleIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon as AdminPanelIcon,
  AcademicCapIcon as DeanPanelIcon,
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
  ShieldCheckIcon as ShieldCheckSolidIcon, // Keep for superadmin management link
  AcademicCapIcon as AcademicCapSolidIcon,
  WrenchScrewdriverIcon as WrenchScrewdriverSolidIcon,
  BuildingStorefrontIcon as BuildingStorefrontSolidIcon,
  BookmarkSquareIcon as BookmarkSquareSolidIcon,
  HomeModernIcon as HomeModernSolidIcon,
  MagnifyingGlassCircleIcon as MagnifyingGlassCircleSolidIcon,
  BuildingLibraryIcon as BuildingLibrarySolidIcon,
  ShieldCheckIcon as AdminPanelSolidIcon,
  AcademicCapIcon as DeanPanelSolidIcon,
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

  const isAdminRole = user && [ // Renamed for clarity
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

    const adminSubPaths = [
      "admin/management",
      "admin/accommodation-applications",
      "dean/groups",
      "adminApplications", // Keep if it's a distinct page not covered by dashboards
      "admin/application-presets",
      "admin/room-reservations",
      "dorm-manager/rooms",
      "dorm-manager/dashboard",
      "admin/settlement-agreements",
      "dean/dashboard",
      "admin/dashboard",
    ];

    let matchedTab = path;

    // Prioritize dashboard paths for active tab highlighting
    if (currentPath === "dorm-manager/dashboard") matchedTab = "dorm-manager/dashboard";
    else if (currentPath === "dean/dashboard") matchedTab = "dean/dashboard";
    else if (currentPath === "admin/dashboard") matchedTab = "admin/dashboard";
    else if (adminSubPaths.some((subPath) => currentPath.startsWith(subPath))) {
      matchedTab = currentPath.split("/").slice(0, 2).join("/");
      if (
        !adminSubPaths.includes(matchedTab) &&
        currentPath.startsWith("adminApplications")
      ) {
        matchedTab = "adminApplications";
      }
    } else if (currentPath.startsWith("services/rooms")) {
      matchedTab = "services/rooms/search";
    } else if (currentPath.startsWith("services/")) {
      matchedTab = "services";
    } else if (currentPath === "my-reservations") {
      matchedTab = "my-reservations";
    }

    const allTabs = [
      "dashboard",
      "applications", // This seems like a general "My Applications" for students
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
      const parentPath = currentPath.split("/")[0];
      if (allTabs.includes(parentPath)) {
        setActiveTab(parentPath);
      } else {
        setActiveTab(path);
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
      
      // Admin/Role specific panel icons
      "admin/dashboard": isActive ? AdminPanelSolidIcon : AdminPanelIcon,
      "dorm-manager/dashboard": isActive ? BuildingStorefrontSolidIcon : BuildingStorefrontIcon,
      "dean/dashboard": isActive ? DeanPanelSolidIcon : DeanPanelIcon,

      // Icons for individual admin functions (might be hidden if dashboard exists)
      adminApplications: isActive ? DocumentTextSolidIcon : DocumentTextIcon, // If it's a general "view all" page for admins
      "admin/management": isActive ? ShieldCheckSolidIcon : ShieldCheckIcon, // Superadmin only usually
      "admin/accommodation-applications": isActive ? ClipboardDocumentListSolidIcon : ClipboardDocumentListIcon,
      "dean/groups": isActive ? AcademicCapSolidIcon : AcademicCapIcon,
      "admin/application-presets": isActive ? WrenchScrewdriverSolidIcon : WrenchScrewdriverIcon,
      "admin/room-reservations": isActive ? BuildingStorefrontSolidIcon : BuildingStorefrontIcon,
      "dorm-manager/rooms": isActive ? BuildingLibrarySolidIcon : BuildingLibraryIcon,
      "admin/settlement-agreements": isActive ? WrenchScrewdriverSolidIcon : WrenchScrewdriverIcon,
    };
    const IconComponent = icons[iconName] || QuestionMarkCircleIcon;
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

  // Define which roles have a dedicated dashboard that groups functionalities
  const hasDedicatedDashboard = (role) => {
    return ['dorm_manager', 'faculty_dean_office', 'admin', 'superadmin'].includes(role);
  };

  // Define which admin links are grouped under a dedicated dashboard
  // These will be hidden if the user has a dedicated dashboard
  const groupedAdminFunctions = [
    "admin/accommodation-applications",
    "admin/room-reservations",
    "admin/settlement-agreements",
    "dean/groups", // Dean's dashboard covers this for deans
    "admin/application-presets", // Covered by admin, dean, dorm_manager dashboards
    "dorm-manager/rooms", // Covered by dorm_manager dashboard
  ];

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
    // This section will now primarily show the "Panel" links
    // Individual links will be filtered based on whether a panel exists for the role
    adminPanels: [
        { name: "admin/dashboard", label: "Адмін. Панель", roles: ["admin", "superadmin"] },
        { name: "dorm-manager/dashboard", label: "Панель коменданта", roles: ["dorm_manager"] },
        { name: "dean/dashboard", label: "Панель Деканату", roles: ["faculty_dean_office"] },
    ],
    // These are specific admin functions that might not be on a panel OR for roles without a panel
    // or for superadmin to see everything.
    specificAdminFunctions: [
      { name: "admin/accommodation-applications", label: "Усі Заявки", roles: ["superadmin", "admin", "student_council_head", "student_council_member"] }, // student_council might not have a panel
      { name: "admin/room-reservations", label: "Усі Бронювання", roles: ["superadmin", "admin"] },
      { name: "admin/settlement-agreements", label: "Усі Договори", roles: ["superadmin", "admin"] },
      { name: "admin/management", label: "Керування Системою", roles: ["superadmin"] },
      { name: "dean/groups", label: "Управління групами (загальне)", roles: ["superadmin", "admin"] }, // Superadmin/admin access to all groups
      { name: "admin/application-presets", label: "Налаштування Заяв (загальне)", roles: ["superadmin", "admin"]},
      { name: "dorm-manager/rooms", label: "Усі Кімнати (Адмін)", roles: ["superadmin", "admin"] }, // Superadmin/admin access to all rooms
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
          src="/logo2.svg"
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

            {isAdminRole && (
              <div className={styles.sidebarSection}>
                {renderSectionHeader("Управління")}
                {/* Render Panel Links First */}
                {menuItems.adminPanels
                  .filter((item) => user && item.roles.includes(user.role))
                  .map((item) => renderMenuItem(item.name, item.label))}

                {/* Render specific admin functions only if the user is superadmin OR if the user's role does NOT have a dedicated dashboard that would cover this function */}
                {menuItems.specificAdminFunctions
                  .filter((item) => {
                    if (!user || !item.roles.includes(user.role)) {
                      return false; // User doesn't have this role at all
                    }
                    // Superadmin sees everything
                    if (user.role === "superadmin") {
                      return true;
                    }
                    // If user is NOT superadmin, and their role has a dedicated dashboard,
                    // and this function is typically grouped under such a dashboard, then HIDE it.
                    if (hasDedicatedDashboard(user.role) && groupedAdminFunctions.includes(item.name)) {
                       // Special case: student_council_head/member might need direct access to applications
                       // if their "panel" is just the applications list itself.
                       // If they don't have a specific *dashboard* page, but a direct link, we show it.
                       if ((user.role === "student_council_head" || user.role === "student_council_member") && item.name === "admin/accommodation-applications") {
                           return true;
                       }
                       return false;
                    }
                    // Otherwise, show it (e.g., for admin role if it doesn't have its own dashboard page yet, or functions not on panels)
                    return true;
                  })
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