import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles/ActivitySummaryCard.module.css'; // Ensure this path is correct

const ActivitySummaryCard = ({ title, count, linkTo, icon, description }) => (
  <Link to={linkTo} className={styles.summaryCard}>
    <div className={styles.cardHeader}>
      {icon && <div className={styles.cardIconWrapper}>{React.cloneElement(icon, { className: styles.summaryCardIconSvg })}</div>}
      <h4 className={styles.cardTitle}>{title}</h4>
    </div>
    <div className={styles.cardBody}>
      <p className={styles.count}>{count}</p>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  </Link>
);

export default ActivitySummaryCard;