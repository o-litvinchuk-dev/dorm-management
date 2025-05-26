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
    EyeIcon, // Додано для кнопки "Детальніше"
    PencilSquareIcon, // Додано для кнопки "Редагувати"
    XMarkIcon as CloseModalIcon // Для кнопки закриття модалки
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

const ReservationRow = ({ reservation, onOpenModal }) => {
  const { user } = useUser();
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('uk-UA', {day: '2-digit', month: '2-digit', year: 'numeric'}) : 'Н/Д';

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
          <span>{reservation.user_name || reservation.user_email}</span>
      </td>
      <td data-label="Кімната">
            <span>{reservation.dormitory_name} - Кімн. {reservation.room_number}</span>
      </td>
      <td data-label="Статус">
        <span className={`${styles.statusBadge} ${getStatusClass(reservation.status)}`}>
          {statusLabels[reservation.status] || reservation.status}
        </span>
      </td>
      <td data-label="Створено">{formatDate(reservation.created_at)}</td>
      <td data-label="Примітки Адм." className={styles.notesCell} title={reservation.notes_admin || 'Немає приміток'}>
        {reservation.notes_admin ? (
                <span>{reservation.notes_admin.substring(0, 30)}{reservation.notes_admin.length > 30 ? '...' : ''}</span>
        ) : '-'}
      </td>
      <td data-label="Дії" className={styles.actionsCell}>
        {canManageThisReservation && (
            <button
                onClick={() => onOpenModal(reservation, reservation.status)}
                className={styles.actionButton} // Використовуємо спільний клас для кнопки
                title="Деталі / Редагувати"
            >
                Деталі
            </button>
        )}
      </td>
    </tr>
  );
};

const AdminNotesModal = ({ reservation, initialStatusToSet, onClose, onConfirm, isUpdating }) => { // Додано isUpdating
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
    if (newStatus !== reservation.status && newStatus !== "") {
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

     const getStatusClassModal = (currentStatus) => {
        const baseModalClass = styles.statusBadgeOnModal;
        switch (currentStatus) {
            case 'pending_confirmation': return `${baseModalClass} ${styles.statusPending}`;
            case 'confirmed':
            case 'checked_in': return `${baseModalClass} ${styles.statusConfirmed}`;
            case 'cancelled_by_user':
            case 'rejected_by_admin':
            case 'expired':
            case 'checked_out': return `${baseModalClass} ${styles.statusCancelled}`;
            default: return baseModalClass;
        }
    };

    return (
        // Overlay та modalContent тепер мають класи з AdminAccommodationManagementPage
        <div className={styles.modalOverlayGlobal} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className={styles.closeButtonIconGlobal} // Клас для кнопки закриття
                    aria-label="Закрити деталі бронювання"
                >
                    <CloseModalIcon />
                </button>
                <div className={styles.modalInnerContent}> {/* Додаткова обгортка як в ApplicationDetailModal */}
                    <div className={styles.modalHeader}>
                        <h2 className={styles.modalTitle}>{title}</h2>
                    </div>
                    <div className={styles.modalBody}>
                        <p><strong>Студент:</strong> {reservation.user_name || reservation.user_email}</p>
                        <p><strong>Кімната:</strong> {reservation.dormitory_name} - Кімн. {reservation.room_number}</p>
                        <p><strong>Поточний статус:</strong>
                            <span className={getStatusClassModal(reservation.status)}>
                                {statusLabels[reservation.status]}
                            </span>
                        </p>
                        <hr className={styles.modalSeparator} />

                        <form onSubmit={handleSubmit}>
                            {availableStatusOptions.length > 0 && (
                                <div className={styles.formSection}>
                                    <label htmlFor="newStatusModal" className={styles.inputLabel}>Змінити статус на:</label>
                                    <select
                                        id="newStatusModal"
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className={styles.selectField}
                                        disabled={isUpdating}
                                    >
                                        <option value={reservation.status}>Залишити поточний ({statusLabels[reservation.status]})</option>
                                        {availableStatusOptions.map(opt => (
                                            opt.value !== reservation.status &&
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className={styles.formSection}>
                                <label htmlFor="adminNotes" className={styles.inputLabel}>
                                    {isRejecting ? "Причина відхилення (обов'язково):" : "Коментар адміністратора:"}
                                </label>
                                <textarea
                                    id="adminNotes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={isRejecting ? "Вкажіть причину відхилення..." : "Додаткова інформація, примітки..."}
                                    rows="3"
                                    className={styles.textareaField}
                                    disabled={isUpdating}
                                />
                            </div>
                             <div className={styles.modalFooter}> {/* Використовуємо modalFooter для кнопок */}
                                <button type="button" onClick={onClose} className={`${styles.commonButton} ${styles.cancelButton}`} disabled={isUpdating}>
                                     Скасувати
                                </button>
                                <button type="submit" className={`${styles.commonButton} ${styles.submitButton}`} disabled={isUpdating}>
                                    {isUpdating ? 'Оновлення...' : (newStatus !== reservation.status && newStatus !== "" ? `Змінити на "${statusLabels[newStatus]}" та зберегти` : 'Зберегти примітки')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
  const [error, setError] = useState(null); // Додано стан помилки
  const [filters, setFilters] = useState({ status: '', dormitory_id: '', search: '', sortBy: 'created_at', sortOrder: 'desc' }); // Додано sortBy, sortOrder
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [dormitories, setDormitories] = useState([]);
  const [editingReservation, setEditingReservation] = useState(null);
  const [statusToUpdateViaModal, setStatusToUpdateViaModal] = useState('');
  const [isModalLoading, setIsModalLoading] = useState(false); // Для модального вікна

  const { user } = useUser();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchDormitories = useCallback(async () => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
        try {
          const response = await api.get('/dormitories');
          setDormitories(response.data || []);
        } catch (err) { // Змінено error на err
          ToastService.handleApiError(err);
        }
    }
  }, [user]);

  const fetchAdminReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Скидання помилки перед запитом
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search || '',
        status: filters.status || '',
        dormitory_id: filters.dormitory_id || null,
      };
      if (user?.role === 'dorm_manager' && user.dormitory_id) {
        params.dormitory_id = user.dormitory_id;
      }

      const response = await api.get('/admin/room-reservations', { params });
      setReservations(response.data.reservations || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0, page: response.data.page || 1, limit: response.data.limit || 10 }));
    } catch (err) { // Змінено error на err
      ToastService.handleApiError(err);
      setError("Не вдалося завантажити бронювання. Спробуйте оновити сторінку.");
      setReservations([]);
      setPagination(prev => ({ ...prev, total: 0}));
    } finally {
      setIsLoading(false);
    }
  }, [user, filters, pagination.page, pagination.limit]); // Залежність від filters цілком, а не окремих полів

  useEffect(() => {
    if(user){
        fetchAdminReservations();
        fetchDormitories();
    }
  }, [fetchAdminReservations, user, fetchDormitories]);


  const handleConfirmUpdateWithNotes = async (reservationId, newStatus, notes, originalReservation) => {
    setIsModalLoading(true); // Встановлюємо завантаження для модалки
    try {
        const statusToSend = (newStatus === "" || newStatus === originalReservation.status) ? originalReservation.status : newStatus;
        await api.put(`/admin/room-reservations/${reservationId}/status`, { status: statusToSend, notes_admin: notes });
        let toastMessage = `Примітки для бронювання #${reservationId} оновлено.`;
        if (statusToSend !== originalReservation.status) {
            toastMessage = `Бронювання #${reservationId}: статус змінено на "${statusLabels[statusToSend] || statusToSend}"${notes ? ' з коментарем' : ''}.`;
        }
        ToastService.success(toastMessage);
        fetchAdminReservations();
        setEditingReservation(null);
    } catch (err) { // Змінено error на err
        ToastService.handleApiError(err);
    } finally {
        setIsModalLoading(false); // Знімаємо завантаження для модалки
    }
  };

  const handleOpenModalForEdit = (reservation) => { // statusToSet не потрібен, беремо з reservation
    setEditingReservation(reservation);
    setStatusToUpdateViaModal(reservation.status); // Початковий статус для модалки
  };

  const handleFilterChange = (newFilters) => { // Змінено для відповідності Filters.jsx
    setFilters(prev => ({...prev, ...newFilters}));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (newSortBy, newSortOrder) => { // Змінено для відповідності ApplicationsTable.jsx
    setFilters(prev => ({
      ...prev,
      sortBy: newSortBy,
      sortOrder: newSortOrder
    }));
  };

  const handlePageChange = (page) => setPagination(prev => ({ ...prev, page }));
  const handleLimitChange = (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }));

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar
            isSidebarExpanded={isSidebarExpanded}
            onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)} // Додано onMenuToggle
        />
        <main className={styles.pageContainer}> {/* Використовуємо main та pageContainer */}
          <div className={styles.header}> {/* Додано header */}
            <h1 className={styles.title}>
              <ListBulletIcon className={styles.titleIcon} />
              Керування Бронюваннями Кімнат
            </h1>
          </div>
          <div className={styles.contentWrapper}> {/* Додано contentWrapper */}
            {/* Фільтри (можна винести в окремий компонент, аналогічно Filters.jsx) */}
            <div className={styles.filtersPanel}>
                <input
                    type="text"
                    name="search"
                    placeholder="Пошук (ID, ПІБ, Email, кімната)"
                    value={filters.search}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                    className={styles.inputField}
                />
                <select
                    name="status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange({ status: e.target.value })}
                    className={styles.inputField}
                >
                    <option value="">Всі статуси</option>
                    {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <select
                        name="dormitory_id"
                        value={filters.dormitory_id}
                        onChange={(e) => handleFilterChange({ dormitory_id: e.target.value })}
                        className={styles.inputField}
                    >
                        <option value="">Всі гуртожитки</option>
                        {dormitories.map(dorm => (
                            <option key={dorm.id} value={dorm.id}>{dorm.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {isLoading ? (
              <div className={styles.loading}>Завантаження...</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : reservations.length === 0 && !isLoading ? (
              <p className={styles.emptyMessage}>Бронювань за обраними фільтрами відсутні.</p>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSortChange('id', filters.sortOrder === 'asc' && filters.sortBy === 'id' ? 'desc' : 'asc')}>
                                    ID {filters.sortBy === 'id' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSortChange('user_name', filters.sortOrder === 'asc' && filters.sortBy === 'user_name' ? 'desc' : 'asc')}>
                                    Студент {filters.sortBy === 'user_name' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSortChange('room_number', filters.sortOrder === 'asc' && filters.sortBy === 'room_number' ? 'desc' : 'asc')}>
                                    Кімната {filters.sortBy === 'room_number' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSortChange('status', filters.sortOrder === 'asc' && filters.sortBy === 'status' ? 'desc' : 'asc')}>
                                    Статус {filters.sortBy === 'status' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSortChange('created_at', filters.sortOrder === 'asc' && filters.sortBy === 'created_at' ? 'desc' : 'asc')}>
                                    Створено {filters.sortBy === 'created_at' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </th>
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
            )}
          </div>
          {!isLoading && !error && reservations.length > 0 && pagination.total > pagination.limit && ( // Пагінація
            <div className={styles.paginationWrapper}>
              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </div>
          )}
        </main>
      </div>
      {editingReservation && (
        <AdminNotesModal
            reservation={editingReservation}
            initialStatusToSet={statusToUpdateViaModal}
            onClose={() => setEditingReservation(null)}
            onConfirm={handleConfirmUpdateWithNotes}
            isUpdating={isModalLoading} // Передаємо стан завантаження модалки
        />
      )}
    </div>
  );
};

export default AdminRoomReservationsPage;