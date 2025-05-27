import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom'; // Якщо використовується для редіректу
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/ManageSettlementSchedulePage.module.css'; // Стилі з попереднього прикладу
import SettlementScheduleFormModal from '../../components/Admin/SettlementScheduleFormModal'; // Переконайтесь, що шлях вірний
import {
    CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon,
    XMarkIcon as CloseModalIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';
import ConfirmationModal from '../../components/common/ConfirmationModal'; // Припустимо, що є такий компонент

const ManageSettlementSchedulePage = () => {
    const { user, isLoading: userIsLoading } = useUser();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => JSON.parse(localStorage.getItem("sidebarOpen") || "true"));
    const [scheduleEntries, setScheduleEntries] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEntry, setCurrentEntry] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Для індикації завантаження форми
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);

    const [faculties, setFaculties] = useState([]);
    const [dormitories, setDormitories] = useState([]);
    //const [allGroups, setAllGroups] = useState([]); // Закоментовано, так як логіка груп у формі спрощена

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    const fetchScheduleEntries = useCallback(async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            // Передаємо isAdminRoute, щоб модель знала, який тип фільтрації застосувати
            const response = await api.get('/admin/settlement-schedule'); 
            setScheduleEntries(response.data || []);
        } catch (err) {
            ToastService.handleApiError(err);
            setError('Не вдалося завантажити розклад.');
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    const fetchSupportingData = useCallback(async () => {
        // Ця функція потрібна для форми, щоб заповнювати випадаючі списки
        try {
            const [facultiesRes, dormitoriesRes/*, groupsRes*/] = await Promise.all([
                api.get('/faculties').catch(() => ({ data: [] })),
                api.get('/admin/dormitories').catch(() => ({ data: [] })), // Або просто /dormitories, якщо доступ публічний
                // api.get('/groups/all-for-admin').catch(() => ({ data: [] })) // Закоментовано
            ]);
            setFaculties(facultiesRes.data || []);
            setDormitories(dormitoriesRes.data || []);
            // setAllGroups(groupsRes.data || []); // Закоментовано
        } catch (err) {
            ToastService.error("Помилка завантаження довідкових даних (факультети/гуртожитки).");
        }
    }, []);

    useEffect(() => {
        if (user && !userIsLoading) {
            fetchScheduleEntries();
            fetchSupportingData();
        }
    }, [user, userIsLoading, fetchScheduleEntries, fetchSupportingData]);


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
            fetchScheduleEntries();
        }
    };

    const handleDeleteEntry = (id) => {
        const entry = scheduleEntries.find(e => e.id === id);
        if (entry) {
            setEntryToDelete(entry);
            setIsConfirmDeleteModalOpen(true);
        }
    };
    
    const confirmDelete = async () => {
        if (!entryToDelete) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/admin/settlement-schedule/${entryToDelete.id}`);
            ToastService.success(`Запис "${entryToDelete.title}" успішно видалено.`);
            setScheduleEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
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
            targetName = entry.faculty_name || `ID: ${entry.target_group_id}`;
        } else if (entry.target_group_type === 'dormitory') {
            targetName = entry.dormitory_name || `ID: ${entry.target_group_id}`;
        } else if (entry.target_group_type === 'course') {
            targetName = `${entry.target_group_id} курс`;
        } else if (entry.target_group_type === 'group') {
             targetName = entry.group_name_for_target || `Група ID: ${entry.target_group_id}`;
        }
        return `${targetTypeToLabel(entry.target_group_type)}: ${targetName}`;
    };

    if (userIsLoading) {
        return <div className={styles.layout}><div className={styles.loading}>Завантаження...</div></div>;
    }
    if (!user || !['admin', 'superadmin', 'faculty_dean_office', 'dorm_manager'].includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }
     if ((user.role === 'faculty_dean_office' && !user.faculty_id) || (user.role === 'dorm_manager' && !user.dormitory_id)) {
        return (
            <div className={styles.layout}>
                <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
                <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                    <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(prev => !prev)} />
                    <main className={styles.pageContainer}>
                        <div className={styles.header}>
                             <h1 className={styles.title}><CalendarDaysIcon className={styles.titleIcon} /> Керування Розкладом Поселення</h1>
                        </div>
                        <div className={styles.contentWrapper}>
                             <p className={styles.errorMessage}>
                                 {user.role === 'faculty_dean_office' ? "Інформація про ваш факультет не визначена." : "Вам не призначено гуртожиток для управління."}
                                 Будь ласка, зверніться до адміністратора системи.
                             </p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(prev => !prev)} />
                <main className={styles.pageContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}><CalendarDaysIcon className={styles.titleIcon} /> Керування Розкладом Поселення</h1>
                        <button onClick={handleOpenModal} className={styles.actionButtonMain} disabled={isSubmitting || isLoadingData}>
                            <PlusIcon className={styles.buttonIcon} /> Створити Запис
                        </button>
                    </div>
                     <div className={styles.contentWrapper}>
                        {isLoadingData ? (
                            <div className={styles.loading}>Завантаження розкладу...</div>
                        ) : error ? (
                            <div className={styles.errorMessage}>{error}</div>
                        ) : scheduleEntries.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                <InformationCircleIcon className={styles.titleIcon}/>
                                <p>Немає записів у розкладі.</p>
                            </div>
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
                                            <th>Автор</th>
                                            <th className={styles.actionsHeader}>Дії</th>
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
                                                <td>{entry.location || '–'}</td>
                                                <td>
                                                    {entry.color_tag && (
                                                        <span className={styles.colorTagDisplay} style={{ backgroundColor: entry.color_tag }}></span>
                                                    )}
                                                    {entry.color_tag || '–'}
                                                </td>
                                                <td>{entry.creator_name || 'N/A'}</td>
                                                <td className={styles.actionsCell}>
                                                    <button onClick={() => handleOpenModal(entry)} title="Редагувати" className={`${styles.actionButton} ${styles.editButton}`} disabled={isSubmitting}>
                                                        <PencilIcon />
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
                    </div>
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
                                    dormitories={dormitories} 
                                    faculties={faculties}
                                    allGroups={allGroups} 
                                />
                            </div>
                        </div>
                    )}
                    {isConfirmDeleteModalOpen && (
                        <ConfirmationModal
                            isOpen={isConfirmDeleteModalOpen}
                            title="Підтвердити Видалення"
                            message={`Ви впевнені, що хочете видалити запис "${entryToDelete?.title}" (ID: ${entryToDelete?.id})?`}
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