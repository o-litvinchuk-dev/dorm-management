import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import styles from "./styles/ApplicationsTable.module.css";

const ApplicationsTable = ({ category, applications, onViewDetails, sort, onSortChange }) => {
  const getColumns = () => {
    if (category === "accommodation") {
      return [
        { key: "id", label: "ID" },
        { key: "applicant_full_name", label: "ПІБ Заявника" },
        { key: "user_email", label: "Email" },
        { key: "dorm_number", label: "Номер гуртожитку" },
        { key: "status", label: "Статус" },
        { key: "application_date", label: "Дата подачі" },
        { key: "actions", label: "Дії" },
      ];
    }
    // Default columns for other categories
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
    if (!["id", "applicant_full_name", "user_email", "dorm_number", "status", "application_date", "created_at"].includes(key)) return;
    const newSortOrder =
      sort.sortBy === key && sort.sortOrder === "asc" ? "desc" : "asc";
    onSortChange(key, newSortOrder);
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>
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
          <tr key={app.id}>
            {columns.map((column) => (
              <td key={column.key}>
                {column.key === "actions" ? (
                  <button
                    className={styles.actionButton}
                    onClick={() => onViewDetails(app)}
                  >
                    Деталі
                  </button>
                ) : column.key === "application_date" || column.key === "created_at" ? (
                  formatDate(app[column.key])
                ) : column.key === "status" ? (
                  app[column.key] === "pending" ? "Очікує" :
                  app[column.key] === "approved" ? "Підтверджено" :
                  app[column.key] === "rejected" ? "Відхилено" : app[column.key]
                ) : (
                  app[column.key] || "Н/Д"
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ApplicationsTable;