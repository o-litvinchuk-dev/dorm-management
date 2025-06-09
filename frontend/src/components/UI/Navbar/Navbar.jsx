import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../utils/api";
import { useUser } from "../../../contexts/UserContext";
import styles from "./Navbar.module.css";
import Breadcrumb from "./Breadcrumb/Breadcrumb";
import Avatar from "../Avatar/Avatar";
import SearchResultsDropdown from "./SearchResultsDropdown";
import Notifications from "../Notifications/Notifications";
import { BellIcon, MagnifyingGlassIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
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
  const dropdownRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const handleSelectResult = (path) => {
    navigate(path);
    setSearch("");
    setResults(null);
    setIsSearchOpen(false);
  };

  const handleSearchIconClick = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true);
    }
  };

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (search.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const debounce = setTimeout(() => {
      api.get(`/search?q=${search}`)
        .then((res) => setResults(res.data))
        .catch((err) => console.error("Search failed", err))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

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
        return `Комендант (${user.dormitory_name || user.dormitory_id || "невідомий"})`;
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setSearch("");
        setResults(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        <div className={styles.rightSection}>
          <div
            ref={searchContainerRef}
            className={`${styles.searchContainer} ${isSearchOpen ? styles.open : ""}`}
            onClick={handleSearchIconClick}
          >
            <MagnifyingGlassIcon className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Глобальний пошук..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {isSearchOpen && search.length > 0 && (
              <SearchResultsDropdown
                loading={loading}
                results={results}
                onSelect={handleSelectResult}
              />
            )}
          </div>

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