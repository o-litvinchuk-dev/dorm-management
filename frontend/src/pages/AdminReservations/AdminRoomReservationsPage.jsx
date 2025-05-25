import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/AdminRoomReservationsPage.module.css';
import { 
    ListBulletIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    InformationCircleIcon,
    // Іконки, що більше не використовуються в таблиці, можна прибрати, якщо вони не потрібні деінде
    // UserCircleIcon, 
    // BuildingOffice2Icon,
    // ChatBubbleLeftEllipsisIcon 
} from '@heroicons/react/24/outline';
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

// --- ReservationRow Component ---
const ReservationRow = ({ reservation, onOpenModal }) => {
  const { user } = useUser();
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('uk-UA', {day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A';
  
  const canManageThisReservation = (user?.role === 'superadmin' || user?.role === 'admin' || 
    (user?.role === 'dorm_manager' && String(user.dormitory_id) === String(reservation.room_dormitory_id)));

  const getStatusClass = (status) => {
    if (!status) return styles.statusDefault;
    const baseClass = styles.statusBadge;
    switch (status.toLowerCase()) {
        case 'pending_confirmation': return `${baseClass} ${styles.statusPending}`;
        case 'confirmed':
        case 'checked_in':
             return `${baseClass} ${styles.statusConfirmed}`;
        case 'cancelled_by_user':
        case 'rejected_by_admin':
        case 'expired':
        case 'checked_out':
            return `${baseClass} ${styles.statusCancelled}`;
        default: return `${baseClass} ${styles.statusDefault}`;
    }
  };

  return (
    <tr className={styles.reservationRow}>
      <td data-label="ID">{reservation.id}</td>
      <td data-label="Студент">
        {/* <div className={styles.cellWithIcon}> */}
          {/* <UserCircleIcon className={styles.tableIcon} /> */}
          <span>{reservation.user_name || reservation.user_email}</span>
        {/* </div> */}
      </td>
      <td data-label="Кімната">
         {/* <div className={styles.cellWithIcon}> */}
            {/* <BuildingOffice2Icon className={styles.tableIcon} /> */}
            <span>{reservation.dormitory_name} - Кімн. {reservation.room_number}</span>
        {/* </div> */}
      </td>
      <td data-label="Статус">
        <span className={`${styles.statusBadge} ${getStatusClass(reservation.status)}`}>
          {statusLabels[reservation.status] || reservation.status}
        </span>
      </td>
      <td data-label="Створено">{formatDate(reservation.created_at)}</td>
      <td data-label="Примітки Адм." className={styles.notesCell} title={reservation.notes_admin || 'Немає приміток'}>
        {reservation.notes_admin ? (
            // <div className={styles.cellWithIcon}>
                // <ChatBubbleLeftEllipsisIcon className={`${styles.tableIcon} ${styles.notesIcon}`} />
                <span>{reservation.notes_admin.substring(0, 30)}{reservation.notes_admin.length > 30 ? '...' : ''}</span>
            // </div>
        ) : '-'}
      </td>
      <td data-label="Дії" className={styles.actionsCell}>
        {canManageThisReservation && (
            <button 
                onClick={() => onOpenModal(reservation, reservation.status)} 
                className={`${styles.actionButtonText}`} // Новий або змінений клас для текстової кнопки
                title="Переглянути / Змінити"
            >
                Детальніше
            </button>
        )}
      </td>
    </tr>
  );
};

// --- AdminNotesModal Component ---
const AdminNotesModal = ({ reservation, initialStatusToSet, onClose, onConfirm }) => {
    const [notes, setNotes] = useState(reservation.notes_admin || '');
    const [newStatus, setNewStatus] = useState(initialStatusToSet); 
    const { user } = useUser(); 

    const isRejecting = newStatus === 'rejected_by_admin';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRejecting && !notes.trim()) {
            ToastService.error("При відхиленні бронювання коментар є обов'язковим.");
            return;
        }
        onConfirm(reservation.id, newStatus, notes, reservation); 
    };
    
    let title = `Бронювання #${reservation.id}`;
    if (newStatus !== reservation.status && newStatus !== "") { // Показуємо зміну тільки якщо статус дійсно змінюється
        title = `Зміна статусу на "${statusLabels[newStatus] || newStatus}" для бронювання #${reservation.id}`;
    } else {
        title = `Деталі бронювання #${reservation.id}`;
    }


    const statusOptionsConfig = {
        admin: [
          { value: "confirmed", label: "Підтвердити" },
          { value: "rejected_by_admin", label: "Відхилити" }, 
          { value: "checked_in", label: "Заселити" },
          { value: "checked_out", label: "Виселити" },
        ],
        superadmin: [],
        dorm_manager: [
          { value: "confirmed", label: "Підтвердити" },
          { value: "rejected_by_admin", label: "Відхилити" },
          { value: "checked_in", label: "Заселити" },
          { value: "checked_out", label: "Виселити" },
        ],
      };
    statusOptionsConfig.superadmin = [...statusOptionsConfig.admin];
    
    let availableStatusOptions = (statusOptionsConfig[user?.role] || []);
    
    if (reservation.status === 'pending_confirmation') {
        availableStatusOptions = availableStatusOptions.filter(opt => ['confirmed', 'rejected_by_admin'].includes(opt.value));
    } else if (reservation.status === 'confirmed') {
        availableStatusOptions = availableStatusOptions.filter(opt => ['checked_in', 'rejected_by_admin'].includes(opt.value));
    } else if (reservation.status === 'checked_in') {
        availableStatusOptions = availableStatusOptions.filter(opt => ['checked_out'].includes(opt.value));
    } else { 
        availableStatusOptions = [];
    }


    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>{title}</h3>
                <p><strong>Студент:</strong> {reservation.user_name || reservation.user_email}</p>
                <p><strong>Кімната:</strong> {reservation.dormitory_name} - Кімн. {reservation.room_number}</p>
                <p><strong>Поточний статус:</strong> <span className={`${styles.statusBadgeOnModal} ${styles[`status${reservation.status.replace(/_/g, '')}`]}`}>{statusLabels[reservation.status]}</span></p>
                {/* Дати бронювання видалено з модального вікна */}
                
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    {availableStatusOptions.length > 0 && (
                        <div className={styles.modalFormGroup}>
                            <label htmlFor="newStatusModal" className={styles.modalLabel}>Змінити статус на:</label>
                            <select 
                                id="newStatusModal"
                                value={newStatus} 
                                onChange={(e) => setNewStatus(e.target.value)}
                                className={styles.modalSelect}
                            >
                                {/* Дозволяємо залишити поточний, якщо мета - лише додати коментар */}
                                <option value={reservation.status}>Залишити поточний ({statusLabels[reservation.status]})</option>
                                {availableStatusOptions.map(opt => (
                                    opt.value !== reservation.status && // Не показуємо поточний ще раз, якщо він вже є
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.modalFormGroup}>
                        <label htmlFor="adminNotes" className={styles.modalLabel}>
                            {isRejecting ? "Причина відхилення (обов'язково):" : "Коментар адміністратора:"}
                        </label>
                        <textarea
                            id="adminNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={isRejecting ? "Вкажіть причину відхилення..." : "Додаткова інформація, примітки..."}
                            rows="3"
                            className={styles.modalTextarea}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={`${styles.modalButton} ${styles.modalButtonCancel}`}>
                            <XCircleIcon /> Скасувати
                        </button>
                        <button type="submit" className={`${styles.modalButton} ${styles.modalButtonSubmit}`}>
                            <CheckCircleIcon /> 
                            {newStatus !== reservation.status && newStatus !== "" ? `Змінити на "${statusLabels[newStatus]}" та зберегти` : 'Зберегти примітки'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- AdminRoomReservationsPage Component ---
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
  const [statusToUpdateViaModal, setStatusToUpdateViaModal] = useState('');

  const { user } = useUser();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchDormitories = useCallback(async () => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
        try {
          const response = await api.get('/dormitories');
          setDormitories(response.data || []);
        } catch (error) {
          ToastService.handleApiError(error);
        }
    }
  }, [user]);

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
    if(user){ 
        fetchAdminReservations();
        fetchDormitories();
    }
  }, [fetchAdminReservations, user, fetchDormitories]);


  const handleConfirmUpdateWithNotes = async (reservationId, newStatus, notes, originalReservation) => {
    try {
        // Якщо статус не було змінено в модалці (користувач вибрав "Залишити поточний" або newStatus пустий)
        // але нотатки змінились, то надсилаємо поточний статус.
        const statusToSend = (newStatus === "" || newStatus === originalReservation.status) ? originalReservation.status : newStatus;
        
        await api.put(`/admin/room-reservations/${reservationId}/status`, { status: statusToSend, notes_admin: notes });
        
        let toastMessage = `Примітки для бронювання #${reservationId} оновлено.`;
        if (statusToSend !== originalReservation.status) {
            toastMessage = `Бронювання #${reservationId}: статус змінено на "${statusLabels[statusToSend] || statusToSend}"${notes ? ' з коментарем' : ''}.`;
        }
        ToastService.success(toastMessage);
        fetchAdminReservations(); 
        setEditingReservation(null); 
    } catch (error) {
        ToastService.handleApiError(error);
    }
  };
  
  const handleOpenModalForEdit = (reservation, statusToSet) => {
    setEditingReservation(reservation);
    // Передаємо поточний статус бронювання як початковий для модалки,
    // користувач зможе його змінити або залишити таким самим
    setStatusToUpdateViaModal(reservation.status); 
  };


  const handleFilterChange = (e) => {
    setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); 
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
                    <th>Статус</th>
                    <th>Створено</th>
                    <th>Примітки Адм.</th>
                    <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.map(res => (
                    <ReservationRow 
                        key={res.id} 
                        reservation={res} 
                        onOpenModal={handleOpenModalForEdit} 
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
            initialStatusToSet={statusToUpdateViaModal} 
            onClose={() => setEditingReservation(null)}
            onConfirm={handleConfirmUpdateWithNotes} 
        />
      )}
    </div>
  );
};

export default AdminRoomReservationsPage;