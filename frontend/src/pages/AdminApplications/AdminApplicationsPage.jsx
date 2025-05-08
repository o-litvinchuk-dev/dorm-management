import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import {
  HomeIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import styles from "./styles/AdminApplicationsPage.module.css";

const CategoryCard = ({ category, isActive, onClick }) => {
  return (
    <div
      className={`${styles.categoryCard} ${isActive ? styles.active : ""}`}
      onClick={onClick}
    >
      <div className={styles.categoryIcon}>
        <DocumentTextIcon className={styles.icon} />
      </div>
      <div className={styles.categoryContent}>
        <h3 className={styles.categoryTitle}>{category.name}</h3>
        <p className={styles.categoryDescription}>
          {category.description || `Керуйте ${category.name.toLowerCase()}`}
        </p>
      </div>
    </div>
  );
};

const Notification = ({ message, type, onClose }) => {
  return (
    <div className={`${styles.notification} ${styles[type]} ${styles.show}`}>
      <div className={styles.notificationContent}>
        <div className={styles.notificationIcon}>
          {type === "success" ? (
            <CheckCircleIcon className={styles.icon} />
          ) : (
            <XCircleIcon className={styles.icon} />
          )}
        </div>
        <span className={styles.notificationText}>{message}</span>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

const AdminApplicationsPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeCategory, setActiveCategory] = useState("accommodation");
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const categories = [
    {
      id: "accommodation",
      name: "Заяви на поселення",
      route: "/admin/applications/accommodation",
      description: "Керуйте заявками на поселення в гуртожиток",
    },
    {
      id: "dormitory",
      name: "Поселення в гуртожиток",
      route: "/admin/applications/dormitory",
      description: "Організуйте процес поселення студентів",
    },
    {
      id: "contract",
      name: "Контракти",
      route: "/admin/applications/contract",
      description: "Створюйте та редагуйте контракти на проживання",
    },
  ];

  // Simulate notifications (e.g., on category change or external trigger)
  useEffect(() => {
    if (location.state?.notification) {
      addNotification(location.state.notification.message, location.state.notification.type);
    }
  }, [location.state]);

  const addNotification = (message, type) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCategoryClick = (categoryId, route) => {
    setActiveCategory(categoryId);
    navigate(route, {
      state: {
        notification: {
          message: `Перейшли до категорії: ${categories.find((c) => c.id === categoryId).name}`,
          type: "success",
        },
      },
    });
  };

  const handleBreadcrumbClick = (route) => {
    navigate(route);
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        isExpanded={isSidebarExpanded}
        onToggle={setIsSidebarExpanded}
      />
      <div
        className={`${styles.mainContent} ${
          !isSidebarExpanded ? styles.sidebarCollapsed : ""
        }`}
      >
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Адміністрування заявок</h1>
            <p className={styles.subtitle}>
              Виберіть категорію для перегляду та управління заявками
            </p>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => handleCategoryClick(category.id, category.route)}
              />
            ))}
          </div>
        </div>
        <div className={styles.notificationContainer}>
          {notifications.map((notification) => (
            <Notification
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminApplicationsPage;