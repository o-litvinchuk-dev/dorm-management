import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import GroupForm from "../../components/Dean/GroupForm";
import BatchGroupForm from "../../components/Dean/BatchGroupForm";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import styles from "./styles/GroupsPage.module.css";
import {
    PlusIcon, PencilIcon, TrashIcon, ListBulletIcon, AcademicCapIcon,
    ArrowUpIcon, ArrowDownIcon, XCircleIcon, InformationCircleIcon, XMarkIcon as CloseModalIcon
} from "@heroicons/react/24/outline";
import Pagination from "../../components/Admin/Pagination";

// Компонент таблиці
const GroupsTable = ({
    groups,
    onEdit,
    onDelete,
    sort,
    onSortChange,
    actionLoading
}) => {
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("uk-UA", { year: 'numeric', month: 'short', day: 'numeric' }) : 'Н/Д';

    const columns = [
        { key: "id", label: "ID", sortable: true },
        { key: "name", label: "Назва групи", sortable: true },
        { key: "course", label: "Курс", sortable: true },
        { key: "created_at", label: "Створено", sortable: true },
        { key: "updated_at", label: "Оновлено", sortable: true },
        { key: "actions", label: "Дії", sortable: false, align: 'right' },
    ];

    const handleSort = (key) => {
        if (!onSortChange) return;
        onSortChange(key);
    };

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                onClick={() => col.sortable && handleSort(col.key)}
                                className={`${styles.th} ${col.sortable ? styles.sortableHeader : ''}`}
                                style={{ textAlign: col.align || 'left' }}
                                aria-sort={col.sortable && sort.sortBy === col.key ? (sort.sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                            >
                                <div className={styles.headerContent} style={{ justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                                    {col.label}
                                    {col.sortable && sort.sortBy === col.key && (
                                        sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.id}>
                            <td data-label="ID">{group.id}</td>
                            <td data-label="Назва групи">{group.name}</td>
                            <td data-label="Курс">{group.course}</td>
                            <td data-label="Створено">{formatDate(group.created_at)}</td>
                            <td data-label="Оновлено">{formatDate(group.updated_at)}</td>
                            <td data-label="Дії" className={styles.actionsCell}>
                                <button onClick={() => onEdit(group)} className={`${styles.actionButton} ${styles.editButton}`} title="Редагувати" disabled={actionLoading}>
                                    <PencilIcon />
                                </button>
                                <button onClick={() => onDelete(group.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Видалити" disabled={actionLoading}>
                                    <TrashIcon />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const GroupsManagementPage = () => {
    const { user, isLoading: userIsLoading } = useUser();
    const [allGroups, setAllGroups] = useState([]);
    const [displayedGroups, setDisplayedGroups] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const savedState = localStorage.getItem("sidebarOpen");
        return savedState !== null ? JSON.parse(savedState) : true;
    });
    
    const initialFilters = useMemo(() => ({ searchTerm: "", courseFilter: "" }), []);
    const [filters, setFilters] = useState(initialFilters);
    const [sort, setSort] = useState({ sortBy: "name", sortOrder: "asc" });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    const facultyName = user?.faculty_name || "не визначено";

    const fetchGroups = useCallback(async () => {
        if (!user || !user.faculty_id) {
            setIsLoadingData(false);
            if (user && user.role === 'faculty_dean_office' && !user.faculty_id) {
                 setError("Інформація про ваш факультет не визначена.");
            }
            setAllGroups([]);
            return;
        }
        setIsLoadingData(true);
        setError(null);
        try {
            const response = await api.get(`faculties/${user.faculty_id}/groups`);
            setAllGroups(response.data || []);
        } catch (err) {
            ToastService.handleApiError(err);
            setError("Не вдалося завантажити групи.");
            setAllGroups([]);
        } finally {
            setIsLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    useEffect(() => {
        if (!userIsLoading && user) {
            fetchGroups();
        } else if (!userIsLoading && !user) {
            setIsLoadingData(false);
            setError("Дані користувача не завантажені.");
        }
    }, [userIsLoading, user, fetchGroups]);

    useEffect(() => {
        let filtered = [...allGroups];
        if (filters.searchTerm) {
            filtered = filtered.filter(group =>
                group.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
            );
        }
        if (filters.courseFilter) {
            filtered = filtered.filter(group => group.course === parseInt(filters.courseFilter));
        }

        filtered.sort((a, b) => {
            const valA = a[sort.sortBy];
            const valB = b[sort.sortBy];
            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;
            return sort.sortOrder === 'desc' ? comparison * -1 : comparison;
        });
        
        setPagination(prev => ({ ...prev, total: filtered.length }));
        const offset = (pagination.page - 1) * pagination.limit;
        setDisplayedGroups(filtered.slice(offset, offset + pagination.limit));
    }, [allGroups, filters, sort, pagination.page, pagination.limit]);

    const handleDelete = async (groupId) => {
        const groupToDelete = allGroups.find(g => g.id === groupId);
        if (!groupToDelete) return;

        if (user && user.role === 'faculty_dean_office' && String(groupToDelete.faculty_id) !== String(user.faculty_id)) {
            ToastService.error("Помилка", "Ви не можете видалити групу іншого факультету.");
            return;
        }

        if (window.confirm(`Ви впевнені, що хочете видалити групу "${groupToDelete.name}" (ID: ${groupId})?`)) {
            setIsLoadingData(true);
            try {
                await api.delete(`groups/${groupId}`);
                ToastService.success("Групу видалено");
                fetchGroups();
            } catch (error) {
                ToastService.handleApiError(error);
            } finally {
                setIsLoadingData(false);
            }
        }
    };

    const handleEdit = (group) => {
        if (user && user.role === 'faculty_dean_office' && String(group.faculty_id) !== String(user.faculty_id)) {
            ToastService.error("Помилка", "Ви не можете редагувати групу іншого факультету.");
            return;
        }
        setSelectedGroup(group);
        setIsGroupModalOpen(true);
    };

    const handleAddGroup = () => {
        setSelectedGroup(null);
        setIsGroupModalOpen(true);
    };

    const handleOpenBatchModal = () => {
        setIsBatchModalOpen(true);
    };

    const handleModalClose = () => {
        setIsGroupModalOpen(false);
        setIsBatchModalOpen(false);
        setSelectedGroup(null);
    };

    const handleModalSuccess = () => {
        fetchGroups();
        if (isGroupModalOpen) handleModalClose();
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };
    
    const handleResetFilters = () => {
        setFilters(initialFilters);
        setSort({ sortBy: "name", sortOrder: "asc" });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (key) => {
        setSort(prevSort => ({
            sortBy: key,
            sortOrder: prevSort.sortBy === key && prevSort.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };
    
    const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));
    const handleLimitChange = (newLimit) => setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));

    // Обробник для кліків по оверлею
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleModalClose();
        }
    };

    if (userIsLoading) {
        return <div className={styles.layout}><div className={styles.loading}>Завантаження даних користувача...</div></div>;
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (user.role !== 'faculty_dean_office' && user.role !== 'admin' && user.role !== 'superadmin') {
        return <Navigate to="/unauthorized" replace />;
    }
    if (user.role === 'faculty_dean_office' && !user.faculty_id) {
        return (
            <div className={styles.layout}>
                <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
                <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                    <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(prev => !prev)} />
                    <main className={styles.pageContainer}>
                        <div className={styles.header}>
                            <h1 className={styles.title}>
                                <AcademicCapIcon className={styles.titleIcon}/>
                                Управління групами
                            </h1>
                        </div>
                        <div className={styles.contentWrapper}>
                            <p className={styles.errorMessage}>Інформація про ваш факультет не визначена. Будь ласка, зверніться до адміністратора системи.</p>
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
                        <h1 className={styles.title}>
                            <AcademicCapIcon className={styles.titleIcon}/>
                            {user.role === 'faculty_dean_office' ? `Групи факультету "${facultyName}"` : "Управління групами (Адмін)"}
                        </h1>
                        <div className={styles.headerActions}>
                            <button onClick={handleOpenBatchModal} className={`${styles.actionButtonMain} ${styles.batchButton}`} disabled={isLoadingData}>
                                <ListBulletIcon className={styles.buttonIcon}/> Додати списком
                            </button>
                            <button onClick={handleAddGroup} className={styles.actionButtonMain} disabled={isLoadingData}>
                                <PlusIcon className={styles.buttonIcon}/> Додати групу
                            </button>
                        </div>
                    </div>

                    <div className={styles.contentWrapper}>
                        <div className={styles.filtersPanel}>
                            <input
                                type="text"
                                name="searchTerm"
                                placeholder="Пошук за назвою групи..."
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                                className={styles.inputField}
                                disabled={isLoadingData}
                            />
                            <select
                                name="courseFilter"
                                value={filters.courseFilter}
                                onChange={handleFilterChange}
                                className={styles.inputField}
                                disabled={isLoadingData}
                            >
                                <option value="">Всі курси</option>
                                {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} курс</option>)}
                            </select>
                            <button onClick={handleResetFilters} className={styles.resetFilterButton} disabled={isLoadingData}>
                                <XCircleIcon className={styles.buttonIconSm}/> Скинути
                            </button>
                        </div>

                        {isLoadingData ? (
                            <div className={styles.loading}>Завантаження груп...</div>
                        ) : error ? (
                             <div className={styles.errorMessage}>{error}</div>
                        ) : displayedGroups.length === 0 && (filters.searchTerm || filters.courseFilter) ? (
                            <div className={styles.emptyMessage}>
                                <InformationCircleIcon/>
                                <p>Груп за вашими критеріями не знайдено.</p>
                            </div>
                        ) : allGroups.length === 0 ? (
                             <div className={styles.emptyMessage}>
                                <InformationCircleIcon/>
                                <p>Для факультету "{facultyName}" ще не додано жодної групи.</p>
                            </div>
                        ) : (
                            <GroupsTable
                                groups={displayedGroups}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                sort={sort}
                                onSortChange={handleSort}
                                actionLoading={isLoadingData}
                            />
                        )}
                    </div>
                    {!isLoadingData && !error && allGroups.length > 0 && pagination.total > pagination.limit && (
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
            {/* Модальне вікно для Додавання/Редагування однієї групи */}
            {isGroupModalOpen && (
                <div 
                    className={styles.modalOverlayGlobal} 
                    onClick={handleOverlayClick}
                    role="dialog" 
                    aria-modal="true"
                > 
                    <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()}>
                        <button onClick={handleModalClose} className={styles.closeButtonIconGlobal} aria-label="Закрити форму групи">
                            <CloseModalIcon />
                        </button>
                        <GroupForm
                            group={selectedGroup}
                            onClose={handleModalClose}
                            onSuccess={handleModalSuccess}
                            facultyName={facultyName}
                        />
                    </div>
                </div>
            )}
            {/* Модальне вікно для Пакетного додавання */}
            {isBatchModalOpen && user?.faculty_id && (
                <div 
                    className={styles.modalOverlayGlobal} 
                    onClick={handleOverlayClick}
                    role="dialog" 
                    aria-modal="true"
                >
                    <div className={`${styles.modalContentGlobal} ${styles.batchModalContent}`} onClick={(e) => e.stopPropagation()}>
                        <button onClick={handleModalClose} className={styles.closeButtonIconGlobal} aria-label="Закрити форму пакетного додавання">
                            <CloseModalIcon />
                        </button>
                        <BatchGroupForm
                            onClose={handleModalClose}
                            onSuccess={handleModalSuccess}
                            facultyName={facultyName}
                            facultyId={user.faculty_id}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupsManagementPage;