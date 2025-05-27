import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles/QuickActionLink.module.css'; // Ensure this path is correct

const QuickActionLink = ({ to, label, icon, isPrimary }) => (
  <Link to={to} className={`${styles.quickAction} ${isPrimary ? styles.isPrimary : ''}`}>
    {icon && <span className={styles.actionIcon}>{React.cloneElement(icon, { className: styles.quickActionIconSvg })}</span>}
    <span className={styles.actionLabel}>{label}</span>
  </Link>
);

export default QuickActionLink;