import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { ToastService } from '../../../utils/toastConfig';
import Sidebar from '../../../components/UI/Sidebar/Sidebar';
import Navbar from '../../../components/UI/Navbar/Navbar';
import styles from './styles/MyReservationsPage.module.css';
import { BookmarkSquareIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const ReservationCard = ({ reservation, onCancel }) => {
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  
  const statusLabels = {
    pending_confirmation: "Очікує підтвердження",
    confirmed: "Підтверджено",
    cancelled_by_user: "Скасовано вами",
    rejected_by_admin: "Відхилено адміністрацією",
    checked_in: "Заселено",
    checked_out: "Виселено",
    expired: "Термін минув"
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending_confirmation': return styles.statusPending;
      case 'confirmed':
      case 'checked_in':
        return styles.statusConfirmed;
      case 'cancelled_by_user':
      case 'rejected_by_admin':
      case 'expired':
      case 'checked_out':
        return styles.statusCancelled;
      default: return '';
    }
  };

  return (
    <div className={styles.reservationCard}>
      <div className={styles.cardHeader}>
        <h3>Бронювання #{reservation.id} - Кімната {reservation.room_number}</h3>
        <span className={`${styles.statusBadge} ${getStatusClass(reservation.status)}`}>
          {statusLabels[reservation.status] || reservation.status}
        </span>
      </div>
      <p><strong>Гуртожиток:</strong> {reservation.dormitory_name}</p>
      <p><strong>Дати:</strong> {formatDate(reservation.reservation_start_date)} - {formatDate(reservation.reservation_end_date)}</p>
      {reservation.notes_student && <p><strong>Ваші нотатки:</strong> {reservation.notes_student}</p>}
      {reservation.notes_admin && <p><strong>Нотатки адміністрації:</strong> {reservation.notes_admin}</p>}
      <p className={styles.createdDate}>Створено: {formatDate(reservation.created_at)}</p>
      
      {(reservation.status === 'pending_confirmation' || reservation.status === 'confirmed') && (
        <button onClick={() => onCancel(reservation.id)} className={styles.cancelButton}>
          <TrashIcon /> Скасувати бронювання
        </button>
      )}
    </div>
  );
};

const MyReservationsPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/secure/my-reservations');
      setReservations(response.data || []);
    } catch (error) {
      ToastService.handleApiError(error);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCancelReservation = async (reservationId) => {
    if (window.confirm('Ви впевнені, що хочете скасувати це бронювання?')) {
      try {
        await api.delete(`/secure/my-reservations/${reservationId}`);
        ToastService.success("Бронювання скасовано.");
        fetchReservations(); // Refresh the list
      } catch (error) {
        ToastService.handleApiError(error);
      }
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} />
        <div className={styles.pageContainer}>
          <h1 className={styles.pageTitle}>
            <BookmarkSquareIcon className={styles.titleIcon} />
            Мої Бронювання Кімнат
          </h1>

          {isLoading ? (
            <div className={styles.loadingSpinner}>Завантаження ваших бронювань...</div>
          ) : reservations.length === 0 ? (
            <div className={styles.noReservations}>
              <InformationCircleIcon />
              <p>У вас ще немає активних або минулих бронювань кімнат.</p>
              <button onClick={() => navigate('/services/rooms/search')} className={styles.findRoomButton}>
                Знайти та забронювати кімнату
              </button>
            </div>
          ) : (
            <div className={styles.reservationsList}>
              {reservations.map(res => (
                <ReservationCard key={res.id} reservation={res} onCancel={handleCancelReservation} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReservationsPage;