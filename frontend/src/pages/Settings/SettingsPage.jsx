import React, { useState, useEffect } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import AccountSettings from "../../components/Settings/AccountSettings";
import SecuritySettings from "../../components/Settings/SecuritySettings";
import NotificationSettings from "../../components/Settings/NotificationSettings";
import InterfaceSettings from "../../components/Settings/InterfaceSettings";
import { UserIcon, ShieldCheckIcon, BellIcon, CogIcon } from "@heroicons/react/24/outline";
import styles from "./styles/SettingsPage.module.css";

const SettingsPage = () => {
  const [activeCategory, setActiveCategory] = useState("account");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  // Оновлюємо стан у localStorage при зміні
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const categories = [
    { id: "account", label: "Обліковий запис", icon: <UserIcon className={styles.navIcon} /> },
    { id: "security", label: "Безпека", icon: <ShieldCheckIcon className={styles.navIcon} /> },
    { id: "notifications", label: "Сповіщення", icon: <BellIcon className={styles.navIcon} /> },
    { id: "interface", label: "Інтерфейс", icon: <CogIcon className={styles.navIcon} /> },
  ];

  const renderContent = () => {
    switch (activeCategory) {
      case "account": return <AccountSettings />;
      case "security": return <SecuritySettings />;
      case "notifications": return <NotificationSettings />;
      case "interface": return <InterfaceSettings />;
      default: return <div>Виберіть категорію</div>;
    }
  };

  return (
    <div className={styles.settingsLayout}>
      <Sidebar onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar 
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded(prev => !prev)}
        />
        <div className={styles.settingsContainer}>
          <div className={styles.navigationWrapper}>
            <h2 className={styles.settingsHeader}>Налаштування</h2>
            <div className={styles.navigation}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`${styles.navButton} ${activeCategory === category.id ? styles.active : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.icon}
                  <span className={styles.navText}>{category.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.content}>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;