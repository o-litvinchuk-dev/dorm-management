import React from "react";
import styles from "./styles/Pagination.module.css";

const Pagination = ({ total = 0, page = 1, limit = 10, onPageChange, onLimitChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const limits = [5, 10, 20, 50];

  const handlePageClick = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange?.(newPage);
    }
  };

  return (
    <div className={styles.pagination}>
      <div className={styles.limit}>
        <label className={styles.label}>На сторінці:</label>
        <select
          value={limit}
          onChange={(e) => onLimitChange?.(Number(e.target.value))}
          className={styles.select}
          aria-label="Кількість записів на сторінці"
        >
          {limits.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.pages}>
        <button
          className={styles.button}
          disabled={page === 1}
          onClick={() => handlePageClick(page - 1)}
          aria-label="Попередня сторінка"
        >
          Попередня
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i + 1}
            className={`${styles.button} ${page === i + 1 ? styles.active : ""}`}
            onClick={() => handlePageClick(i + 1)}
            aria-label={`Сторінка ${i + 1}`}
            aria-current={page === i + 1 ? "page" : undefined}
          >
            {i + 1}
          </button>
        ))}
        <button
          className={styles.button}
          disabled={page === totalPages}
          onClick={() => handlePageClick(page + 1)}
          aria-label="Наступна сторінка"
        >
          Наступна
        </button>
      </div>
    </div>
  );
};

export default Pagination;