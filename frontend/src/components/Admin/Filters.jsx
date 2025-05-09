import React from "react";
import styles from "./styles/Filters.module.css";

const Filters = ({ category, filters, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const isAccommodation = category === "accommodation";

  return (
    <div className={styles.filters}>
      <input
        type="text"
        name="search"
        value={filters.search}
        onChange={handleChange}
        placeholder={isAccommodation ? "Пошук за ID, ПІБ, email..." : "Пошук за ім'ям, прізвищем..."}
        className={styles.input}
      />
      {isAccommodation ? (
        <>
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">Всі статуси</option>
            <option value="pending">Очікує</option>
            <option value="approved">Підтверджено</option>
            <option value="rejected">Відхилено</option>
          </select>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className={styles.input}
          />
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className={styles.input}
          />
          <input
            type="text"
            name="dormNumber"
            value={filters.dormNumber}
            onChange={handleChange}
            placeholder="Номер гуртожитку"
            className={styles.input}
          />
        </>
      ) : (
        <>
          <input
            type="text"
            name="faculty"
            value={filters.faculty}
            onChange={handleChange}
            placeholder="Факультет"
            className={styles.input}
          />
          <input
            type="number"
            name="course"
            value={filters.course}
            onChange={handleChange}
            placeholder="Курс"
            min="1"
            max="6"
            className={styles.input}
          />
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className={styles.input}
          />
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className={styles.input}
          />
        </>
      )}
    </div>
  );
};

export default Filters;