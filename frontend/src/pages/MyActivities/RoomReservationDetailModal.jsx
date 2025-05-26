// src/pages/MyActivities/RoomReservationDetailModal.jsx
import React from 'react';
import styles from './styles/MyActivitiesPage.module.css'; // Можна використовувати спільні стилі або створити окремі
import { BookmarkSquareIcon, BuildingOffice2Icon, CalendarDaysIcon, ChatBubbleLeftEllipsisIcon, ClockIcon } from '@heroicons/react/24/outline';

const roomReservationStatusLabels = {
  pending_confirmation: "Очікує підтвердження",
  confirmed: "Підтверджено",
  cancelled_by_user: "Скасовано вами",
  rejected_by_admin: "Відхилено адміністрацією",
  checked_in: "Заселено",
  checked_out: "Виселено",
  expired: "Термін минув"
};

const getStatusClass = (status) => {
    if (!status) return styles.statusDefault;
    const baseClass = styles.statusBadgeOnModal || styles.statusBadge; // Адаптуйте, якщо класи відрізняються
    switch (status.toLowerCase()) {
      case 'pending_confirmation': return `${baseClass} ${styles.statusPendingRoomRes || styles.statusPending}`;
      case 'confirmed':
      case 'checked_in':
        return `${baseClass} ${styles.statusConfirmedRoomRes || styles.statusApproved}`;
      case 'cancelled_by_user':
      case 'rejected_by_admin':
      case 'expired':
      case 'checked_out':
        return `${baseClass} ${styles.statusCancelledRoomRes || styles.statusRejected}`;
      default: return `${baseClass} ${styles.statusDefault}`;
    }
  };


const RoomReservationDetailModal = ({ reservation, onClose, isModalLoading }) => {
  if (!reservation) return null;

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  return (
    <div className={styles.modalInnerContentScrollable}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>
          <BookmarkSquareIcon className={styles.modalTitleIcon} />
          Деталі Бронювання #{reservation.id}
        </h2>
      </div>
      <div className={styles.modalBody}>
        {isModalLoading ? (
          <p className={styles.loadingMessage}>Завантаження деталей...</p>
        ) : (
          <>
            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}><BuildingOffice2Icon /> Інформація про кімнату</h3>
              <p><strong>Гуртожиток:</strong> {reservation.dormitory_name || 'N/A'}</p>
              <p><strong>Кімната №:</strong> {reservation.room_number || reservation.room_id}</p>
            </div>
            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}><CalendarDaysIcon /> Деталі бронювання</h3>
              <p><strong>Навчальний рік:</strong> {reservation.academic_year || 'N/A'}</p>
              <p><strong>Статус:</strong> <span className={getStatusClass(reservation.status)}>{roomReservationStatusLabels[reservation.status] || reservation.status}</span></p>
              <p><ClockIcon className={styles.inlineIconXs}/> <strong>Створено:</strong> {formatDate(reservation.created_at)}</p>
              <p><ClockIcon className={styles.inlineIconXs}/> <strong>Оновлено:</strong> {formatDate(reservation.updated_at)}</p>
            </div>
            {(reservation.notes_student || reservation.notes_admin) && (
              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}><ChatBubbleLeftEllipsisIcon /> Нотатки</h3>
                {reservation.notes_student && <p><strong>Ваші нотатки:</strong> {reservation.notes_student}</p>}
                {reservation.notes_admin && <p><strong>Нотатки адміністрації:</strong> {reservation.notes_admin}</p>}
              </div>
            )}
          </>
        )}
      </div>
      <div className={styles.modalFooter}>
        <button onClick={onClose} className={`${styles.commonButton} ${styles.closeModalButtonWide}`}>
          Закрити
        </button>
      </div>
    </div>
  );
};

export default RoomReservationDetailModal;