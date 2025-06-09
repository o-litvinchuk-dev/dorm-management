import React from "react";
import { Link } from "react-router-dom";
import styles from './styles/ErrorPage.module.css';
import { QuestionMarkCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className={styles.errorPageContainer}>
      <div className={styles.errorCard}>
        <QuestionMarkCircleIcon className={styles.errorIcon} />
        <h1 className={styles.errorCode}>404</h1>
        <p className={styles.errorMessage}>Сторінку не знайдено</p>
        <p className={styles.errorDescription}>
          На жаль, сторінка, яку ви шукаєте, не існує, була переміщена або тимчасово недоступна.
        </p>
        <Link to="/" className={styles.homeButton}>
          <ArrowLeftIcon />
          Повернутися на головну
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;