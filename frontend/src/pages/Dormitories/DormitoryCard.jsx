import React from 'react';
import styles from './styles/DormitoriesPage.module.css'; // Reuse styles or create specific card styles
import { MapPinIcon, UsersIcon, UserCircleIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

const DormitoryCard = ({ dormitory, onViewOnMap, onShowDetails }) => {
  return (
    <div className={styles.dormitoryCard}>
      <div className={styles.cardImagePlaceholder}>
        <BuildingOffice2Icon />
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{dormitory.name}</h3>
        {dormitory.address && (
          <p className={styles.cardDetailItem}>
            <MapPinIcon className={styles.detailIcon} />
            {dormitory.address}
          </p>
        )}
        {dormitory.capacity && (
          <p className={styles.cardDetailItem}>
            <UsersIcon className={styles.detailIcon} />
            Місткість: {dormitory.capacity} осіб
          </p>
        )}
        {dormitory.manager_name && (
          <p className={styles.cardDetailItem}>
            <UserCircleIcon className={styles.detailIcon} />
            Комендант: {dormitory.manager_name}
          </p>
        )}
      </div>
      <div className={styles.cardActions}>
        {dormitory.address && ( // Only show "View on map" if address exists
          <button onClick={() => onViewOnMap(dormitory)} className={styles.cardButton}>
            На карті
          </button>
        )}
        {/* <button onClick={() => onShowDetails(dormitory)} className={styles.cardButton}>
          Детальніше
        </button> */}
      </div>
    </div>
  );
};

export default DormitoryCard;