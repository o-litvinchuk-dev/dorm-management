import React, { useState, useEffect } from "react";
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline"; // Змінено XIcon на XMarkIcon
import api from "../../../utils/api";
import styles from "./Notifications.module.css";

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Завантаження сповіщень при відкритті
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/secure/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Помилка при отриманні сповіщень:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/secure/notifications/${id}/read`);
      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Помилка при відмітці сповіщення:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/secure/notifications/${id}`);
      setNotifications(notifications.filter((notif) => notif.id !== id));
    } catch (error) {
      console.error("Помилка при видаленні сповіщення:", error);
    }
  };

  return (
    <div className={styles.notificationsContainer}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.bellButton}
        title="Сповіщення"
      >
        <BellIcon className={styles.bellIcon} />
        {notifications.some((notif) => !notif.read) && (
          <span className={styles.badge} />
        )}
      </button>
      {isOpen && (
        <div className={styles.notificationsDropdown}>
          <div className={styles.header}>
            <h3>Сповіщення</h3>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
            >
              <XMarkIcon className={styles.closeIcon} /> {/* Змінено XIcon на XMarkIcon */}
            </button>
          </div>
          <ul className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <li className={styles.noNotifications}>Немає сповіщень</li>
            ) : (
              notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`${styles.notificationItem} ${
                    notif.read ? styles.read : ""
                  }`}
                >
                  <div className={styles.notificationContent}>
                    <h4>{notif.title}</h4>
                    <p>{notif.description}</p>
                    <span className={styles.timestamp}>
                      {new Date(notif.createdAt).toLocaleString("uk-UA")}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className={styles.readButton}
                      >
                        Прочитано
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className={styles.deleteButton}
                    >
                      Видалити
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications;