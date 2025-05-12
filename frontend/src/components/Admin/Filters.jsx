import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import api from "../../utils/api";
import styles from "./styles/Filters.module.css";

const Filters = ({ category, filters, onFilterChange }) => {
  const { user } = useUser();
  const [dormitories, setDormitories] = useState([]);

  useEffect(() => {
    if (user?.role === "faculty_dean_office" && category === "accommodation") {
      const fetchManagedDormitories = async () => {
        try {
          const response = await api.get("/secure/managed-dormitories");
          setDormitories(response.data);
        } catch (error) {
          console.error("Помилка отримання гуртожитків:", error);
        }
      };
      fetchManagedDormitories();
    }
  }, [user?.role, category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const isAccommodation = category === "accommodation";
  const isRestrictedRole = ["dorm_manager", "student_council_head", "student_council_member"].includes(user?.role);

  return (
    <div className={styles.filters}>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Пошук</label>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder={isAccommodation ? "Пошук за ID, ПІБ, email..." : "Пошук за ім'ям, прізвищем..."}
          className={styles.inputField}
        />
      </div>
      {isAccommodation ? (
        <>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Статус</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className={styles.inputField}
            >
              <option value="">Всі статуси</option>
              <option value="pending">Очікує</option>
              <option value="approved">Підтверджено</option>
              <option value="rejected">Відхилено</option>
              <option value="approved_by_faculty">Підтверджено факультетом</option>
              <option value="rejected_by_faculty">Відхилено факультетом</option>
              <option value="approved_by_dorm">Підтверджено гуртожитком</option>
              <option value="rejected_by_dorm">Відхилено гуртожитком</option>
              <option value="settled">Поселено</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Дата від</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Дата до</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          {user?.role === "faculty_dean_office" ? (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Гуртожиток</label>
              <select
                name="dormNumber"
                value={filters.dormNumber}
                onChange={handleChange}
                className={styles.inputField}
              >
                <option value="">Всі гуртожитки</option>
                {dormitories.map((dorm) => (
                  <option key={dorm.id} value={dorm.id}>
                    {dorm.name}
                  </option>
                ))}
              </select>
            </div>
          ) : isRestrictedRole ? (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Гуртожиток</label>
              <input
                type="text"
                name="dormNumber"
                value={user?.dormitory_id || filters.dormNumber}
                className={styles.inputField}
                disabled
              />
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>ID гуртожитку</label>
              <input
                type="text"
                name="dormNumber"
                value={filters.dormNumber}
                onChange={handleChange}
                placeholder="ID гуртожитку"
                className={styles.inputField}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Факультет</label>
            <input
              type="text"
              name="faculty"
              value={isRestrictedRole ? user?.faculty_name || filters.faculty : filters.faculty}
              onChange={handleChange}
              placeholder="Факультет"
              className={styles.inputField}
              disabled={isRestrictedRole}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Курс</label>
            <input
              type="number"
              name="course"
              value={filters.course}
              onChange={handleChange}
              placeholder="Курс"
              min="1"
              max="6"
              className={styles.inputField}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Дата від</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Дата до</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Filters;