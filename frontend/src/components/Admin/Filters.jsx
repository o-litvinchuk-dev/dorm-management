import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import api from "../../utils/api";
import styles from "./styles/Filters.module.css";

const Filters = ({ category, filters, onFilterChange }) => {
  const { user } = useUser();
  const [dormitoriesForDean, setDormitoriesForDean] = useState([]);

  useEffect(() => {
    if (user?.role === "faculty_dean_office" && category === "accommodation") {
      const fetchManagedDormitories = async () => {
        if (!user.faculty_id) {
          console.warn("Faculty Dean Office user does not have faculty_id assigned.");
          setDormitoriesForDean([]);
          return;
        }
        try {
          // Завантажуємо гуртожитки, прив'язані до факультету декана
          const response = await api.get(`/faculty-dormitories?faculty_id=${user.faculty_id}`);
          // response.data тут буде масив зв'язків { faculty_id, dormitory_id, quota, dormitory_name }
          // Нам потрібні унікальні гуртожитки з цих зв'язків
          const uniqueDorms = response.data.reduce((acc, link) => {
            if (!acc.find(d => d.id === link.dormitory_id)) {
              acc.push({ id: link.dormitory_id, name: link.dormitory_name });
            }
            return acc;
          }, []);
          setDormitoriesForDean(uniqueDorms);
        } catch (error) {
          console.error("Помилка отримання гуртожитків для деканату:", error);
          setDormitoriesForDean([]);
        }
      };
      fetchManagedDormitories();
    }
  }, [user?.role, user?.faculty_id, category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const isAccommodation = category === "accommodation";
  const isRestrictedUserRoleForFaculty = ["student_council_head", "student_council_member", "faculty_dean_office"].includes(user?.role);


  return (
    <div className={styles.filters}>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Пошук</label>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder={isAccommodation ? "ID, ПІБ, email, факультет..." : "Ім'я, прізвище..."}
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
              <option value="approved">Затверджено</option>
              <option value="rejected">Відхилено</option>
              <option value="approved_by_faculty">Затв. деканатом</option>
              <option value="rejected_by_faculty">Відх. деканатом</option>
              <option value="approved_by_dorm">Затв. гуртожитком</option>
              <option value="rejected_by_dorm">Відх. гуртожитком</option>
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
                <option value="">Всі керовані гуртожитки</option>
                {dormitoriesForDean.map((dorm) => (
                  <option key={dorm.id} value={dorm.id}>
                    {dorm.name}
                  </option>
                ))}
              </select>
            </div>
          ) : user?.role === "dorm_manager" ? (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Гуртожиток</label>
              <input
                type="text"
                value={user?.dormitory_name || `Гуртожиток ID: ${user?.dormitory_id}` || "Ваш гуртожиток"}
                className={styles.inputField}
                disabled 
              />
            </div>
          ) : ( // Для admin, superadmin (або якщо роль не декан і не комендант, але має доступ)
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>ID гуртожитку</label>
              <input
                type="text"
                name="dormNumber" 
                value={filters.dormNumber}
                onChange={handleChange}
                placeholder="Введіть ID гуртожитку"
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
              value={(isRestrictedUserRoleForFaculty && user?.faculty_name) ? user.faculty_name : filters.faculty}
              onChange={handleChange}
              placeholder="Факультет"
              className={styles.inputField}
              disabled={isRestrictedUserRoleForFaculty && !!user?.faculty_name}
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