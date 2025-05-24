import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/AdminRoomReservationsPage.module.css';
import { ListBulletIcon, CheckCircleIcon, XCircleIcon, PencilIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';
import Pagination from '../../components/Admin/Pagination';

const statusLabels = {
  pending_confirmation: "Очікує підтвердження",
  confirmed: "Підтверджено",
  cancelled_by_user: "Скасовано студентом",
  rejected_by_admin: "Відхилено",
  checked_in: "Заселено",
  checked_out: "Виселено",
  expired: "Термін минув"
};

const ReservationRow = ({ reservation, onUpdateStatus, onEditNotes }) => {
  const { user } = useUser();
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('uk-UA') : 'N/A';
  
  const canConfirmOrReject = (user?.role === 'superadmin' || user?.role === 'admin' || 
    (user?.role === 'dorm_manager' && String(user.dormitory_id) === String(reservation.room_dormitory_id)));

  return (
    <tr>
      <td>{reservation.id}</td>
      <td>{reservation.user_name || reservation.user_email}</td>
      <td>{reservation.dormitory_name} - Кімн. {reservation.room_number}</td>
      <td>{formatDate(reservation.reservation_start_date)}</td>
      <td>{formatDate(reservation.reservation_end_date)}</td>
      <td>
        <span className={`${styles.statusBadge} ${styles[`status${reservation.status.replace(/_/g, '')}`]}`}>
          {statusLabels[reservation.status] || reservation.status}
        </span>
      </td>
      <td>{formatDate(reservation.created_at)}</td>
      <td className={styles.notesCell} title={reservation.notes_admin || ''}>
        {reservation.notes_admin ? `${reservation.notes_admin.substring(0, 30)}${reservation.notes_admin.length > 30 ? '...' : ''}` : '-'}
      </td>
      <td className={styles.actionsCell}>
        {reservation.status === 'pending_confirmation' && canConfirmOrReject && (
          <>
            <button 
              onClick={() => onUpdateStatus(reservation.id, 'confirmed', reservation)}
              className={`${styles.actionButton} ${styles.confirmButton}`}
              title="Підтвердити"
            >
              <CheckCircleIcon />
            </button>
            <button 
              onClick={() => onEditNotes(reservation, 'rejected_by_admin')}
              className={`${styles.actionButton} ${styles.rejectButton}`}
              title="Відхилити з коментарем"
            >
              <XCircleIcon />
            </button>
          </>
        )}
         {reservation.status === 'confirmed' && canConfirmOrReject && (
          <button 
            onClick={() => onUpdateStatus(reservation.id, 'checked_in', reservation)}
            className={`${styles.actionButton} ${styles.checkInButton}`}
            title="Заселити"
          >
            Заселити
          </button>
        )}
        {reservation.status === 'checked_in' && canConfirmOrReject && (
          <button 
            onClick={() => onUpdateStatus(reservation.id, 'checked_out', reservation)}
            className={`${styles.actionButton} ${styles.checkOutButton}`}
            title="Виселити"
          >
            Виселити
          </button>
        )}
        {canConfirmOrReject && (
           <button 
            onClick={() => onEditNotes(reservation, reservation.status)} 
            className={`${styles.actionButton} ${styles.editNotesButton}`}
            title="Редагувати примітки"
          >
            <PencilIcon/>
          </button>
        )}
      </td>
    </tr>
  );
};

const AdminNotesModal = ({ reservation, currentStatusToSet, onClose, onSubmit }) => {
    const [notes, setNotes] = useState(reservation.notes_admin || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(reservation.id, currentStatusToSet, notes, reservation);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>Примітки для бронювання #{reservation.id}</h3>
                <p>Студент: {reservation.user_name || reservation.user_email}</p>
                <p>Кімната: {reservation.dormitory_name} - {reservation.room_number}</p>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Введіть примітки або причину відхилення..."
                        rows="4"
                        className={styles.modalTextarea}
                    />
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.modalButtonCancel}>Скасувати</button>
                        <button type="submit" className={styles.modalButtonSubmit}>
                            {currentStatusToSet === 'rejected_by_admin' ? 'Відхилити та Зберегти' : 'Зберегти примітки'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminRoomReservationsPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', dormitory_id: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [dormitories, setDormitories] = useState([]);
  const [editingReservation, setEditingReservation] = useState(null);
  const [statusToSetOnEdit, setStatusToSetOnEdit] = useState('');


  const { user } = useUser();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchDormitories = useCallback(async () => {
    try {
      const response = await api.get('/dormitories');
      setDormitories(response.data || []);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  }, []);

  const fetchAdminReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'created_at', 
        sortOrder: 'desc',
        ...filters,
      };
      // If dorm manager, override dormitory_id filter
      if (user?.role === 'dorm_manager' && user.dormitory_id) {
        params.dormitory_id = user.dormitory_id;
      }
      if(params.search === null || params.search === undefined) params.search = '';


      const response = await api.get('/admin/room-reservations', { params });
      setReservations(response.data.reservations || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      ToastService.handleApiError(error);
      setReservations([]);
      setPagination(prev => ({ ...prev, total: 0}));
    } finally {
      setIsLoading(false);
    }
  }, [user, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if(user){ // Ensure user context is loaded
        fetchAdminReservations();
        if(user.role === 'admin' || user.role === 'superadmin'){
             fetchDormitories();
        }
    }
  }, [fetchAdminReservations, user, fetchDormitories]);


  const handleUpdateStatus = async (reservationId, newStatus, reservation, notes = null) => {
    try {
        await api.put(`/admin/room-reservations/${reservationId}/status`, { status: newStatus, notes_admin: notes });
        ToastService.success(`Статус бронювання #${reservationId} оновлено.`);
        fetchAdminReservations(); // Refresh data
        if(editingReservation) setEditingReservation(null); // Close modal if open
    } catch (error) {
        ToastService.handleApiError(error);
    }
  };
  
  const handleEditNotes = (reservation, statusToSetAfterEdit) => {
    setEditingReservation(reservation);
    setStatusToSetOnEdit(statusToSetAfterEdit || reservation.status); 
  };


  const handleFilterChange = (e) => {
    setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on new filter
    // fetchAdminReservations will be called by useEffect due to filters/pagination change
  };

  const handlePageChange = (page) => setPagination(prev => ({ ...prev, page }));
  const handleLimitChange = (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }));


  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} />
        <div className={styles.pageContainer}>
          <h1 className={styles.pageTitle}>
            <ListBulletIcon className={styles.titleIcon} />
            Керування Бронюваннями Кімнат
          </h1>

          <form onSubmit={applyFilters} className={styles.filterForm}>
            <input 
                type="text" 
                name="search" 
                placeholder="Пошук (ім'я, email, № кімнати, ID)" 
                value={filters.search || ''}
                onChange={handleFilterChange}
                className={styles.filterInput}
            />
            <select name="status" value={filters.status} onChange={handleFilterChange} className={styles.filterSelect}>
                <option value="">Всі статуси</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
            </select>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <select name="dormitory_id" value={filters.dormitory_id} onChange={handleFilterChange} className={styles.filterSelect}>
                    <option value="">Всі гуртожитки</option>
                    {dormitories.map(dorm => (
                        <option key={dorm.id} value={dorm.id}>{dorm.name}</option>
                    ))}
                </select>
            )}
            <button type="submit" className={styles.filterButton}>Фільтрувати</button>
          </form>


          {isLoading ? (
            <div className={styles.loadingSpinner}>Завантаження бронювань...</div>
          ) : reservations.length === 0 ? (
            <div className={styles.noResultsMessage}>
                <InformationCircleIcon/>
                <p>Наразі немає бронювань для відображення за вашими фільтрами.</p>
            </div>
          ) : (
            <>
            <div className={styles.tableWrapper}>
                <table className={styles.reservationsTable}>
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Студент</th>
                    <th>Кімната</th>
                    <th>Заїзд</th>
                    <th>Виїзд</th>
                    <th>Статус</th>
                    <th>Створено</th>
                    <th>Примітки</th>
                    <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.map(res => (
                    <ReservationRow 
                        key={res.id} 
                        reservation={res} 
                        onUpdateStatus={handleUpdateStatus}
                        onEditNotes={handleEditNotes}
                    />
                    ))}
                </tbody>
                </table>
            </div>
            {pagination.total > 0 && pagination.total > pagination.limit && (
                <Pagination 
                    page={pagination.page}
                    limit={pagination.limit}
                    total={pagination.total}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                />
            )}
            </>
          )}
        </div>
      </div>
      {editingReservation && (
        <AdminNotesModal
            reservation={editingReservation}
            currentStatusToSet={statusToSetOnEdit}
            onClose={() => setEditingReservation(null)}
            onSubmit={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default AdminRoomReservationsPage;