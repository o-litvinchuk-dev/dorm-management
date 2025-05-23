import React from "react";
import styles from "./ApplicationCard.module.css";

const ApplicationCard = ({ application, onViewDetails }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Н/Д";
    return new Date(dateString).toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Очікує";
      case "approved": return "Підтверджено";
      case "rejected": return "Відхилено";
      case "approved_by_faculty": return "Підтверджено факультетом";
      case "rejected_by_faculty": return "Відхилено факультетом";
      case "approved_by_dorm": return "Підтверджено гуртожитком";
      case "rejected_by_dorm": return "Відхилено гуртожитком";
      case "settled": return "Поселено";
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending": return styles.statusPending;
      case "approved":
      case "approved_by_faculty":
      case "approved_by_dorm":
      case "settled": return styles.statusApproved;
      case "rejected":
      case "rejected_by_faculty":
      case "rejected_by_dorm": return styles.statusRejected;
      default: return "";
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>Заявка #{application.id}</h3>
        <span className={`${styles.status} ${getStatusClass(application.status)}`}>
          {getStatusLabel(application.status)}
        </span>
      </div>
      <div className={styles.cardBody}>
        <p><strong>Гуртожиток:</strong> {application.dormitory_name}</p>
        <p><strong>Дата подачі:</strong> {formatDate(application.application_date)}</p>
        <p><strong>Коментарі:</strong> {application.comments_count || 0}</p>
      </div>
      <div className={styles.cardFooter}>
        <button
          className={styles.detailsButton}
          onClick={() => onViewDetails(application.id)}
        >
          Детальніше
        </button>
      </div>
    </div>
  );
};

export default ApplicationCard;