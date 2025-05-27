import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import Pagination from '../../components/Admin/Pagination';
import EventFormModal from '../../components/Admin/EventFormModal';
import styles from './styles/ManageEventsPage.module.css';
import {
  CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon,
  ArrowUpIcon, ArrowDownIcon, FunnelIcon, XCircleIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';

const ManageEventsPage = () => {
  const { user, isLoading: userIsLoading } = useUser();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => JSON.parse(localStorage.getItem("sidebarOpen") || "true"));
  
  const [events, setEvents] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialFilters = useMemo(() => ({
    title: "", category: "", dateFrom: "", dateTo: ""
  }), []);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [sort, setSort] = useState({ sortBy: 'start_time', sortOrder: 'desc' });

  // Data for form dropdowns
  const [allDormitories, setDormitories] = useState([]);
  const [allFaculties, setFaculties] = useState([]);
  const [groups, setGroups] = useState([]);

  const fetchRelatedDataForForm = useCallback(async () => {
    try {
      const [dormsRes, facsRes] = await Promise.all([
        api.get('/dormitories'),
        api.get('/faculties'),
      ]);
      setDormitories(dormsRes.data || []);
      setFaculties(facsRes.data || []);
    } catch (err) {
      ToastService.error("Не вдалося завантажити дані для форми подій.");
    }
  }, []);

  const fetchEvents = useCallback(async (page = pagination.page, limit = pagination.limit) => {
    if (!user) return;
    setIsLoadingData(true);
    setError(null);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );
      const params = {
        page,
        limit,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        ...activeFilters
      };
      const response = await api.get("/admin/events", { params });
      setEvents(response.data.events || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        page,
        limit
      }));
    } catch (err) {
      ToastService.handleApiError(err);
      setError("Не вдалося завантажити події.");
      setEvents([]);
      setPagination(prev => ({...prev, total: 0, page: 1}));
    } finally {
      setIsLoadingData(false);
    }
  }, [user, filters, sort, pagination.page, pagination.limit]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    if (user && !userIsLoading) {
      fetchEvents(pagination.page, pagination.limit);
      fetchRelatedDataForForm();
    } else if (!user && !userIsLoading){
      setIsLoadingData(false);
    }
  }, [user, userIsLoading, filters, sort, pagination.page, pagination.limit, fetchEvents, fetchRelatedDataForForm]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (window.confirm(`Ви впевнені, що хочете видалити подію "${eventTitle}" (ID: ${eventId})?`)) {
      setActionLoading(true);
      try {
        await api.delete(`/admin/events/${eventId}`);
        ToastService.success("Подію видалено");
        fetchEvents(1, pagination.limit);
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setActionLoading(false);
      }
    }
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleModalFormSuccess = async (isSubmittingNow, wasSuccessful) => {
    setFormSubmitting(isSubmittingNow);
    if (!isSubmittingNow && wasSuccessful) {
        await fetchEvents(1, pagination.limit);
        handleModalClose();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: value}));
    setPagination(prev => ({...prev, page: 1}));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setSort({ sortBy: 'start_time', sortOrder: 'desc' });
    setPagination(prev => ({...prev, page: 1}));
  };
  
  const handleSortChange = (key) => {
    setSort(prevSort => ({
      sortBy: key,
      sortOrder: prevSort.sortBy === key && prevSort.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
    setPagination(prev => ({...prev, page: 1}));
  };

  const handlePageChange = (newPage) => setPagination(prev => ({...prev, page: newPage}));
  const handleLimitChange = (newLimit) => setPagination(prev => ({...prev, page:1, limit: newLimit}));

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return new Date(dateTimeString).toLocaleString('uk-UA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Недійсна дата';
    }
  };

  const getTargetSummary = (targets) => {
    if (!targets || targets.length === 0) return 'Усі (загальне)';
    if (targets.some(t => t.target_type === 'all_settled')) return 'Усі поселені';

    const summaries = targets.map(t => {
      if (t.target_type === 'faculty') return `Ф: ${allFaculties.find(f => f.id === t.target_id)?.name || t.target_id}`;
      if (t.target_type === 'dormitory') return `Г: ${allDormitories.find(d => d.id === t.target_id)?.name || t.target_id}`;
      if (t.target_type === 'course') return `К: ${t.target_id}`;
      if (t.target_type === 'group') return `Гр: ${t.target_id}`;
      return t.target_type;
    });
    return summaries.join(', ');
  };

  if (userIsLoading) {
    return <div className={styles.layout}><div className={styles.loading}>Завантаження...</div></div>;
  }
  if (!user || !['admin', 'superadmin', 'faculty_dean_office', 'dorm_manager'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const canManageEvent = (event) => {
    if (!user || !event) return false;
    if (user.role === 'superadmin' || user.role === 'admin') return true;
    
    // Check if user is the creator of the event
    if (event.created_by_user_id === user.userId) return true;

    // Specific rules for roles
    if (user.role === 'dorm_manager' && user.dormitory_id) {
        return event.targets?.some(t => t.target_type === 'dormitory' && Number(t.target_id) === user.dormitory_id);
    }
    if (user.role === 'faculty_dean_office' && user.faculty_id) {
        return event.targets?.some(t => 
            (t.target_type === 'faculty' && Number(t.target_id) === user.faculty_id) ||
            (t.target_type === 'course') ||
            (t.target_type === 'group' && allFaculties.find(f => f.id === user.faculty_id)?.groups?.some(g => g.id === Number(t.target_id))) ||
            (t.target_type === 'dormitory' && allFaculties.find(f => f.id === user.faculty_id)?.dormitories?.some(d => d.dormitory_id === Number(t.target_id)))
        );
    }
    return false;
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} />
        <main className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}><CalendarDaysIcon className={styles.titleIcon} /> Керування Подіями</h1>
            <button onClick={handleAddEvent} className={styles.actionButtonMain} disabled={isLoadingData || actionLoading}>
              <PlusIcon className={styles.buttonIcon} /> Створити Подію
            </button>
          </div>
          <div className={styles.contentWrapper}>
            <div className={styles.filtersPanel}>
                <input type="text" name="title" placeholder="Пошук за назвою..." value={filters.title} onChange={handleFilterChange} className={styles.inputField} disabled={isLoadingData}/>
                <input type="text" name="category" placeholder="Категорія..." value={filters.category} onChange={handleFilterChange} className={styles.inputField} disabled={isLoadingData}/>
                <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className={styles.inputField} disabled={isLoadingData}/>
                <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className={styles.inputField} disabled={isLoadingData}/>
                <button onClick={handleResetFilters} className={styles.resetFilterButton} disabled={isLoadingData}>
                    <XCircleIcon className={styles.buttonIconSm}/> Скинути
                </button>
            </div>

            {isLoadingData ? (
              <div className={styles.loading}>Завантаження подій...</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : events.length === 0 ? (
              <div className={styles.emptyMessage}>
                <InformationCircleIcon/>
                <p>Подій за вашими критеріями не знайдено, або їх ще не створено.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
  <th onClick={() => handleSortChange('title')}>
    Назва {sort.sortBy === 'title' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />)}
  </th>
  <th onClick={() => handleSortChange('start_time')}>
    Початок {sort.sortBy === 'start_time' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />)}
  </th>
  <th onClick={() => handleSortChange('end_time')}>
    Кінець {sort.sortBy === 'end_time' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />)}
  </th>
  <th onClick={() => handleSortChange('category')}>
    Категорія {sort.sortBy === 'category' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />)}
  </th>
  <th className={styles.targetHeader}>Цільова аудиторія</th>
  <th>Автор</th>
  <th className={styles.actionsHeader}>Дії</th>
</tr>

                  </thead>
                  <tbody>
                    {events.map(event => (
                      <tr key={event.id}>
                        <td>{event.id}</td>
                        <td title={event.title} className={styles.titleCell}>{event.title}</td>
                        <td>{formatDateTime(event.start_time)}</td>
                        <td>{formatDateTime(event.end_time)}</td>
                        <td>{event.category || 'N/A'}</td>
                        <td title={getTargetSummary(event.targets)} className={styles.targetCell}>{getTargetSummary(event.targets)}</td>
                        <td>{event.creator_name || 'N/A'}</td>
                        <td className={styles.actionsCell}>
                          <button onClick={() => handleEditEvent(event)} className={`${styles.actionButton} ${styles.editButton}`} title="Редагувати" disabled={actionLoading || !canManageEvent(event)}>
                            <PencilIcon/>
                          </button>
                          <button onClick={() => handleDeleteEvent(event.id, event.title)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Видалити" disabled={actionLoading || !canManageEvent(event)}>
                            <TrashIcon/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {!isLoadingData && !error && events.length > 0 && pagination.total > 0 && pagination.total > pagination.limit && (
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
      {isModalOpen && (
        <div className={styles.modalOverlayGlobal} onClick={() => {if(!formSubmitting) handleModalClose()}} role="dialog" aria-modal="true">
          <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px'}}>
            <button
              onClick={handleModalClose}
              className={styles.closeButtonIconGlobal}
              aria-label="Закрити форму події"
              disabled={formSubmitting}
            >
              <XCircleIcon />
            </button>
            <EventFormModal
              event={editingEvent}
              onClose={handleModalClose}
              onSuccess={handleModalFormSuccess}
              isLoadingForm={formSubmitting}
              dormitories={allDormitories}
              faculties={allFaculties}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEventsPage;