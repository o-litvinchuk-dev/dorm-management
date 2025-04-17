import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../utils/api";
import { useUser } from "../../../contexts/UserContext";
import styles from "./Navbar.module.css";
import Breadcrumb from "./Breadcrumb/Breadcrumb";

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
  const { user, loading, logout: forceLogout } = useUser();
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
    if (loading) return "Завантаження...";
    return user?.name || user?.email || "Користувач";
  };

  const getNickname = (email) => {
    if (!email) return "Користувач";
    return email.split("@")[0]; // Беремо частину до "@"
  };

  const getInitials = (email) => {
    if (!email) return "U";
    return email
      .split("@")[0]
      .split(/[._]/)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `#${Array.from({ length: 3 }, (_, i) =>
      ((hash >> (i * 8)) & 0xFF).toString(16).padStart(2, "0")
    ).join("")}`;
  };

  const processAvatarUrl = (url) => {
    if (!url) return null;
    return url.includes("googleusercontent.com")
      ? `${url.replace(/(=s\d+)(-c)?$/, "=s96-c")}?${Date.now()}`
      : `${url}?${Date.now()}`;
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
      forceLogout();
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

          <div className={styles.notificationWrapper}>
            <button className={styles.notificationButton} aria-label="Сповіщення">
              <BellIcon className={styles.notificationIcon} />
              {unreadNotifications > 0 && (
                <span className={styles.notificationBadge}>{unreadNotifications}</span>
              )}
            </button>
          </div>

          <div className={styles.divider}></div>

          <div
            className={styles.profileSection}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            ref={dropdownRef}
            aria-expanded={isDropdownOpen}
          >
            <div className={styles.avatar}>
              {user?.avatar ? (
                <img
                  src={processAvatarUrl(user.avatar)}
                  alt="Аватар"
                  className={styles.avatarImage}
                  referrerPolicy="no-referrer"
                  onError={(e) => (e.target.style.display = "none")}
                  loading="lazy"
                />
              ) : (
                <div
                  className={styles.avatarFallback}
                  style={{
                    backgroundColor: stringToColor(user?.email || "user"),
                    color: getComputedStyle(document.documentElement)
                      .getPropertyValue("--text-color-primary") || "#fff",
                  }}
                >
                  {getInitials(user?.email)}
                </div>
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{getNickname(user?.email)}</span>
              <span className={styles.userRole}>
                {user?.role === "admin" ? "Адміністратор" : "Студент"}
              </span>
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