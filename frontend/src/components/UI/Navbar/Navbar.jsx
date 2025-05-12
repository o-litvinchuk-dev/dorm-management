import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../utils/api";
import { useUser } from "../../../contexts/UserContext";
import styles from "./Navbar.module.css";
import Breadcrumb from "./Breadcrumb/Breadcrumb";
import Avatar from "../Avatar/Avatar";
import Notifications from "../Notifications/Notifications";

import {
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/solid";

const Navbar = ({ isSidebarExpanded }) => {
  const { user, isLoading, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const [notifications] = useState([
    { id: 1, title: "Нове повідомлення", text: "Ви отримали нове повідомлення", read: false },
    { id: 2, title: "Оновлення системи", text: "Заплановане ТО", read: true },
  ]);

  const getDisplayName = () => {
    if (isLoading) return "Завантаження...";
    return user?.name || user?.email || "Користувач";
  };

  const getNickname = (email) => {
    if (!email) return "Користувач";
    return email.split("@")[0];
  };

  const getUserRoleDisplay = () => {
    if (!user) return "Користувач";
    switch (user.role) {
      case "admin":
      case "superadmin":
        return "Адміністратор";
      case "faculty_dean_office":
        return `Деканат (${user.faculty_name || "Факультет"})`;
      case "dorm_manager":
        return `Комендант (Гуртожиток ${user.dormitory_name || user.dormitory_id || "невідомий"})`;
      case "student_council_head":
        return `Голова студ. ради (${user.faculty_name || "Факультет"})`;
      case "student_council_member":
        return `Студ. рада (${user.faculty_name || "Факультет"})`;
      default:
        return "Студент";
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current?.contains(e.target)) return;
      if (searchRef.current?.contains(e.target)) return;
      setIsDropdownOpen(false);
      setIsSearchExpanded(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => window.location.reload();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      logout();
      navigate("/login");
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Помилка виходу:", error);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const isDashboard = location.pathname === "/dashboard";

  return (
    <nav className={`${styles.navbar} ${!isSidebarExpanded ? styles.withCollapsedSidebar : ""}`}>
      <div className={styles.container}>
        {isDashboard ? (
          <div className={styles.greeting}>
            Ласкаво просимо, <span className={styles.userName}>{getDisplayName()} 👋</span>
          </div>
        ) : (
          <Breadcrumb />
        )}

        {isSearchExpanded && (
          <div className={styles.searchContainer} ref={searchRef}>
            <input type="text" placeholder="Пошук..." className={styles.searchInput} autoFocus />
          </div>
        )}

        <div className={styles.rightSection}>
          <button
            className={styles.searchIconButton}
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            aria-label={isSearchExpanded ? "Закрити пошук" : "Відкрити пошук"}
          >
            <MagnifyingGlassIcon className={styles.searchIcon} />
          </button>

          <Notifications />

          <div className={styles.divider}></div>

          <div
            className={styles.profileSection}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            ref={dropdownRef}
            aria-expanded={isDropdownOpen}
          >
            <div className={styles.avatar}>
              <Avatar user={user} size={40} />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{getNickname(user?.email)}</span>
              <span className={styles.userRole}>{getUserRoleDisplay()}</span>
            </div>
            <ChevronDownIcon
              className={`${styles.chevronIcon} ${isDropdownOpen ? styles.rotated : ""}`}
            />

            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => navigate("/profile")} className={styles.dropdownItem}>
                  <UserCircleIcon className={styles.dropdownIcon} /> Профіль
                </button>
                <button onClick={() => navigate("/settings")} className={styles.dropdownItem}>
                  <Cog6ToothIcon className={styles.dropdownIcon} /> Налаштування
                </button>
                <button onClick={handleLogout} className={styles.dropdownItem}>
                  <ArrowLeftOnRectangleIcon className={styles.dropdownIcon} /> Вийти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;