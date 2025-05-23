import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import styles from "./styles/ApplicationsTable.module.css";

const ApplicationsTable = ({ category, applications, onViewDetails, sort, onSortChange, canUpdateStatus, canAddComment }) => {
  const getColumns = () => {
    if (category === "accommodation") {
      return [
        { key: "id", label: "ID", sortable: true },
        { key: "full_name", label: "ПІБ Заявника", sortable: true },
        { key: "user_email", label: "Email", sortable: false },
        { key: "faculty_name", label: "Факультет", sortable: false },
        { key: "course", label: "Курс", sortable: false },
        { key: "group_name", label: "Група", sortable: false },
        { key: "dormitory_name", label: "Гуртожиток", sortable: false },
        { key: "phone_number", label: "Телефон", sortable: false },
        { key: "status", label: "Статус", sortable: true },
        { key: "created_at", label: "Створено", sortable: true },
        { key: "actions", label: "Дії", sortable: false },
      ];
    }
    // Fallback for other categories, if any
    return [
      { key: "id", label: "ID", sortable: true },
      { key: "name", label: "Ім'я", sortable: true },
      { key: "surname", label: "Прізвище", sortable: true },
      { key: "faculty", label: "Факультет", sortable: false },
      { key: "course", label: "Курс", sortable: false },
      { key: "created_at", label: "Дата створення", sortable: true },
      { key: "actions", label: "Дії", sortable: false },
    ];
  };

  const columns = getColumns();

  const formatDate = (dateString) => {
    if (!dateString) return "Н/Д";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Некор. дата";
        return date.toLocaleDateString("uk-UA", {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Помилка дати";
    }
  };

  const handleSort = (key) => {
    const column = columns.find(col => col.key === key);
    if (!column || !column.sortable) return;

    const newSortOrder =
      sort.sortBy === key && sort.sortOrder === "asc" ? "desc" : "asc";
    onSortChange(key, newSortOrder);
  };

  const getStatusClass = (status) => {
    if (!status) return ""; // Default or no specific class
    switch (status.toLowerCase()) {
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
        return styles.statusDefault; // Added a default style
    }
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
        pending: "Очікує",
        approved: "Затверджено",
        rejected: "Відхилено",
        approved_by_faculty: "Затв. деканатом",
        rejected_by_faculty: "Відх. деканатом",
        approved_by_dorm: "Затв. гуртожитком",
        rejected_by_dorm: "Відх. гуртожитком",
        settled: "Поселено",
    };
    return statusLabels[status] || status;
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
                  style={column.sortable ? { cursor: "pointer" } : { cursor: "default" }}
                  role={column.sortable ? "button" : undefined}
                  tabIndex={column.sortable ? 0 : undefined}
                  onKeyDown={column.sortable ? (e) => (e.key === 'Enter' || e.key === ' ') && handleSort(column.key) : undefined}
                  aria-sort={column.sortable && sort.sortBy === column.key ? (sort.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {column.label}
                  {column.sortable && sort.sortBy === column.key && (
                    sort.sortOrder === "asc" ? (
                      <ArrowUpIcon className={styles.sortIcon} aria-hidden="true"/>
                    ) : (
                      <ArrowDownIcon className={styles.sortIcon} aria-hidden="true"/>
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
                <td key={column.key} className={styles.td} data-label={column.label}>
                  {column.key === "actions" ? (
                    <button
                      className={styles.actionButton}
                      onClick={() => onViewDetails(app)}
                      disabled={!canUpdateStatus && !canAddComment}
                      aria-label={`Деталі для заявки ID ${app.id}`}
                    >
                      Деталі
                    </button>
                  ) : column.key === "created_at" ? (
                    formatDate(app[column.key])
                  ) : column.key === "status" ? (
                    <span className={`${styles.status} ${getStatusClass(app[column.key])}`}>
                      {getStatusLabel(app[column.key])}
                    </span>
                  ) : (
                    app[column.key] === null || app[column.key] === undefined || app[column.key] === '' ? "Н/Д" : String(app[column.key])
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