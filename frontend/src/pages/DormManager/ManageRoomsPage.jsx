import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/ManageRoomsPage.module.css';
import RoomListTable from '../../components/DormManager/RoomListTable';
import RoomFormModal from '../../components/DormManager/RoomFormModal';
import {
    BuildingLibraryIcon, PlusIcon, InformationCircleIcon, XMarkIcon as CloseModalIcon, FunnelIcon,
    PencilSquareIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ArrowUpIcon, ArrowDownIcon,
    AdjustmentsHorizontalIcon, EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';
import { Navigate } from 'react-router-dom';
import Pagination from '../../components/Admin/Pagination';

// Функція debounce
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

const ManageRoomsPage = () => {
    const { user, isLoading: userIsLoading } = useUser();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [batchActionLoading, setBatchActionLoading] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState(new Set());

    const initialFilters = useMemo(() => ({
        number: '', floor: '', gender_type: '', is_reservable: '',
        capacity_min: '', capacity_max: '',
    }), []);

    const [inputFilters, setInputFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [sort, setSort] = useState({ sortBy: 'number', sortOrder: 'asc' });
    const [showFilters, setShowFilters] = useState(false);

    const isInitialLoad = useRef(true);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    const fetchRooms = useCallback(async (filtersToUse, sortToUse, pageToUse, limitToUse) => {
        if (!user || !user.dormitory_id) {
            setIsLoading(false);
            if (user && user.role === 'dorm_manager' && !user.dormitory_id) {
                 setError("Гуртожиток не призначено цьому користувачу.");
            }
            setRooms([]);
            setPagination(prev => ({ ...prev, total: 0, page: 1 }));
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const dormitoryIdToFetch = user.dormitory_id;
            const activeFilters = Object.fromEntries(
                Object.entries(filtersToUse).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
            );
            const queryParams = {
                page: pageToUse,
                limit: limitToUse,
                sortBy: sortToUse.sortBy,
                sortOrder: sortToUse.sortOrder,
                ...activeFilters,
            };

            const response = await api.get(`/dormitories/${dormitoryIdToFetch}/rooms`, { params: queryParams });
            setRooms(response.data.rooms || response.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.total || response.data?.length || 0,
                page: pageToUse,
                limit: limitToUse,
            }));
        } catch (err) {
            ToastService.handleApiError(err);
            setError("Не вдалося завантажити кімнати. Спробуйте оновити сторінку.");
            setRooms([]);
            setPagination(prev => ({ ...prev, total: 0, page: 1 }));
        } finally {
            setIsLoading(false);
            if (pageToUse === 1) {
                setSelectedRooms(new Set());
            }
        }
    }, [user]);

    useEffect(() => {
        if (user && !userIsLoading) {
            fetchRooms(appliedFilters, sort, pagination.page, pagination.limit);
        } else if (!user && !userIsLoading) {
            setIsLoading(false);
            setError("Дані користувача не завантажені.");
        }
    }, [user, userIsLoading, appliedFilters, sort, pagination.page, pagination.limit, fetchRooms]);
    
    const debouncedApplyFilters = useCallback(
        debounce((newInputFilters) => {
            setPagination(prev => ({ ...prev, page: 1 }));
            setAppliedFilters(newInputFilters);
        }, 700),
    []);

    const handleFilterInputChange = (e) => {
        const { name, value } = e.target;
        setInputFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            debouncedApplyFilters(newFilters);
            return newFilters;
        });
    };
    
    const handleResetFilters = () => {
        setInputFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setSort({ sortBy: 'number', sortOrder: 'asc' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSortChange = (newSortBy) => {
        setSort(prevSort => {
            const newSortOrder = prevSort.sortBy === newSortBy && prevSort.sortOrder === 'asc' ? 'desc' : 'asc';
            return { sortBy: newSortBy, sortOrder: newSortOrder };
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };
    const handleLimitChange = (newLimit) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    };

    const handleAddRoom = () => {
        setEditingRoom(null);
        setIsModalOpen(true);
    };

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleDeleteRoom = async (roomId) => {
        if (window.confirm('Ви впевнені, що хочете видалити цю кімнату?')) {
            setActionLoading(true);
            try {
                await api.delete(`/rooms/${roomId}`);
                ToastService.success('Кімнату успішно видалено');
                fetchRooms(pagination.page, pagination.limit, sort, appliedFilters);
            } catch (err) {
                ToastService.handleApiError(err);
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingRoom(null);
    };

    const handleModalSuccess = () => {
        fetchRooms(pagination.page, pagination.limit, sort, appliedFilters);
        handleModalClose();
    };
    
    const handleSelectRoom = (roomId) => {
        setSelectedRooms(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(roomId)) newSelected.delete(roomId);
            else newSelected.add(roomId);
            return newSelected;
        });
    };

    const handleSelectAllRooms = (e) => {
        if (e.target.checked) setSelectedRooms(new Set(rooms.map(room => room.id)));
        else setSelectedRooms(new Set());
    };

    const handleBatchAction = async (actionType, params = {}) => {
        if (selectedRooms.size === 0) {
            ToastService.info("Спочатку виберіть кімнати для пакетної дії.");
            return;
        }
        const roomIds = Array.from(selectedRooms);
        setBatchActionLoading(true);
        let operationDescription = "";

        try {
            let response;
            if (actionType === "setReservable") {
                operationDescription = `Статус "Доступна для резервування: ${params.reservable ? 'Так' : 'Ні'}"`;
                response = await api.post('/rooms/batch-update-reservable', {
                    roomIds,
                    is_reservable: params.reservable
                });
            } else if (actionType === "deleteSelected") {
                if (!window.confirm(`Ви впевнені, що хочете видалити ${roomIds.length} вибраних кімнат?`)) {
                    setBatchActionLoading(false); return;
                }
                operationDescription = "Видалення";
                response = await api.post('/rooms/batch-delete', { roomIds });
            }

            const successCount = response?.data?.successCount || 0;
            const totalAttempted = roomIds.length;
            
            if (successCount > 0) {
                ToastService.success(`${operationDescription} успішно виконано для ${successCount} з ${totalAttempted} кімнат.`);
            }
            if (response?.data?.errors && response.data.errors.length > 0) {
                 ToastService.warning(`Не вдалося виконати операцію для ${response.data.errors.length} кімнат. Деталі в консолі.`);
                 console.warn("Batch action errors:", response.data.errors);
            } else if (successCount < totalAttempted && successCount > 0) { 
                ToastService.warning(`Не вдалося виконати операцію для ${totalAttempted - successCount} кімнат.`);
            } else if (successCount === 0 && totalAttempted > 0 && (!response?.data?.errors || response.data.errors.length === 0)) {
                ToastService.error(`Не вдалося виконати операцію для жодної з вибраних кімнат.`);
            }
            
            fetchRooms(1, pagination.limit, sort, appliedFilters);
        } catch (err) {
            ToastService.handleApiError(err);
        } finally {
            setBatchActionLoading(false);
        }
    };

    const genderTypeLabels = { any: 'Будь-яка', male: 'Чоловіча', female: 'Жіноча', mixed: 'Змішана' };
    const currentGenderOccupancyLabels = { empty: 'Порожня', male: 'Чоловіки', female: 'Жінки' };

    if (userIsLoading && isInitialLoad.current) {
        return <div className={styles.layout}><div className={styles.loading}>Завантаження даних користувача...</div></div>;
    }
    if (!user || !(user.role === 'dorm_manager' || user.role === 'admin' || user.role === 'superadmin')) {
        return <Navigate to="/unauthorized" replace />;
    }
    if (user.role === 'dorm_manager' && !user.dormitory_id) {
        return (
            <div className={styles.layout}>
                <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
                <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                    <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(prev => !prev)} />
                    <main className={styles.pageContainer}>
                        <div className={styles.header}>
                            <h1 className={styles.title}>Керування кімнатами</h1>
                        </div>
                        <div className={styles.contentWrapper}>
                            <p className={styles.errorMessage}>Вам не призначено гуртожиток для управління.</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const summaryStats = useMemo(() => {
        if (isLoading || error ) return { totalRooms: pagination.total, totalCapacity: '–', totalOccupied: '–', totalFree: '–' };
        const currentTotalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
        const currentTotalOccupied = rooms.reduce((sum, room) => sum + (room.occupied_places || 0), 0);
        const currentTotalFree = currentTotalCapacity - currentTotalOccupied;
        return { totalRooms: pagination.total, totalCapacity: currentTotalCapacity, totalOccupied: currentTotalOccupied, totalFree: currentTotalFree };
    }, [rooms, isLoading, error, pagination.total]);

    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)} />
                <main className={styles.pageContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>
                            <BuildingLibraryIcon className={styles.titleIcon} aria-hidden="true"/>
                            Керування кімнатами {user.dormitory_name ? `гуртожитку "${user.dormitory_name}"` : ""}
                        </h1>
                        <div className={styles.headerActions}>
                            <button onClick={() => setShowFilters(!showFilters)} className={styles.toggleFilterButton} disabled={isLoading}>
                                <AdjustmentsHorizontalIcon className={styles.buttonIconSm} /> {showFilters ? "Сховати фільтри" : "Показати фільтри"}
                            </button>
                            <button onClick={handleAddRoom} className={styles.actionButtonMain} disabled={isLoading}>
                                <PlusIcon className={styles.buttonIcon} aria-hidden="true"/> Додати кімнату
                            </button>
                        </div>
                    </div>
                    <div className={styles.contentWrapper}>
                        {showFilters && (
                            <div className={styles.filtersPanel}>
                                <input type="text" name="number" value={inputFilters.number} onChange={handleFilterInputChange} placeholder="Номер кімнати" className={styles.inputField} disabled={isLoading}/>
                                <input type="number" name="floor" value={inputFilters.floor} onChange={handleFilterInputChange} placeholder="Поверх" className={styles.inputField} min="0" disabled={isLoading}/>
                                <select name="gender_type" value={inputFilters.gender_type} onChange={handleFilterInputChange} className={styles.inputField} disabled={isLoading}>
                                    <option value="">Тип статі (всі)</option>
                                    {Object.entries(genderTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                </select>
                                <select name="is_reservable" value={inputFilters.is_reservable} onChange={handleFilterInputChange} className={styles.inputField} disabled={isLoading}>
                                    <option value="">Резервується (всі)</option>
                                    <option value="true">Так</option>
                                    <option value="false">Ні</option>
                                </select>
                                <input type="number" name="capacity_min" value={inputFilters.capacity_min} onChange={handleFilterInputChange} placeholder="Місткість від" className={styles.inputField} min="0" disabled={isLoading}/>
                                <input type="number" name="capacity_max" value={inputFilters.capacity_max} onChange={handleFilterInputChange} placeholder="Місткість до" className={styles.inputField} min="0" disabled={isLoading}/>
                                <button type="button" onClick={handleResetFilters} className={styles.resetFilterButton} disabled={isLoading}>
                                    <XCircleIcon className={styles.buttonIconSm} /> Скинути фільтри
                                </button>
                            </div>
                        )}

                        {selectedRooms.size > 0 && (
                            <div className={styles.batchActionsPanel}>
                                <span>Вибрано: {selectedRooms.size}</span>
                                <button onClick={() => handleBatchAction('setReservable', { reservable: true })} className={styles.batchActionButton} disabled={batchActionLoading || isLoading}>
                                    <EyeIcon className={styles.buttonIconSm} /> Дозволити резерв.
                                </button>
                                <button onClick={() => handleBatchAction('setReservable', { reservable: false })} className={`${styles.batchActionButton} ${styles.batchActionDisable}`} disabled={batchActionLoading || isLoading}>
                                    <EyeSlashIcon className={styles.buttonIconSm} /> Заборонити резерв.
                                </button>
                                <button onClick={() => handleBatchAction('deleteSelected')} className={`${styles.batchActionButton} ${styles.batchActionDelete}`} disabled={batchActionLoading || isLoading}>
                                    <TrashIcon className={styles.buttonIconSm} /> Видалити вибрані
                                </button>
                            </div>
                        )}
                        
                        {!isLoading && !error && (
                             <div className={styles.summaryPanel}>
                                <p>Знайдено кімнат: <strong>{summaryStats.totalRooms}</strong></p>
                                <p>Місткість (поточна стор.): <strong>{summaryStats.totalCapacity}</strong></p>
                                <p>Зайнято (поточна стор.): <strong>{summaryStats.totalOccupied}</strong></p>
                                <p>Вільно (поточна стор.): <strong>{summaryStats.totalFree}</strong></p>
                            </div>
                        )}

                        {isLoading && isInitialLoad.current ? (
                            <div className={styles.loading}>Завантаження кімнат...</div>
                        ) : error ? (
                            <div className={styles.errorMessage}>{error}</div>
                        ) : !isLoading && rooms.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                <InformationCircleIcon aria-hidden="true" />
                                <p>Кімнат за обраними фільтрами не знайдено, або у гуртожитку ще немає кімнат.</p>
                            </div>
                        ) : (
                            <RoomListTable
                                rooms={rooms}
                                onEdit={handleEditRoom}
                                onDelete={handleDeleteRoom}
                                actionLoading={actionLoading}
                                batchActionLoading={batchActionLoading}
                                selectedRooms={selectedRooms}
                                onSelectRoom={handleSelectRoom}
                                onSelectAllRooms={handleSelectAllRooms}
                                sort={sort}
                                onSortChange={handleSortChange}
                                genderTypeLabels={genderTypeLabels}
                                currentGenderOccupancyLabels={currentGenderOccupancyLabels} // Передаємо пропс
                                isLoadingTable={isLoading && !isInitialLoad.current}
                            />
                        )}
                    </div>
                    {!isLoading && !error && pagination.total > 0 && pagination.total > pagination.limit && (
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
            {isModalOpen && user.dormitory_id && (
                <div className={styles.modalOverlayGlobal} onClick={handleModalClose} role="dialog" aria-modal="true">
                <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={handleModalClose}
                        className={styles.closeButtonIconGlobal}
                        aria-label="Закрити форму кімнати"
                    >
                        <CloseModalIcon />
                    </button>
                    <RoomFormModal
                    dormitoryId={user.dormitory_id}
                    room={editingRoom}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    />
                </div>
                </div>
            )}
        </div>
    );
};

export default ManageRoomsPage;