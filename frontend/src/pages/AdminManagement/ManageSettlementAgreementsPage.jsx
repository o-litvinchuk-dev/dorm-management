import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from "./styles/ManageSettlementAgreementsPage.module.css";
import modalStyles from "./styles/SettlementAgreementDetailModal.module.css";
import {
    DocumentTextIcon, XMarkIcon as CloseModalIcon, ArrowUpIcon, ArrowDownIcon,
    InformationCircleIcon, CogIcon, UserCircleIcon, HomeModernIcon, CalendarDaysIcon,
    PhoneIcon, FingerPrintIcon, SparklesIcon, ClipboardDocumentListIcon, PowerIcon, ShieldCheckIcon, BeakerIcon
} from '@heroicons/react/24/outline';
import Pagination from '../../components/Admin/Pagination';
import { useUser } from '../../contexts/UserContext';

const SettlementAgreementDetailModal = ({ agreement, onClose, onUpdateStatus, isUpdating }) => {
    const [status, setStatus] = useState(agreement?.status || 'pending_review');
    const [adminNotes, setAdminNotes] = useState(agreement?.admin_notes || '');

    useEffect(() => {
        if (agreement) {
            setStatus(agreement.status || 'pending_review');
            setAdminNotes(agreement.admin_notes || '');
        }
    }, [agreement]);

    if (!agreement) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdateStatus(agreement.id, status, adminNotes);
    };

    const statusLabels = {
        pending_review: "На розгляді",
        approved: "Затверджено",
        rejected: "Відхилено",
        archived: "Архівовано"
    };

    const availableStatusOptions = Object.entries(statusLabels)
        .map(([key, label]) => ({ value: key, label }));

    const formatDateOrNA = (dateString) => {
        if (!dateString || dateString === "0000-00-00" || String(dateString).startsWith('[Помилка')) return <span className={modalStyles.naText}>N/A</span>;
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return <span className={modalStyles.naText}>N/A (некор. дата)</span>;
            return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) { return <span className={modalStyles.naText}>N/A (помилка форматування)</span>; }
    };
    
    const formatFullDateTimeOrNA = (dateString) => {
        if (!dateString || dateString === "0000-00-00" || String(dateString).startsWith('[Помилка')) return <span className={modalStyles.naText}>N/A</span>;
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return <span className={modalStyles.naText}>N/A (некор. дата)</span>;
            return date.toLocaleString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return <span className={modalStyles.naText}>N/A (помилка форматування)</span>; }
    };


    const getStatusClassModal = (currentStatus) => {
        const baseModalClass = modalStyles.statusBadgeOnModal;
        switch (currentStatus?.toLowerCase()) {
            case 'pending_review': return `${baseModalClass} ${modalStyles.statusPending}`;
            case 'approved': return `${baseModalClass} ${modalStyles.statusApproved}`;
            case 'rejected':
            case 'archived': return `${baseModalClass} ${modalStyles.statusRejected}`;
            default: return `${baseModalClass} ${modalStyles.statusDefault}`;
        }
    };
    
    const displayValueOrNA = (value, fieldName = "") => {
        // Перевіряємо чи поле є в agreement і чи воно не є зашифрованим полем, яке вже має розшифрований аналог
        if (agreement && agreement.hasOwnProperty(fieldName) && agreement[fieldName] !== undefined && agreement[fieldName] !== null && String(agreement[fieldName]).trim() !== '' && !String(agreement[fieldName]).startsWith('[Помилка')) {
            value = agreement[fieldName];
        } else if (agreement && agreement.hasOwnProperty(`${fieldName}_encrypted`) && (agreement[fieldName] === undefined || agreement[fieldName] === null || String(agreement[fieldName]).trim() === '' || String(agreement[fieldName]).startsWith('[Помилка'))) {
            // Якщо є зашифроване поле, але розшифроване відсутнє або некоректне, показуємо N/A
             return <span className={modalStyles.naText}>N/A (зашифровано/недоступно)</span>;
        }


        if (value === null || value === undefined || String(value).trim() === '' || String(value).startsWith('[Помилка')) {
            return <span className={modalStyles.naText}>N/A</span>;
        }
        // Для taxId, якщо він приходить як рядок цифр після розшифровки
        if (fieldName === "taxId" && typeof value === 'string') {
           return value;
        }
        return String(value);
    };
    

    const renderListSection = (title, items, renderItem, icon, keyPrefix = "") => {
        const validItems = items?.filter(item => {
            if (!item) return false;
            // Перевіряємо, чи хоча б одне поле, крім системних, має значуще значення
            return Object.entries(item).some(([itemPropertyKey, val]) => {
                if (['id', 'item_order', 'contract_id'].includes(itemPropertyKey)) return false; // Ігноруємо системні поля
                return val !== null && val !== undefined && String(val).trim() !== '' && !String(val).startsWith('[Помилка');
            });
        }) || [];

        const IconComponent = icon || InformationCircleIcon;

        if (validItems.length === 0) {
            return (
                <div className={modalStyles.modalSection}>
                    <h3 className={modalStyles.modalSectionTitle}><IconComponent /> {title}</h3>
                    <p className={modalStyles.noDataTextModal}>Дані відсутні або не заповнені.</p>
                </div>
            );
        }

        return (
            <div className={modalStyles.modalSection}>
                <h3 className={modalStyles.modalSectionTitle}><IconComponent /> {title}</h3>
                <div className={modalStyles.tableWrapperModal}>
                    <table className={modalStyles.detailTableModal}>
                        {title === "Інвентар (Додаток 1)" && <thead><tr><th>Назва</th><th>К-сть</th><th>Примітка</th></tr></thead>}
                        {title === "Стан приміщення (Додаток 2)" && <thead><tr><th>Опис</th><th>Стан</th></tr></thead>}
                        {title === "Електроприлади (Додаток 3)" && <thead><tr><th>Назва</th><th>Марка</th><th>Рік</th><th>К-сть</th><th>Примітка</th></tr></thead>}
                        <tbody>
                            {validItems.map((item, index) => (
                                <tr key={`${keyPrefix}-${item.id || item.item_order || index}`}>
                                    {renderItem(item, index)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    return (
        <div className={modalStyles.modalOverlayGlobal} onClick={onClose} role="dialog" aria-modal="true">
            <div className={`${modalStyles.modalContentGlobal} ${modalStyles.agreementDetailModalContent}`} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={modalStyles.closeButtonIconGlobal} aria-label="Закрити деталі договору">
                    <CloseModalIcon />
                </button>
                <div className={modalStyles.modalInnerContentScrollable}>
                    <div className={modalStyles.modalHeader}>
                        <h2 className={modalStyles.modalTitle}>Деталі Договору на поселення №{agreement.id}</h2>
                    </div>
                    <div className={modalStyles.modalBody}>
                        
                        <div className={modalStyles.modalSection}>
                            <h3 className={modalStyles.modalSectionTitle}><InformationCircleIcon /> Загальна інформація</h3>
                            <div className={modalStyles.modalInfoGrid}>
                                <div className={modalStyles.modalInfoItem}><strong>Студент (Email):</strong> {displayValueOrNA(agreement.user_email)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>ПІБ (з профілю):</strong> {displayValueOrNA(agreement.user_name_from_users_table)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Гуртожиток:</strong> {displayValueOrNA(agreement.dormitory_name_from_dormitories_table) || `ID: ${displayValueOrNA(agreement.dorm_number)}`}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Кімната:</strong> {displayValueOrNA(agreement.room_number)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Дата договору:</strong> {formatDateOrNA(agreement.contract_date)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Статус:</strong>
                                    <span className={getStatusClassModal(agreement.status)}>
                                        {statusLabels[agreement.status] || agreement.status}
                                    </span>
                                </div>
                                <div className={modalStyles.modalInfoItemWide}><strong>Створено:</strong> {formatFullDateTimeOrNA(agreement.created_at)}</div>
                                <div className={modalStyles.modalInfoItemWide}><strong>Оновлено:</strong> {formatFullDateTimeOrNA(agreement.updated_at)}</div>
                                {agreement.updated_by && <div className={modalStyles.modalInfoItemWide}><strong>Оновлено Адміном ID:</strong> {agreement.updated_by}</div>}
                            </div>
                        </div>

                        <div className={modalStyles.modalSection}>
                            <h3 className={modalStyles.modalSectionTitle}><UserCircleIcon /> Дані студента (з договору)</h3>
                             <div className={modalStyles.modalDetailGrid}>
                                <div className={modalStyles.modalInfoItemWide}><strong>ПІБ:</strong> {displayValueOrNA(agreement.fullName, "fullName")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Серія паспорта:</strong> {displayValueOrNA(agreement.passportSeries, "passportSeries")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Номер паспорта:</strong> {displayValueOrNA(agreement.passportNumber, "passportNumber")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Ким виданий (код):</strong> {displayValueOrNA(agreement.passportIssued, "passportIssued")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>ІПН:</strong> {displayValueOrNA(agreement.taxId, "taxId")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Телефон (з договору):</strong> {displayValueOrNA(agreement.residentPhone, "residentPhone")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Факультет:</strong> {displayValueOrNA(agreement.faculty_name, "faculty_name")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Група:</strong> {displayValueOrNA(agreement.group_name, "group_name")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Курс:</strong> {displayValueOrNA(agreement.course, "course")}</div>
                            </div>
                        </div>

                        <div className={modalStyles.modalSection}>
                            <h3 className={modalStyles.modalSectionTitle}><PhoneIcon /> Контактна інформація</h3>
                            <div className={modalStyles.modalDetailGrid}>
                                <div className={modalStyles.modalInfoItemWide}><strong>ПІБ мешканця (зареєстр.):</strong> {displayValueOrNA(agreement.residentFullName, "residentFullName")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Регіон:</strong> {displayValueOrNA(agreement.resident_region)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Район:</strong> {displayValueOrNA(agreement.resident_district)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Місто/Село:</strong> {displayValueOrNA(agreement.resident_city)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Індекс:</strong> {displayValueOrNA(agreement.resident_postal_code)}</div>
                                <div className={modalStyles.modalInfoItemWide}><strong>ПІБ одного з батьків:</strong> {displayValueOrNA(agreement.parentFullName, "parentFullName")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Телефон матері:</strong> {displayValueOrNA(agreement.motherPhone, "motherPhone")}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Телефон батька:</strong> {displayValueOrNA(agreement.fatherPhone, "fatherPhone")}</div>
                            </div>
                        </div>

                        <div className={modalStyles.modalSection}>
                            <h3 className={modalStyles.modalSectionTitle}><CalendarDaysIcon /> Дати та терміни</h3>
                            <div className={modalStyles.modalDetailGrid}>
                                <div className={modalStyles.modalInfoItem}><strong>Довіреність №:</strong> {displayValueOrNA(agreement.proxy_number)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Дата довіреності:</strong> {formatDateOrNA(agreement.proxy_date)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Початок проживання:</strong> {formatDateOrNA(agreement.settlement_start_date)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Кінець проживання:</strong> {formatDateOrNA(agreement.settlement_end_date)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Дата додатків:</strong> {formatDateOrNA(agreement.appendix_date)}</div>
                            </div>
                        </div>
                        
                        <div className={modalStyles.modalSection}>
                             <h3 className={modalStyles.modalSectionTitle}><HomeModernIcon/> Деталі по гуртожитку (з договору)</h3>
                             <div className={modalStyles.modalDetailGrid}>
                                <div className={modalStyles.modalInfoItemWide}><strong>Адреса (Додаток 1):</strong> {displayValueOrNA(agreement.appendix_address)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>ПІБ Зав. гуртожитку:</strong> {displayValueOrNA(agreement.dorm_manager_name)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Вулиця гуртожитку:</strong> {displayValueOrNA(agreement.dorm_street)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Будівля гуртожитку:</strong> {displayValueOrNA(agreement.dorm_building)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>№ Приміщення:</strong> {displayValueOrNA(agreement.premises_number)}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Площа:</strong> {agreement.premises_area ? `${agreement.premises_area} м²` : displayValueOrNA(agreement.premises_area)}</div>
                             </div>
                        </div>

                        <div className={modalStyles.modalSection}>
                             <h3 className={modalStyles.modalSectionTitle}><ShieldCheckIcon/> Згоди</h3>
                             <div className={modalStyles.modalDetailGrid}>
                                <div className={modalStyles.modalInfoItem}><strong>Обробка даних:</strong> {agreement.data_processing_consent ? 'Так' : 'Ні'}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Умови договору:</strong> {agreement.contract_terms_consent ? 'Так' : 'Ні'}</div>
                                <div className={modalStyles.modalInfoItem}><strong>Правильність даних:</strong> {agreement.data_accuracy_consent ? 'Так' : 'Ні'}</div>
                             </div>
                        </div>
                        
                        {renderListSection("Інвентар (Додаток 1)", agreement.inventory, (item, idx) => (
                            <>
                                <td data-label="Назва">{displayValueOrNA(item.item_name) || `Предмет ${idx + 1}`}</td>
                                <td data-label="К-сть">{displayValueOrNA(item.quantity) || '0'}</td>
                                <td data-label="Примітка" className={modalStyles.noteCellModal}>{item.note ? displayValueOrNA(item.note) : <span className={modalStyles.naText}>–</span>}</td>
                            </>
                        ), ClipboardDocumentListIcon, "inv")}

                        {renderListSection("Стан приміщення (Додаток 2)", agreement.premisesConditions, (item, idx) => (
                           <>
                               <td data-label="Опис" className={modalStyles.descriptionCellModal}>{displayValueOrNA(item.description) || `Пункт ${idx + 1}`}</td>
                               <td data-label="Стан">{displayValueOrNA(item.condition_status) || 'Не вказано'}</td>
                           </>
                        ), BeakerIcon, "prem")}

                        {renderListSection("Електроприлади (Додаток 3)", agreement.electricalAppliances, (item, idx) => (
                            <>
                                <td data-label="Назва">{displayValueOrNA(item.appliance_name) || `Прилад ${idx + 1}`}</td>
                                <td data-label="Марка">{displayValueOrNA(item.brand)}</td>
                                <td data-label="Рік">{displayValueOrNA(item.manufacture_year)}</td>
                                <td data-label="К-сть">{displayValueOrNA(item.quantity) || '0'}</td>
                                <td data-label="Примітка" className={modalStyles.noteCellModal}>{item.note ? displayValueOrNA(item.note) : <span className={modalStyles.naText}>–</span>}</td>
                            </>
                        ), PowerIcon, "elec")}


                        <div className={modalStyles.modalSection}>
                            <h3 className={modalStyles.modalSectionTitle}><CogIcon /> Адміністрування</h3>
                            <form onSubmit={handleSubmit} className={modalStyles.modalForm}>
                                <div className={modalStyles.formSectionModal}>
                                    <label htmlFor="status" className={modalStyles.inputLabelModal}>Змінити статус:</label>
                                    <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={modalStyles.selectFieldModal} disabled={isUpdating}>
                                        {availableStatusOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={modalStyles.formSectionModal}>
                                    <label htmlFor="adminNotes" className={modalStyles.inputLabelModal}>Примітки адміністратора:</label>
                                    <textarea
                                        id="adminNotes"
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        rows="3"
                                        className={modalStyles.textareaFieldModal}
                                        placeholder="Додайте коментар, якщо необхідно..."
                                        disabled={isUpdating}
                                    />
                                </div>
                                <div className={modalStyles.modalFooter}>
                                    <button type="button" onClick={onClose} className={`${modalStyles.commonButton} ${modalStyles.cancelButtonModal}`} disabled={isUpdating}>
                                        Скасувати
                                    </button>
                                    <button type="submit" className={`${modalStyles.commonButton} ${modalStyles.submitButtonModal}`} disabled={isUpdating}>
                                        {isUpdating ? 'Оновлення...' : 'Оновити'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ManageSettlementAgreementsPage = () => {
    const { user } = useUser();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [agreements, setAgreements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: '', dormitory_id: '', sortBy: 'created_at', sortOrder: 'desc' });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [dormitories, setDormitories] = useState([]);
    const [selectedAgreement, setSelectedAgreement] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    const fetchDormitories = useCallback(async () => {
        if (user?.role === 'admin' || user?.role === 'superadmin') {
            try {
                const response = await api.get('/dormitories');
                setDormitories(response.data || []);
            } catch (err) {
                ToastService.handleApiError(err);
            }
        }
    }, [user]);

    const fetchAgreements = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                search: filters.search || undefined,
                status: filters.status || undefined,
                dormitory_id: filters.dormitory_id || undefined,
            };
            if (user?.role === 'dorm_manager' && user.dormitory_id) {
                params.dormitory_id = user.dormitory_id;
            }
            const response = await api.get('/admin/settlement-agreements', { params });
            setAgreements(response.data.agreements || []);
            setPagination(prev => ({ ...prev, total: response.data.total || 0, page: response.data.page || 1, limit: response.data.limit || 10 }));
        } catch (err) {
            ToastService.handleApiError(err);
            setError("Не вдалося завантажити договори. Спробуйте оновити сторінку.");
            setAgreements([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.page, pagination.limit, user]);

    useEffect(() => {
        if (user) {
            fetchAgreements();
            if (user.role === 'admin' || user.role === 'superadmin') {
                fetchDormitories();
            }
        }
    }, [fetchAgreements, user, fetchDormitories]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSortChange = (newSortBy) => {
        setFilters(prev => ({
            ...prev,
            sortBy: newSortBy,
            sortOrder: prev.sortBy === newSortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (page) => setPagination(prev => ({ ...prev, page }));
    const handleLimitChange = (limit) => setPagination(prev => ({ ...prev, limit, page: 1 }));

    const handleViewDetails = async (agreementId) => {
        setIsModalLoading(true);
        try {
            const response = await api.get(`/admin/settlement-agreements/${agreementId}`);
            setSelectedAgreement(response.data); 
            setIsModalOpen(true);
        } catch (err) {
            ToastService.handleApiError(err);
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedAgreement(null);
        setIsModalOpen(false);
    };

    const handleUpdateStatus = async (agreementId, newStatus, newAdminNotes) => {
        setIsModalLoading(true);
        try {
            await api.put(`/admin/settlement-agreements/${agreementId}`, { status: newStatus, admin_notes: newAdminNotes });
            ToastService.success("Статус договору оновлено.");
            fetchAgreements(); 
            handleCloseModal(); 
        } catch (err) {
            ToastService.handleApiError(err);
        } finally {
            setIsModalLoading(false);
        }
    };

    const statusLabelsForTable = {
        pending_review: "На розгляді",
        approved: "Затверджено",
        rejected: "Відхилено",
        archived: "Архівовано"
    };

    const getStatusClassTable = (status) => {
        if (!status) return styles.statusDefault;
        switch (status.toLowerCase()) {
            case "pending_review": return styles.statusPending;
            case "approved": return styles.statusApproved;
            case "rejected":
            case "archived": return styles.statusRejected;
            default: return styles.statusDefault;
        }
    };

    const columns = [
        { key: "id", label: "ID", sortable: true },
        { key: "user_name_from_users_table", label: "ПІБ Студента", sortable: true },
        { key: "user_email", label: "Email", sortable: false },
        { key: "dormitory_name", label: "Гуртожиток", sortable: true },
        { key: "room_number", label: "Кімната", sortable: true },
        { key: "contract_date", label: "Дата договору", sortable: true },
        { key: "status", label: "Статус", sortable: true },
        { key: "created_at", label: "Створено", sortable: true },
        { key: "actions", label: "Дії", sortable: false }
    ];

    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar
                    isSidebarExpanded={isSidebarExpanded}
                    onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
                />
                <main className={styles.pageContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>
                            <DocumentTextIcon className={styles.titleIcon} />
                            Управління Договорами на Поселення
                        </h1>
                    </div>
                    <div className={styles.contentWrapper}>
                        <div className={styles.filtersPanel}>
                            <input
                                type="text"
                                name="search"
                                placeholder="Пошук (ID, ПІБ, Email, гуртожиток, кімната)"
                                value={filters.search}
                                onChange={handleFilterChange}
                                className={styles.inputField}
                            />
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className={styles.inputField}
                            >
                                <option value="">Всі статуси</option>
                                {Object.entries(statusLabelsForTable)
                                    .map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                            </select>
                            {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                <select
                                    name="dormitory_id"
                                    value={filters.dormitory_id}
                                    onChange={handleFilterChange}
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
                            <div className={styles.loading}>Завантаження договорів...</div>
                        ) : error ? (
                            <div className={styles.errorMessage}>{error}</div>
                        ) : agreements.length === 0 && !isLoading ? (
                            <p className={styles.emptyMessage}>Договорів за вашими критеріями не знайдено.</p>
                        ) : (
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            {columns.map(col => (
                                                <th key={col.key} onClick={() => col.sortable && handleSortChange(col.key)}>
                                                    {col.label}
                                                    {col.sortable && filters.sortBy === col.key && (
                                                        filters.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {agreements.map(agreement => (
                                            <tr key={agreement.id}>
                                                <td data-label="ID">{agreement.id}</td>
                                                <td data-label="ПІБ Студента">{agreement.user_name_from_users_table || 'N/A'}</td>
                                                <td data-label="Email">{agreement.user_email || 'N/A'}</td>
                                                <td data-label="Гуртожиток">{agreement.dormitory_name_from_dormitories_table || `ID: ${agreement.dorm_number}` || 'N/A'}</td>
                                                <td data-label="Кімната">{agreement.room_number || 'N/A'}</td>
                                                <td data-label="Дата договору">{agreement.contract_date ? new Date(agreement.contract_date).toLocaleDateString('uk-UA') : 'N/A'}</td>
                                                <td data-label="Статус">
                                                    <span className={`${styles.statusBadge} ${getStatusClassTable(agreement.status)}`}>
                                                        {statusLabelsForTable[agreement.status] || agreement.status}
                                                    </span>
                                                </td>
                                                <td data-label="Створено">{agreement.created_at ? new Date(agreement.created_at).toLocaleString('uk-UA') : 'N/A'}</td>
                                                <td data-label="Дії" className={styles.actionsCell}>
                                                    <button onClick={() => handleViewDetails(agreement.id)} className={styles.actionButton} title="Деталі / Редагувати статус">
                                                        Деталі
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {!isLoading && !error && agreements.length > 0 && pagination.total > pagination.limit && (
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
            {isModalOpen && selectedAgreement && (
                <SettlementAgreementDetailModal
                    agreement={selectedAgreement}
                    onClose={handleCloseModal}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={isModalLoading}
                />
            )}
        </div>
    );
};

export default ManageSettlementAgreementsPage;