import React, { useState, useMemo } from "react";
import { BellIcon, XMarkIcon, CheckCircleIcon, TrashIcon, EnvelopeOpenIcon } from "@heroicons/react/24/outline";
import styles from "./Notifications.module.css";
import { useUser } from "../../../contexts/UserContext";

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " роки тому";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " міс. тому";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " д. тому";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " год. тому";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " хв. тому";
  return "Щойно";
};

const NotificationItem = ({ notif, onMarkRead, onDelete }) => (
  <li className={`${styles.notificationItem} ${notif.read ? styles.read : ""}`}>
    <div className={styles.notificationIconWrapper}>
      <CheckCircleIcon className={styles.notificationIcon}/>
    </div>
    <div className={styles.notificationContent}>
      <h4>{notif.title}</h4>
      <p>{notif.description}</p>
      <span className={styles.timestamp}>{timeAgo(notif.created_at)}</span>
    </div>
    <div className={styles.actions}>
      {!notif.read && (
        <button onClick={() => onMarkRead(notif.id)} className={`${styles.actionButton} ${styles.readButton}`} title="Позначити як прочитане">
          <EnvelopeOpenIcon className={styles.actionIcon} />
        </button>
      )}
      <button onClick={() => onDelete(notif.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Видалити">
        <TrashIcon className={styles.actionIcon} />
      </button>
    </div>
  </li>
);

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markNotificationAsRead, 
    deleteNotificationFromContext,
    markAllNotificationsAsRead 
  } = useUser();

  const { unread, read } = useMemo(() => {
    return notifications.reduce((acc, notif) => {
      if (notif.read) acc.read.push(notif);
      else acc.unread.push(notif);
      return acc;
    }, { unread: [], read: [] });
  }, [notifications]);

  return (
    <div className={styles.notificationsContainer}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.bellButton}
        title="Сповіщення"
      >
        <BellIcon className={styles.bellIcon} />
        {unreadCount > 0 && <span className={styles.badge} />}
      </button>

      {isOpen && (
        <div className={styles.notificationsDropdown}>
          <div className={styles.header}>
            <h3>Сповіщення</h3>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button onClick={markAllNotificationsAsRead} className={styles.markAllReadButton}>Прочитати все</button>
              )}
              <button onClick={() => setIsOpen(false)} className={styles.closeButton}>
                <XMarkIcon className={styles.closeIcon} />
              </button>
            </div>
          </div>
          <ul className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <li className={styles.noNotifications}>Немає нових сповіщень</li>
            ) : (
              <>
                {unread.length > 0 && (
                  <>
                    <li className={styles.sectionTitle}>Нові</li>
                    {unread.map((notif) => (
                      <NotificationItem key={notif.id} notif={notif} onMarkRead={markNotificationAsRead} onDelete={deleteNotificationFromContext} />
                    ))}
                  </>
                )}
                {read.length > 0 && (
                  <>
                    <li className={styles.sectionTitle}>Прочитані</li>
                    {read.map((notif) => (
                      <NotificationItem key={notif.id} notif={notif} onMarkRead={markNotificationAsRead} onDelete={deleteNotificationFromContext} />
                    ))}
                  </>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications;