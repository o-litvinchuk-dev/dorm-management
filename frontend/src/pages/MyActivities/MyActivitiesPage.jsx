import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/MyActivitiesPage.module.css';
import { DocumentTextIcon, BookmarkSquareIcon, InformationCircleIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Pagination from '../../components/Admin/Pagination';
import ApplicationDetailModal from '../../components/Admin/ApplicationDetailModal'; 
import { useUser } from '../../contexts/UserContext';

const accommodationStatusLabels = {
  pending: "Очікує", 
  approved: "Затверджено", 
  rejected: "Відхилено",
  approved_by_faculty: "Затв. деканатом", 
  rejected_by_faculty: "Відх. деканатом",
  approved_by_dorm: "Затв. гуртожитком", 
  rejected_by_dorm: "Відх. гуртожитком",
  settled: "Поселено",
};

const roomReservationStatusLabels = {
  pending_confirmation: "Бронювання: Очікує",
  confirmed: "Бронювання: Підтверджено",
  cancelled_by_user: "Бронювання: Скасовано вами",
  rejected_by_admin: "Бронювання: Відхилено",
  checked_in: "Бронювання: Заселено",
  checked_out: "Бронювання: Виселено",
  expired: "Бронювання: Термін минув"
};

const allStatusLabelsForFilter = {
    ...Object.fromEntries(Object.entries(accommodationStatusLabels).map(([key, value]) => [`acc_${key}`, `Заявка: ${value}`])),
    ...Object.fromEntries(Object.entries(roomReservationStatusLabels).map(([key, value]) => [`res_${key}`, value])),
};

const ActivityCard = ({ activity, onViewDetails }) => {
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const getStatusClass = (status, type) => {
    if (!status) return styles.statusDefault;
    const baseClass = styles.statusBadge;
    const typeSuffix = type === 'room_reservation' ? 'RoomRes' : ''; 

    switch (status.toLowerCase()) {
      case 'pending':
      case 'pending_confirmation':
        return `${baseClass} ${styles[`statusPending${typeSuffix}`] || styles.statusPending}`;
      case 'approved':
      case 'approved_by_faculty':
      case 'approved_by_dorm':
      case 'confirmed':
      case 'checked_in':
        return `${baseClass} ${styles[`statusApproved${typeSuffix}`] || styles.statusApproved}`;
      case 'rejected':
      case 'rejected_by_faculty':
      case 'rejected_by_dorm':
      case 'cancelled_by_user':
      case 'rejected_by_admin':
      case 'expired':
        return `${baseClass} ${styles[`statusRejected${typeSuffix}`] || styles.statusRejected}`;
      case 'settled':
      case 'checked_out':
        return `${baseClass} ${styles[`statusSettled${typeSuffix}`] || styles.statusSettled}`;
      default:
        return `${baseClass} ${styles.statusDefault}`;
    }
  };

  let title = "";
  let details = [];
  let icon = <InformationCircleIcon className={styles.cardIcon} />;
  let currentStatusLabel = "";

  if (activity.type === 'accommodation_application') {
    title = `Заявка на поселення №${activity.id}`;
    icon = <DocumentTextIcon className={styles.cardIcon} />;
    currentStatusLabel = accommodationStatusLabels[activity.status] || activity.status;
    details.push(`Гуртожиток: ${activity.dormitory_name || 'Не вказано'}`);
    details.push(`Період: ${activity.start_date ? formatDate(activity.start_date) : 'N/A'} - ${activity.end_date ? formatDate(activity.end_date) : 'N/A'}`);
  } else if (activity.type === 'room_reservation') {
    title = `Бронювання кімнати №${activity.room_number || activity.room_id}`;
    icon = <BookmarkSquareIcon className={styles.cardIcon} />;
    currentStatusLabel = roomReservationStatusLabels[activity.status] || activity.status;
    details.push(`Гуртожиток: ${activity.dormitory_name || 'Не вказано'}`);
    // Для бронювань дати можуть називатися інакше, адаптуйте за потреби
    details.push(`Період: ${activity.academic_year || 'N/A'}`); 
    if(activity.notes_student) details.push(`Ваш коментар: ${activity.notes_student.substring(0,50)}${activity.notes_student.length > 50 ? '...' : ''}`);
  }

  return (
    <div className={styles.activityCard} onClick={() => onViewDetails(activity)} role="button" tabIndex={0} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onViewDetails(activity)}}>
      <div className={styles.cardHeader}>
        {icon}
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>
      <div className={styles.cardBody}>
        {details.map((detail, index) => <p key={index}>{detail}</p>)}
        <p><strong>Статус:</strong> <span className={getStatusClass(activity.status, activity.type)}>{currentStatusLabel}</span></p>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cardDate}>Створено: {formatDate(activity.created_at)}</span>
        <span className={styles.detailsLink}>Детальніше...</span>
      </div>
    </div>
  );
};


const MyActivitiesPage = () => {
  const { user } = useUser(); 
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'all', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 6, total: 0 }); 
  
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);


  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      let accommodationStatusFilter = '';
      let reservationStatusFilter = '';

      if (filters.status) {
        // Якщо фільтр статусу активний, визначаємо, до якого типу він належить
        if (Object.keys(accommodationStatusLabels).includes(filters.status)) {
            accommodationStatusFilter = filters.status;
        }
        if (Object.keys(roomReservationStatusLabels).includes(filters.status)) {
            reservationStatusFilter = filters.status;
        }
      }
      
      // Параметри для заявок на поселення
      const accommodationParams = {
        page: pagination.page,
        limit: pagination.limit,
        // Передаємо статус тільки якщо він для заявок на поселення або фільтр типу "all"
        status: (filters.type === 'all' || filters.type === 'accommodation_application') && accommodationStatusFilter ? accommodationStatusFilter : ''
      };
      
      // Параметри для бронювань кімнат (припускаємо, що бекенд не підтримує пагінацію для цього)
      const reservationParams = {
        // Передаємо статус тільки якщо він для бронювань або фільтр типу "all"
        status: (filters.type === 'all' || filters.type === 'room_reservation') && reservationStatusFilter ? reservationStatusFilter : ''
      };

      const accommodationPromise = api.get('/secure/my-accommodation-applications', { params: accommodationParams });
      const reservationPromise = api.get('/secure/my-reservations', { params: reservationParams });

      const [accommodationRes, reservationRes] = await Promise.all([
        (filters.type === 'all' || filters.type === 'accommodation_application') ? accommodationPromise : Promise.resolve({ data: { applications: [], total: 0 } }),
        (filters.type === 'all' || filters.type === 'room_reservation') ? reservationPromise : Promise.resolve({ data: [] })
      ]);
      
      const accommodationApps = (accommodationRes.data.applications || []).map(app => ({ ...app, type: 'accommodation_application', sort_date: app.created_at }));
      const roomReservations = (reservationRes.data || []).map(res => ({ ...res, type: 'room_reservation', sort_date: res.created_at }));

      let combinedActivities = [];
      if (filters.type === 'all') {
        combinedActivities = [...accommodationApps, ...roomReservations];
      } else if (filters.type === 'accommodation_application') {
        combinedActivities = accommodationApps;
      } else if (filters.type === 'room_reservation') {
        combinedActivities = roomReservations;
      }
      
      // Фільтрація за статусом на фронтенді, якщо тип "all" і статус вибрано
      if (filters.type === 'all' && filters.status && filters.status !== '') {
          combinedActivities = combinedActivities.filter(act => act.status === filters.status);
      }

      combinedActivities.sort((a, b) => new Date(b.sort_date) - new Date(a.sort_date));
      
      let finalActivities = combinedActivities;
      let totalItemsForPagination = 0;

      if (filters.type === 'all') {
        // Пагінація для "Всі" відбувається на фронтенді після об'єднання
        totalItemsForPagination = combinedActivities.length;
        const offset = (pagination.page - 1) * pagination.limit;
        finalActivities = combinedActivities.slice(offset, offset + pagination.limit);
      } else if (filters.type === 'accommodation_application') {
        // Для заявок використовуємо пагінацію з бекенду
        totalItemsForPagination = accommodationRes.data.total || 0;
        finalActivities = accommodationApps; // Вже прийшли з пагінацією
      } else if (filters.type === 'room_reservation') {
        // Пагінація для бронювань на фронтенді
        totalItemsForPagination = roomReservations.length;
        const offset = (pagination.page - 1) * pagination.limit;
        finalActivities = roomReservations.slice(offset, offset + pagination.limit);
      }
      
      setActivities(finalActivities);
      setPagination(prev => ({ ...prev, total: totalItemsForPagination }));

    } catch (error) {
      ToastService.handleApiError(error);
      setActivities([]);
      setPagination(prev => ({...prev, total: 0}));
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPagination(prev => ({...prev, page: 1})); 
    setFilters(prev => ({...prev, [name]: value}));
  };

  const handlePageChange = (page) => setPagination(prev => ({ ...prev, page }));
  const handleLimitChange = (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }));

  const handleViewDetails = async (activity) => {
    if (activity.type === 'accommodation_application') {
      setIsModalLoading(true);
      try {
        const response = await api.get(`/secure/my-accommodation-applications/${activity.id}`);
        setSelectedActivity(response.data); 
        setIsModalOpen(true);
      } catch (error) {
        ToastService.handleApiError(error);
        setSelectedActivity(activity); 
        setIsModalOpen(true);
      } finally {
        setIsModalLoading(false);
      }
    } else if (activity.type === 'room_reservation') {
      ToastService.info(`Деталі для бронювання #${activity.id} ще не реалізовані.`);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} />
        <div className={styles.pageContainer}>
          <h1 className={styles.pageTitle}>
            <DocumentTextIcon className={styles.titleIcon} />
            Мої Заявки та Бронювання
          </h1>

          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <label htmlFor="typeFilter">Тип активності:</label>
              <select id="typeFilter" name="type" value={filters.type} onChange={handleFilterChange} className={styles.filterSelect}>
                <option value="all">Всі</option>
                <option value="accommodation_application">Заявки на поселення</option>
                <option value="room_reservation">Бронювання кімнат</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="statusFilter">Статус:</label>
              <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange} className={styles.filterSelect}>
                <option value="">Всі статуси</option>
                {Object.entries(allStatusLabelsForFilter).map(([key, label]) => {
                    const actualStatusValue = key.includes('_') ? key.substring(key.indexOf('_') + 1) : key;
                    return <option key={key} value={actualStatusValue}>{label}</option>
                })}
              </select>
            </div>
             <button onClick={() => fetchActivities()} className={styles.filterButtonMobile}>
                <AdjustmentsHorizontalIcon /> Оновити
            </button>
          </div>

          {isLoading ? (
            <div className={styles.loadingSpinner}>Завантаження активностей...</div>
          ) : activities.length === 0 ? (
            <div className={styles.noResultsMessage}>
                <InformationCircleIcon/>
                <p>У вас немає активностей за обраними фільтрами.</p>
            </div>
          ) : (
            <>
            <div className={styles.activitiesGrid}>
                {activities.map(activity => (
                <ActivityCard 
                    key={`${activity.type}-${activity.id}`} 
                    activity={activity} 
                    onViewDetails={handleViewDetails}
                />
                ))}
            </div>
            {pagination.total > pagination.limit && (
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
      {isModalOpen && selectedActivity && selectedActivity.type === 'accommodation_application' && (
        <div className={styles.modalOverlayGlobal} onClick={handleCloseModal} role="dialog" aria-modal="true">
          <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCloseModal}
              className={styles.closeButtonIconGlobal}
              aria-label="Закрити деталі заявки"
            >
              <XMarkIcon />
            </button>
            <ApplicationDetailModal
              application={selectedActivity}
              onClose={handleCloseModal}
              onStatusUpdate={null} 
              onAddComment={null}   
              isModalLoading={isModalLoading} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyActivitiesPage;