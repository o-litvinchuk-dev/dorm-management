import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/ManageSettlementSchedulePage.module.css'; // Assuming styles are in the new location
import SettlementScheduleFormModal from '../../components/Admin/SettlementScheduleFormModal'; // Use the enhanced modal
import { PlusIcon, PencilSquareIcon, TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../../components/common/ConfirmationModal'; // Assuming this component exists for delete confirmation

const ManageSettlementSchedulePage = () => {
    const [scheduleEntries, setScheduleEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const savedState = localStorage.getItem("sidebarOpen");
        return savedState !== null ? JSON.parse(savedState) : true;
    });
    const [faculties, setFaculties] = useState([]);
    const [dormitories, setDormitories] = useState([]);
    const [allGroups, setAllGroups] = useState([]); // For form modal if targeting groups

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    const fetchScheduleEntries = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Admin view should see all entries, filters can be added if needed
            const response = await api.get('/admin/settlement-schedule'); 
            setScheduleEntries(response.data || []);
        } catch (err) {
            ToastService.handleApiError(err);
            setError('Не вдалося завантажити розклад.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSupportingData = useCallback(async () => {
        try {
            const [facultiesRes, dormitoriesRes, groupsRes] = await Promise.all([
                api.get('/faculties').catch(() => ({ data: [] })),
                api.get('/admin/dormitories').catch(() => ({ data: [] })),
                // Consider fetching all groups or groups by faculty if modal needs it dynamically
                api.get('/groups/all-for-admin').catch(() => ({ data: [] })) // Example, assuming such an endpoint exists or is created
            ]);
            setFaculties(facultiesRes.data || []);
            setDormitories(dormitoriesRes.data || []);
            setAllGroups(groupsRes.data || []); // For the form modal
        } catch (err) {
            ToastService.error("Помилка завантаження довідкових даних (факультети/гуртожитки/групи).");
        }
    }, []);

    useEffect(() => {
        fetchScheduleEntries();
        fetchSupportingData();
    }, [fetchScheduleEntries, fetchSupportingData]);

    const handleOpenModal = (entry = null) => {
        setCurrentEntry(entry);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentEntry(null);
    };

    const handleFormSubmitSuccess = (submitting, successful = false) => {
        setIsSubmitting(submitting);
        if (!submitting && successful) {
            handleCloseModal();
            fetchScheduleEntries(); // Refresh data
        }
    };

    const handleDeleteEntry = async (id) => {
        setEntryToDelete(id);
        setIsConfirmDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!entryToDelete) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/admin/settlement-schedule/${entryToDelete}`);
            ToastService.success('Запис успішно видалено.');
            setScheduleEntries(prev => prev.filter(entry => entry.id !== entryToDelete));
        } catch (err) {
            ToastService.handleApiError(err);
        } finally {
            setIsSubmitting(false);
            setIsConfirmDeleteModalOpen(false);
            setEntryToDelete(null);
        }
    };
    
    const targetTypeToLabel = (type) => {
        const map = {
            all: 'Усі', faculty: 'Факультет', dormitory: 'Гуртожиток',
            course: 'Курс', group: 'Група'
        };
        return map[type] || type;
    };

    const getTargetDisplay = (entry) => {
        if (!entry.target_group_type || entry.target_group_type === 'all') return 'Усі';
        let targetName = '';
        if (entry.target_group_type === 'faculty') {
            const faculty = faculties.find(f => f.id === entry.target_group_id);
            targetName = faculty ? faculty.name : `ID: ${entry.target_group_id}`;
        } else if (entry.target_group_type === 'dormitory') {
            const dormitory = dormitories.find(d => d.id === entry.target_group_id);
            targetName = dormitory ? dormitory.name : `ID: ${entry.target_group_id}`;
        } else if (entry.target_group_type === 'course') {
            targetName = `${entry.target_group_id} курс`;
        } else if (entry.target_group_type === 'group') {
            targetName = entry.group_name_for_target || `Група ID: ${entry.target_group_id}`;
        }
        return `${targetTypeToLabel(entry.target_group_type)}: ${targetName}`;
    };


    if (isLoading && scheduleEntries.length === 0) {
        return <div className={styles.loading}>Завантаження розкладу...</div>;
    }
    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.layout}>
             <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
             <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(prev => !prev)} />
                <main className={styles.pageContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}><CalendarDaysIcon className={styles.titleIcon} /> Керування Розкладом Поселення</h1>
                        <button onClick={() => handleOpenModal()} className={styles.actionButtonMain} disabled={isSubmitting || isLoading}>
                            <PlusIcon className={styles.buttonIcon} /> Створити Запис
                        </button>
                    </div>
                    {scheduleEntries.length === 0 && !isLoading ? (
                        <div className={styles.noEntries}>Немає записів у розкладі.</div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Назва</th>
                                        <th>Дати</th>
                                        <th>Цільова група</th>
                                        <th>Локація</th>
                                        <th>Колір</th>
                                        <th>Дії</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheduleEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td>{entry.id}</td>
                                            <td title={entry.title} className={styles.titleCell}>{entry.title}</td>
                                            <td>
                                                {new Date(entry.start_date).toLocaleString('uk-UA', {dateStyle: 'short', timeStyle: 'short'})}
                                                {entry.end_date ? ` - ${new Date(entry.end_date).toLocaleString('uk-UA', {dateStyle: 'short', timeStyle: 'short'})}` : ''}
                                            </td>
                                            <td>{getTargetDisplay(entry)}</td>
                                            <td>{entry.location || '-'}</td>
                                            <td>
                                                {entry.color_tag && (
                                                    <span className={styles.colorTagDisplay} style={{ backgroundColor: entry.color_tag }}></span>
                                                )}
                                                {entry.color_tag || '-'}
                                            </td>
                                            <td className={styles.actionsCell}>
                                                <button onClick={() => handleOpenModal(entry)} title="Редагувати" className={`${styles.actionButton} ${styles.editButton}`} disabled={isSubmitting}>
                                                    <PencilSquareIcon />
                                                </button>
                                                <button onClick={() => handleDeleteEntry(entry.id)} title="Видалити" className={`${styles.actionButton} ${styles.deleteButton}`} disabled={isSubmitting}>
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {isModalOpen && (
                        <div className={styles.modalOverlayGlobal} onClick={handleCloseModal}>
                            <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()}>
                                 <button onClick={handleCloseModal} className={styles.closeButtonIconGlobal} aria-label="Закрити форму">
                                    <CloseModalIcon />
                                </button>
                                <SettlementScheduleFormModal
                                    entry={currentEntry}
                                    onClose={handleCloseModal}
                                    onFormSubmitSuccess={handleFormSubmitSuccess}
                                    isLoadingForm={isSubmitting}
                                    dormitories={dormitories} // Pass dormitories
                                    faculties={faculties}     // Pass faculties
                                    allGroups={allGroups} // Pass all groups (or logic to fetch dynamically)
                                />
                            </div>
                        </div>
                    )}
                    {isConfirmDeleteModalOpen && (
                        <ConfirmationModal
                            isOpen={isConfirmDeleteModalOpen}
                            title="Підтвердити Видалення"
                            message={`Ви впевнені, що хочете видалити цей запис розкладу? ID: ${entryToDelete}`}
                            onConfirm={confirmDelete}
                            onCancel={() => setIsConfirmDeleteModalOpen(false)}
                            confirmButtonText="Видалити"
                            isLoading={isSubmitting}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default ManageSettlementSchedulePage;