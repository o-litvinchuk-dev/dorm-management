// frontend/src/components/Admin/FacultyTable.jsx
import React from "react";
import styles from "./styles/FacultyTable.module.css";

const FacultyTable = ({ faculties, onEdit, onDelete }) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Назва</th>
          <th>Створено</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        {faculties.map((faculty) => (
          <tr key={faculty.id}>
            <td>{faculty.id}</td>
            <td>{faculty.name}</td>
            <td>{new Date(faculty.created_at).toLocaleDateString("uk-UA")}</td>
            <td>
              <button onClick={() => onEdit(faculty)} className={styles.editButton}>
                Редагувати
              </button>
              <button onClick={() => onDelete(faculty.id)} className={styles.deleteButton}>
                Видалити
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FacultyTable;