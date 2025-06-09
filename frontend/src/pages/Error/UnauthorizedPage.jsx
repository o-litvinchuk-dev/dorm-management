import React from "react";
import { Link } from "react-router-dom";
import styles from './styles/ErrorPage.module.css';
import { NoSymbolIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const UnauthorizedPage = () => {
  return (
    <div className={styles.errorPageContainer}>
      <div className={styles.errorCard}>
        <NoSymbolIcon className={`${styles.errorIcon} ${styles.errorIconUnauthorized}`} />
        <h1 className={styles.errorCode}>403</h1>
        <p className={styles.errorMessage}>Доступ заборонено</p>
        <p className={styles.errorDescription}>
          У вас недостатньо прав для перегляду цієї сторінки. Якщо ви вважаєте, що це помилка, зверніться до адміністратора.
        </p>
        <Link to="/" className={styles.homeButton}>
          <ArrowLeftIcon />
          Повернутися на головну
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;