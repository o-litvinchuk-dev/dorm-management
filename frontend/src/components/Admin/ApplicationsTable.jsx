import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import styles from "./styles/ApplicationsTable.module.css";

const ApplicationsTable = ({ category, applications, onViewDetails, sort, onSortChange, canUpdateStatus, canAddComment }) => {
  const getColumns = () => {
    if (category === "accommodation") {
      return [
        { key: "id", label: "ID" },
        { key: "full_name", label: "ПІБ Заявника" },
        { key: "user_email", label: "Email" },
        { key: "faculty_name", label: "Факультет" },
        { key: "course", label: "Курс" },
        { key: "group_name", label: "Група" },
        { key: "dormitory_name", label: "Гуртожиток" },
        { key: "phone_number", label: "Телефон" },
        { key: "status", label: "Статус" },
        { key: "application_date", label: "Дата подачі" },
        { key: "created_at", label: "Створено" },
        { key: "actions", label: "Дії" },
      ];
    }
    return [
      { key: "id", label: "ID" },
      { key: "name", label: "Ім'я" },
      { key: "surname", label: "Прізвище" },
      { key: "faculty", label: "Факультет" },
      { key: "course", label: "Курс" },
      { key: "created_at", label: "Дата створення" },
      { key: "actions", label: "Дії" },
    ];
  };

  const columns = getColumns();

  const formatDate = (dateString) => {
    if (!dateString) return "Н/Д";
    return new Date(dateString).toLocaleDateString("uk-UA");
  };

  const handleSort = (key) => {
    if (!["id", "full_name", "status", "application_date", "created_at"].includes(key)) return;
    const newSortOrder =
      sort.sortBy === key && sort.sortOrder === "asc" ? "desc" : "asc";
    onSortChange(key, newSortOrder);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return styles.statusPending;
      case "approved":
      case "approved_by_faculty":
      case "approved_by_dorm":
      case "settled":
        return styles.statusApproved;
      case "rejected":
      case "rejected_by_faculty":
      case "rejected_by_dorm":
        return styles.statusRejected;
      default:
        return "";
    }
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

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={styles.th}>
                <div
                  className={styles.header}
                  onClick={() => handleSort(column.key)}
                  style={column.key !== "actions" ? { cursor: "pointer" } : {}}
                >
                  {column.label}
                  {sort.sortBy === column.key && (
                    sort.sortOrder === "asc" ? (
                      <ArrowUpIcon className={styles.sortIcon} />
                    ) : (
                      <ArrowDownIcon className={styles.sortIcon} />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className={styles.tr}>
              {columns.map((column) => (
                <td key={column.key} className={styles.td}>
                  {column.key === "actions" ? (
                    <button
                      className={styles.actionButton}
                      onClick={() => onViewDetails(app)}
                      disabled={!canUpdateStatus && !canAddComment}
                    >
                      Деталі
                    </button>
                  ) : column.key === "application_date" || column.key === "created_at" ? (
                    formatDate(app[column.key])
                  ) : column.key === "status" ? (
                    <span className={`${styles.status} ${getStatusClass(app[column.key])}`}>
                      {getStatusLabel(app[column.key])}
                    </span>
                  ) : (
                    app[column.key] || "Н/Д"
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicationsTable;