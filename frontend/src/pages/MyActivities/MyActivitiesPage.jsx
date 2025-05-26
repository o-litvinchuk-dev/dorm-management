import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/MyActivitiesPage.module.css';
import {
  DocumentTextIcon,
  BookmarkSquareIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon as CloseModalIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  TagIcon,
  BuildingOffice2Icon, // <<< ADDED THIS IMPORT
} from '@heroicons/react/24/outline'; // Ensure it's from outline or solid as needed
import Pagination from '../../components/Admin/Pagination';
import ApplicationDetailModal from '../../components/Admin/ApplicationDetailModal';
import RoomReservationDetailModal from './RoomReservationDetailModal';
import SettlementAgreementDetailModal from './SettlementAgreementDetailModal';
import { useUser } from '../../contexts/UserContext';

const accommodationStatusLabels = {
  pending: "Очікує", approved: "Затверджено", rejected: "Відхилено",
  approved_by_faculty: "Затв. деканатом", rejected_by_faculty: "Відх. деканатом",
  approved_by_dorm: "Затв. гуртожитком", rejected_by_dorm: "Відх. гуртожитком",
  settled: "Поселено",
};
const roomReservationStatusLabels = {
  pending_confirmation: "Бронювання: Очікує", confirmed: "Бронювання: Підтверджено",
  cancelled_by_user: "Бронювання: Скасовано вами", rejected_by_admin: "Бронювання: Відхилено",
  checked_in: "Бронювання: Заселено", checked_out: "Бронювання: Виселено",
  expired: "Бронювання: Термін минув"
};
const settlementAgreementStatusLabels = {
  pending_review: "Договір: На розгляді", approved: "Договір: Затверджено",
  rejected: "Договір: Відхилено", archived: "Договір:Архівовано"
};

const allStatusLabelsForFilter = {
  ...Object.fromEntries(Object.entries(accommodationStatusLabels).map(([key, value]) => [`acc_${key}`, `Заявка: ${value}`])),
  ...Object.fromEntries(Object.entries(roomReservationStatusLabels).map(([key, value]) => [`res_${key}`, value])),
  ...Object.fromEntries(Object.entries(settlementAgreementStatusLabels).map(([key, value]) => [`agr_${key}`, value])),
};

const ActivityCard = ({ activity, onViewDetails }) => {
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('uk-UA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
  
  const getStatusDetails = (status, type) => {
    let label = status;
    let styleClass = styles.statusDefault;
    let typeSuffix = '';

    if (type === 'accommodation_application') {
      label = accommodationStatusLabels[status] || status;
    } else if (type === 'room_reservation') {
      label = roomReservationStatusLabels[status] || status;
      typeSuffix = 'RoomRes';
    } else if (type === 'settlement_agreement') {
      label = settlementAgreementStatusLabels[status] || status;
      typeSuffix = 'Agreement';
    }

    switch (status?.toLowerCase()) {
      case 'pending': case 'pending_confirmation': case 'pending_review':
        styleClass = `${styles.statusBadge} ${styles[`statusPending${typeSuffix}`] || styles.statusPending}`; break;
      case 'approved': case 'approved_by_faculty': case 'approved_by_dorm': case 'confirmed': case 'checked_in':
        styleClass = `${styles.statusBadge} ${styles[`statusApproved${typeSuffix}`] || styles.statusApproved}`; break;
      case 'rejected': case 'rejected_by_faculty': case 'rejected_by_dorm': case 'cancelled_by_user': case 'rejected_by_admin': case 'expired': case 'archived':
        styleClass = `${styles.statusBadge} ${styles[`statusRejected${typeSuffix}`] || styles.statusRejected}`; break;
      case 'settled': case 'checked_out':
        styleClass = `${styles.statusBadge} ${styles[`statusSettled${typeSuffix}`] || styles.statusSettled}`; break;
      default: styleClass = `${styles.statusBadge} ${styles.statusDefault}`;
    }
    return { label, styleClass };
  };

  let title = "";
  let details = [];
  let icon = <InformationCircleIcon className={styles.cardIcon} />;
  const { label: currentStatusLabel, styleClass: currentStatusStyle } = getStatusDetails(activity.status, activity.type);

  if (activity.type === 'accommodation_application') {
    title = `Заявка на поселення №${activity.id}`;
    icon = <DocumentTextIcon className={styles.cardIcon} />;
    details.push(<span><BuildingOffice2Icon className={styles.detailIcon}/>Гуртожиток: <strong>{activity.dormitory_name || 'Не вказано'}</strong></span>);
    details.push(<span><CalendarDaysIcon className={styles.detailIcon}/>Термін: {activity.start_date ? formatDate(activity.start_date).split(',')[0] : 'N/A'} - {activity.end_date ? formatDate(activity.end_date).split(',')[0] : 'N/A'}</span>);
  } else if (activity.type === 'room_reservation') {
    title = `Бронювання кімнати №${activity.room_number || activity.room_id}`;
    icon = <BookmarkSquareIcon className={styles.cardIcon} />;
    details.push(<span><BuildingOffice2Icon className={styles.detailIcon}/>Гуртожиток: <strong>{activity.dormitory_name || 'Не вказано'}</strong></span>);
    details.push(<span><CalendarDaysIcon className={styles.detailIcon}/>Навчальний рік: <strong>{activity.academic_year || 'N/A'}</strong></span>);
  } else if (activity.type === 'settlement_agreement') {
    title = `Договір на поселення №${activity.id}`;
    icon = <ClipboardDocumentListIcon className={styles.cardIcon} />;
    details.push(<span><BuildingOffice2Icon className={styles.detailIcon}/>Гуртожиток: <strong>{activity.dormitory_name_from_dormitories_table || `ID: ${activity.dorm_number}` || 'Не вказано'}</strong></span>);
    details.push(<span><TagIcon className={styles.detailIcon}/>Кімната: <strong>{activity.room_number || 'Не вказано'}</strong></span>);
    details.push(<span><CalendarDaysIcon className={styles.detailIcon}/>Дата договору: <strong>{activity.contract_date ? formatDate(activity.contract_date).split(',')[0] : 'N/A'}</strong></span>);
  }

  return (
    <div className={styles.activityCard} onClick={() => onViewDetails(activity)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onViewDetails(activity); }}>
      <div className={styles.cardHeader}>
        {icon}
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>
      <div className={styles.cardBody}>
        {details.map((detail, index) => <p key={index} className={styles.cardDetailItem}>{detail}</p>)}
        <p className={styles.cardStatusItem}>
          <strong>Статус:</strong> <span className={currentStatusStyle}>{currentStatusLabel}</span>
        </p>
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
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0 }); // Changed limit to 9 for 3x3 grid
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusFilterValue = filters.status;
      const isAccFilter = filters.type === 'all' || filters.type === 'accommodation_application';
      const isResFilter = filters.type === 'all' || filters.type === 'room_reservation';
      const isAgrFilter = filters.type === 'all' || filters.type === 'settlement_agreement';

      const currentPaginationForApi = { page: pagination.page, limit: pagination.limit };
      const MAX_ITEMS_PER_TYPE_FOR_ALL_VIEW = 100;


      const accommodationParams = {
        page: (filters.type === 'accommodation_application') ? currentPaginationForApi.page : 1,
        limit: (filters.type === 'accommodation_application') ? currentPaginationForApi.limit : MAX_ITEMS_PER_TYPE_FOR_ALL_VIEW,
      };
      if (isAccFilter && statusFilterValue && Object.keys(accommodationStatusLabels).includes(statusFilterValue)) {
        accommodationParams.status = statusFilterValue;
      }
      
      const reservationParams = {
        // No explicit pagination for reservations in this view yet, backend might paginate or return all
      };
      if (isResFilter && statusFilterValue && Object.keys(roomReservationStatusLabels).includes(statusFilterValue)) {
        reservationParams.status = statusFilterValue; // Assuming backend supports status filter
      }

      const agreementParams = {
        page: (filters.type === 'settlement_agreement') ? currentPaginationForApi.page : 1,
        limit: (filters.type === 'settlement_agreement') ? currentPaginationForApi.limit : MAX_ITEMS_PER_TYPE_FOR_ALL_VIEW,
      };
      if (isAgrFilter && statusFilterValue && Object.keys(settlementAgreementStatusLabels).includes(statusFilterValue)) {
        agreementParams.status = statusFilterValue;
      }

      const promises = [];
      if (isAccFilter) promises.push(api.get('/secure/my-accommodation-applications', { params: accommodationParams }));
      else promises.push(Promise.resolve({ data: { applications: [], total: 0 } }));
      
      if (isResFilter) promises.push(api.get('/secure/my-reservations', { params: reservationParams }));
      else promises.push(Promise.resolve({ data: [] }));

      if (isAgrFilter) promises.push(api.get('/secure/my-settlement-agreements', { params: agreementParams }));
      else promises.push(Promise.resolve({ data: { agreements: [], total: 0 } }));

      const results = await Promise.allSettled(promises);

      const accommodationData = results[0].status === 'fulfilled' ? results[0].value.data : { applications: [], total: 0 };
      const reservationData = results[1].status === 'fulfilled' ? (Array.isArray(results[1].value.data) ? results[1].value.data : []) : [];
      const agreementData = results[2].status === 'fulfilled' ? results[2].value.data : { agreements: [], total: 0 };

      if (results[0].status === 'rejected') console.error("Failed to fetch accommodation applications:", results[0].reason);
      if (results[1].status === 'rejected') console.error("Failed to fetch room reservations:", results[1].reason);
      if (results[2].status === 'rejected') console.error("Failed to fetch settlement agreements:", results[2].reason);

      const accommodationApps = (accommodationData.applications || []).map(app => ({ ...app, type: 'accommodation_application', sort_date: app.created_at }));
      const roomReservations = reservationData.map(res => ({ ...res, type: 'room_reservation', sort_date: res.created_at }));
      const settlementAgreements = (agreementData.agreements || []).map(agr => ({ ...agr, type: 'settlement_agreement', sort_date: agr.created_at }));

      let combinedActivities = [];
      let totalItemsForPagination = 0;

      if (filters.type === 'all') {
        combinedActivities = [...accommodationApps, ...roomReservations, ...settlementAgreements];
        if (filters.status) {
          combinedActivities = combinedActivities.filter(act => act.status === filters.status);
        }
        combinedActivities.sort((a, b) => new Date(b.sort_date) - new Date(a.sort_date));
        totalItemsForPagination = combinedActivities.length;
        const offset = (currentPaginationForApi.page - 1) * currentPaginationForApi.limit;
        setActivities(combinedActivities.slice(offset, offset + currentPaginationForApi.limit));
        setPagination(prev => ({ ...prev, total: totalItemsForPagination }));
      } else if (filters.type === 'accommodation_application') {
        setActivities(accommodationApps);
        setPagination(prev => ({ ...prev, total: accommodationData.total || accommodationApps.length}));
      } else if (filters.type === 'room_reservation') {
        combinedActivities = roomReservations;
        if (filters.status) {
          combinedActivities = combinedActivities.filter(act => act.status === filters.status);
        }
        combinedActivities.sort((a, b) => new Date(b.sort_date) - new Date(a.sort_date));
        totalItemsForPagination = combinedActivities.length;
        const offset = (currentPaginationForApi.page - 1) * currentPaginationForApi.limit;
        setActivities(combinedActivities.slice(offset, offset + currentPaginationForApi.limit));
        setPagination(prev => ({ ...prev, total: totalItemsForPagination }));
      } else if (filters.type === 'settlement_agreement') {
        setActivities(settlementAgreements);
        setPagination(prev => ({ ...prev, total: agreementData.total || settlementAgreements.length}));
      }

    } catch (error) {
      ToastService.handleApiError(error);
      setActivities([]);
      setPagination(prev => ({...prev, total: 0}));
    } finally {
      setIsLoading(false);
    }
  }, [filters.type, filters.status, pagination.page, pagination.limit]); // Removed pagination from deps

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]); // fetchActivities itself changes when its deps change

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPagination(prev => ({...prev, page: 1})); // Reset to page 1 on filter change
    setFilters(prev => ({...prev, [name]: value}));
  };

  const handlePageChange = (page) => setPagination(prev => ({ ...prev, page }));
  const handleLimitChange = (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }));

  const handleViewDetails = async (activity) => {
    setIsModalLoading(true);
    try {
      let response;
      let endpointExists = true;
      if (activity.type === 'accommodation_application') {
        response = await api.get(`/secure/my-accommodation-applications/${activity.id}`);
      } else if (activity.type === 'room_reservation') {
        response = { data: activity }; // Assuming room reservation list already has all details needed for modal
                                      // Or implement: response = await api.get(`/secure/my-reservations/${activity.id}`);
      } else if (activity.type === 'settlement_agreement') {
        response = await api.get(`/secure/my-settlement-agreements/${activity.id}`);
      }
      setSelectedActivity({...response.data, type: activity.type, _detailEndpointExists: endpointExists });
      setIsModalOpen(true);
    } catch (error) {
      ToastService.handleApiError(error);
      setSelectedActivity({...activity, _detailEndpointExists: false});
      setIsModalOpen(true);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedActivity(null);
  };
  
  const renderModalContent = () => {
    if (!selectedActivity) return null;
    if (selectedActivity.type === 'accommodation_application') {
      return (
        <ApplicationDetailModal // This modal is designed for Admin view, might need a simpler student version
          application={selectedActivity}
          onClose={handleCloseModal}
          onStatusUpdate={null} // Students typically can't update status directly here
          onAddComment={null}   // Students typically don't add admin comments
          isModalLoading={isModalLoading}
        />
      );
    } else if (selectedActivity.type === 'room_reservation') {
      return (
        <RoomReservationDetailModal
          reservation={selectedActivity}
          onClose={handleCloseModal}
          isModalLoading={isModalLoading}
        />
      );
    } else if (selectedActivity.type === 'settlement_agreement') {
      return (
        <SettlementAgreementDetailModal
          agreement={selectedActivity}
          onClose={handleCloseModal}
          isModalLoading={isModalLoading}
          isDetailLimited={!selectedActivity._detailEndpointExists}
        />
      );
    }
    return null;
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} />
        <div className={styles.pageContainer}>
          <h1 className={styles.pageTitle}>
            <DocumentTextIcon className={styles.titleIcon} />
            Мої Активності
          </h1>
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <label htmlFor="typeFilter">Тип активності:</label>
              <select id="typeFilter" name="type" value={filters.type} onChange={handleFilterChange} className={styles.filterSelect}>
                <option value="all">Всі</option>
                <option value="accommodation_application">Заявки на поселення</option>
                <option value="room_reservation">Бронювання кімнат</option>
                <option value="settlement_agreement">Договори на поселення</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="statusFilter">Статус:</label>
              <select id="statusFilter" name="status" value={filters.status} onChange={handleFilterChange} className={styles.filterSelect}>
                <option value="">Всі статуси</option>
                {Object.entries(allStatusLabelsForFilter)
                  .filter(([key]) => {
                    if (filters.type === 'all') return true;
                    if (filters.type === 'accommodation_application' && key.startsWith('acc_')) return true;
                    if (filters.type === 'room_reservation' && key.startsWith('res_')) return true;
                    if (filters.type === 'settlement_agreement' && key.startsWith('agr_')) return true;
                    return false;
                  })
                  .map(([key, label]) => {
                    const actualStatusValue = key.substring(key.indexOf('_') + 1);
                    return <option key={key} value={actualStatusValue}>{label}</option>;
                  })}
              </select>
            </div>
            <button onClick={() => fetchActivities()} className={styles.filterButtonMobile} aria-label="Оновити список активностей">
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

      {isModalOpen && selectedActivity && (
        <div className={styles.modalOverlayGlobal} onClick={handleCloseModal} role="dialog" aria-modal="true">
          <div className={`${styles.modalContentGlobal} ${selectedActivity.type === 'settlement_agreement' ? styles.agreementModalContentSizing : ''}`} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={handleCloseModal} 
              className={styles.closeButtonIconGlobal}
              aria-label="Закрити деталі"
            >
              <CloseModalIcon />
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyActivitiesPage;