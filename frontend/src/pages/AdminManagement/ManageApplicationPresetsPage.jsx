import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import styles from "./styles/ManageApplicationPresetsPage.module.css";
import {
    PlusIcon, PencilIcon, TrashIcon, WrenchScrewdriverIcon,
    XMarkIcon as CloseModalIcon, CalendarDaysIcon, InformationCircleIcon,
    ArrowUpIcon, ArrowDownIcon, AdjustmentsHorizontalIcon, XCircleIcon,
    CheckBadgeIcon, NoSymbolIcon,
    CheckCircleIcon // <--- ДОДАНО ЦЕЙ ІМПОРТ
} from "@heroicons/react/24/outline";
import Pagination from "../../components/Admin/Pagination";

// --- ApplicationPresetForm Component (Модальне вікно) ---
const ApplicationPresetForm = ({ preset, onClose, onSuccess, dormitories, faculties, currentUser, isLoadingForm }) => {
  const currentYear = new Date().getFullYear();
  const initialAcademicYear = preset?.academic_year || `${currentYear}-${currentYear + 1}`;

  const getInitialDormitoryId = () => {
    if (currentUser?.role === 'dorm_manager' && currentUser.dormitory_id) {
        return String(currentUser.dormitory_id);
    }
    return preset?.dormitory_id ? String(preset.dormitory_id) : "";
  };

  const getInitialFacultyId = () => {
    if (currentUser?.role === 'faculty_dean_office' && !preset?.id && currentUser.faculty_id) {
        return String(currentUser.faculty_id);
    }
    return preset?.faculty_id ? String(preset.faculty_id) : "";
  };


  const [formData, setFormData] = useState({
    dormitory_id: getInitialDormitoryId(),
    faculty_id: getInitialFacultyId(),
    academic_year: initialAcademicYear,
    start_date: preset?.start_date ? preset.start_date.split('T')[0] : "",
    end_date: preset?.end_date ? preset.end_date.split('T')[0] : "",
    default_comments: preset?.default_comments || "",
    is_active: preset?.is_active === undefined ? true : Boolean(preset.is_active),
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const defaultAcademicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    let newFormData = {
        dormitory_id: getInitialDormitoryId(),
        faculty_id: getInitialFacultyId(),
        academic_year: defaultAcademicYear,
        start_date: "",
        end_date: "",
        default_comments: "",
        is_active: true,
    };

    if (preset) {
        newFormData = {
            ...newFormData,
            dormitory_id: String(preset.dormitory_id || getInitialDormitoryId()),
            faculty_id: preset.faculty_id ? String(preset.faculty_id) : getInitialFacultyId(),
            academic_year: preset.academic_year || defaultAcademicYear,
            start_date: preset.start_date ? preset.start_date.split('T')[0] : "",
            end_date: preset.end_date ? preset.end_date.split('T')[0] : "",
            default_comments: preset.default_comments || "",
            is_active: preset.is_active === undefined ? true : Boolean(preset.is_active),
        };
    }
     if (currentUser?.role === 'dorm_manager' && currentUser.dormitory_id) {
      newFormData.dormitory_id = String(currentUser.dormitory_id);
      newFormData.faculty_id = ""; 
    }
    if (currentUser?.role === 'faculty_dean_office' && currentUser.faculty_id && !preset?.id) {
      newFormData.faculty_id = String(currentUser.faculty_id);
    }
    
    setFormData(newFormData);

  }, [currentUser, preset]); // Видалено initialDormitoryId, initialFacultyId із залежностей, бо вони тепер функції


  const validate = () => {
    const newErrors = {};
    if (!formData.dormitory_id) newErrors.dormitory_id = "Гуртожиток обов'язковий";
    if (!formData.academic_year) newErrors.academic_year = "Академічний рік обов'язковий";
    else if (!/^\d{4}-\d{4}$/.test(formData.academic_year)) newErrors.academic_year = "Формат РРРР-РРРР (наприклад 2024-2025)";
    else {
        const years = formData.academic_year.split('-');
        if (parseInt(years[0]) >= parseInt(years[1])) {
             newErrors.academic_year = "Кінцевий рік має бути більшим за початковий";
        } else if (parseInt(years[1]) !== parseInt(years[0]) + 1 && parseInt(years[1]) !== parseInt(years[0])) { 
             newErrors.academic_year = "Різниця між роками має бути 0 або 1";
        }
    }
    if (formData.start_date && !formData.end_date) newErrors.end_date = "Дата закінчення обов'язкова, якщо вказана дата початку";
    if (!formData.start_date && formData.end_date) newErrors.start_date = "Дата початку обов'язкова, якщо вказана дата закінчення";

    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = "Дата закінчення має бути після або рівна даті початку";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
        ToastService.error("Будь ласка, виправте помилки у формі.");
        return;
    }

    let facultyIdToSend = formData.faculty_id ? parseInt(formData.faculty_id) : null;
    if (currentUser?.role === 'dorm_manager') {
        facultyIdToSend = null;
    }

    const payload = {
      ...formData,
      faculty_id: facultyIdToSend,
      dormitory_id: parseInt(formData.dormitory_id),
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      default_comments: formData.default_comments.trim() === "" ? null : formData.default_comments.trim(),
      is_active: Boolean(formData.is_active),
    };
    delete payload.application_date;

    try {
      if (preset?.id) {
        await api.put(`/application-presets/${preset.id}`, payload);
        ToastService.success("Налаштування оновлено");
      } else {
        await api.post("/application-presets", payload);
        ToastService.success("Налаштування створено");
      }
      onSuccess();
      onClose();
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const isDormManager = currentUser?.role === 'dorm_manager';
  const isFacultyDean = currentUser?.role === 'faculty_dean_office';

  const dormOptions = isDormManager && currentUser.dormitory_id
    ? dormitories.filter(d => String(d.id) === String(currentUser.dormitory_id))
    : dormitories;

  return (
    <div className={styles.modalInnerContent}>
        <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
                <WrenchScrewdriverIcon className={styles.modalTitleIcon}/>
                {preset?.id ? `Редагувати налаштування ID: ${preset.id}` : "Створити налаштування"}
            </h2>
        </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.modalBody}>
            <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="dormitory_id_preset_form">Гуртожиток *</label>
                <select
                id="dormitory_id_preset_form"
                name="dormitory_id"
                value={formData.dormitory_id}
                onChange={handleChange}
                required
                className={`${styles.selectField} ${errors.dormitory_id ? styles.inputError : ""}`}
                disabled={(isDormManager && !!currentUser.dormitory_id) || isLoadingForm}
                >
                <option value="">Виберіть гуртожиток</option>
                {dormOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.dormitory_id && <p className={styles.errorMessage}>{errors.dormitory_id}</p>}
            </div>

            { !isDormManager && (currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || isFacultyDean) &&
                <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="faculty_id_preset_form">
                    Факультет
                    {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && " (глобальне, якщо не обрано)"}
                    {isFacultyDean && !preset?.id && " (Ваш факультет)"}
                    {isFacultyDean && preset?.id && String(preset.faculty_id) === String(currentUser.faculty_id) && " (Ваш факультет)"}
                    {isFacultyDean && preset?.id && preset.faculty_id && String(preset.faculty_id) !== String(currentUser.faculty_id) && " (Інший факультет - редагування заборонено)"}
                    {isFacultyDean && preset?.id && !preset.faculty_id && " (Глобальний пресет)"}
                </label>
                <select
                    id="faculty_id_preset_form"
                    name="faculty_id"
                    value={formData.faculty_id || ""}
                    onChange={handleChange}
                    className={styles.selectField}
                    disabled={
                        (isFacultyDean && preset?.id && preset.faculty_id && String(preset.faculty_id) !== String(currentUser.faculty_id)) ||
                        (isFacultyDean && !preset?.id && !!currentUser.faculty_id) || isLoadingForm
                    }
                >
                    <option value="">Для всіх факультетів / Глобальне</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                </div>
            }

            <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="academic_year_preset_form">Академічний рік (РРРР-РРРР) *</label>
                <input
                id="academic_year_preset_form"
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                placeholder="2024-2025"
                required
                className={`${styles.inputField} ${errors.academic_year ? styles.inputError : ""}`}
                disabled={isLoadingForm}
                />
                {errors.academic_year && <p className={styles.errorMessage}>{errors.academic_year}</p>}
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label className={styles.inputLabel} htmlFor="start_date_preset_form">Дата початку поселення</label>
                    <input id="start_date_preset_form" type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={`${styles.inputField} ${errors.start_date ? styles.inputError : ""}`} disabled={isLoadingForm}/>
                    {errors.start_date && <p className={styles.errorMessage}>{errors.start_date}</p>}
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.inputLabel} htmlFor="end_date_preset_form">Дата кінця поселення</label>
                    <input id="end_date_preset_form" type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={`${styles.inputField} ${errors.end_date ? styles.inputError : ""}`} disabled={isLoadingForm}/>
                    {errors.end_date && <p className={styles.errorMessage}>{errors.end_date}</p>}
                </div>
            </div>
             <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                <input
                    id="is_active_preset_form"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className={styles.checkboxInput}
                    disabled={isLoadingForm}
                />
                <label htmlFor="is_active_preset_form" className={styles.checkboxLabel}>
                    Активне налаштування (впливає на можливість подачі заяв)
                </label>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.inputLabel} htmlFor="default_comments_preset_form">Коментарі за замовчуванням (для студентів)</label>
                <textarea id="default_comments_preset_form" name="default_comments" value={formData.default_comments} onChange={handleChange} className={styles.textareaField} rows="3" placeholder="Наприклад, умови для пільгових категорій, необхідні документи..." disabled={isLoadingForm}></textarea>
            </div>
        </div>
        <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={`${styles.formButton} ${styles.cancelButton}`} disabled={isLoadingForm}>
                <XCircleIcon /> Скасувати
            </button>
            <button type="submit" className={`${styles.formButton} ${styles.submitButton}`} disabled={isLoadingForm}>
                <CheckCircleIcon/> {isLoadingForm ? "Збереження..." : "Зберегти налаштування"}
            </button>
        </div>
      </form>
    </div>
  );
};

const ManageApplicationPresetsPage = () => {
  const { user, isLoading: userIsLoading } = useUser();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => JSON.parse(localStorage.getItem("sidebarOpen") || "true"));
  const [presets, setPresets] = useState([]);
  const [allDormitories, setAllDormitories] = useState([]);
  const [allFaculties, setAllFaculties] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const initialFilters = useMemo(() => ({
    dormitory_id: '',
    faculty_id: '',
    academic_year: '',
    is_active: '',
  }), []);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [sort, setSort] = useState({ sortBy: 'academic_year', sortOrder: 'desc' });

  const fetchData = useCallback(async (page = pagination.page, limit = pagination.limit) => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      let dormsToLoadForForm = [];
      if (user.role === 'dorm_manager' && user.dormitory_id) {
        const dormRes = await api.get(`/dormitories/${user.dormitory_id}`);
        if (dormRes.data) dormsToLoadForForm = [dormRes.data];
      } else if (['admin', 'superadmin', 'faculty_dean_office'].includes(user.role)) {
        const allDormsResponse = await api.get("/dormitories");
        dormsToLoadForForm = allDormsResponse.data || [];
      }
      setAllDormitories(dormsToLoadForForm);

      if (['admin', 'superadmin', 'faculty_dean_office'].includes(user.role)) {
        const facsRes = await api.get("/faculties");
        setAllFaculties(facsRes.data || []);
      } else {
        setAllFaculties([]);
      }

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
      if (user.role === 'dorm_manager' && user.dormitory_id) {
        params.dormitory_id_for_filter = user.dormitory_id;
      }
      if (user.role === 'faculty_dean_office' && user.faculty_id) {
        params.faculty_id_for_filter = user.faculty_id;
      }

      const presetsRes = await api.get("/application-presets", { params });
      setPresets(presetsRes.data.presets || presetsRes.data || []);
      setPagination(prev => ({
          ...prev,
          total: presetsRes.data.total || presetsRes.data?.length || 0,
          page,
          limit
      }));

    } catch (error) {
      ToastService.handleApiError(error);
      setPresets([]);
      setPagination(prev => ({...prev, total: 0, page: 1}));
    } finally {
      setIsLoadingData(false);
    }
  }, [user, filters, sort, pagination.page, pagination.limit]); // Видалив pagination.page, pagination.limit звідси, бо передаються в функцію

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    if (user && !userIsLoading) {
      fetchData(pagination.page, pagination.limit); // Викликаємо з поточними значеннями пагінації
    }
  }, [user, userIsLoading, filters, sort, pagination.page, pagination.limit, fetchData]); // Додав fetchData

  const handleAddPreset = () => {
    setEditingPreset(null);
    setIsModalOpen(true);
  };

  const handleEditPreset = (preset) => {
    setEditingPreset(preset);
    setIsModalOpen(true);
  };

  const handleDeletePreset = async (id) => {
    if (window.confirm("Ви впевнені, що хочете видалити це налаштування?")) {
      setActionLoading(true);
      try {
        await api.delete(`/application-presets/${id}`);
        ToastService.success("Налаштування видалено");
        fetchData(1, pagination.limit);
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setActionLoading(false);
      }
    }
  };
  
  const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters(prev => ({...prev, [name]: value}));
      setPagination(prev => ({...prev, page: 1}));
  };

  const handleResetFilters = () => {
      setFilters(initialFilters);
      setSort({ sortBy: 'academic_year', sortOrder: 'desc' });
      setPagination(prev => ({...prev, page: 1}));
  };
  
  const handleSortChangeInternal = (key) => {
      setSort(prevSort => ({
          sortBy: key,
          sortOrder: prevSort.sortBy === key && prevSort.sortOrder === 'asc' ? 'desc' : 'asc'
      }));
      setPagination(prev => ({...prev, page: 1}));
  };
  
  const handlePageChange = (newPage) => {
      setPagination(prev => ({...prev, page: newPage}));
  };
  const handleLimitChange = (newLimit) => {
      setPagination(prev => ({...prev, page:1, limit: newLimit}));
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('uk-UA') : 'Не вказано';
  
  if (userIsLoading) return <div className={styles.layout}><div className={styles.loading}>Завантаження...</div></div>;
  if (!user || !['admin', 'superadmin', 'faculty_dean_office', 'dorm_manager'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  if ((user.role === 'dorm_manager' && !user.dormitory_id) || (user.role === 'faculty_dean_office' && !user.faculty_id)){
    let message = "";
    if (user.role === 'dorm_manager') message = "Вам не призначено гуртожиток для управління налаштуваннями.";
    if (user.role === 'faculty_dean_office') message = "Інформація про ваш факультет не визначена для управління налаштуваннями.";
    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(prev => !prev)} />
                <main className={styles.pageContainer}>
                    <div className={styles.header}>
                         <h1 className={styles.title}>
                            <WrenchScrewdriverIcon className={styles.titleIcon} />
                            Налаштування Заяв
                        </h1>
                    </div>
                    <div className={styles.contentWrapper}>
                        <p className={styles.errorMessage}>{message} Будь ласка, зверніться до адміністратора системи.</p>
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
        <Navbar
            isSidebarExpanded={isSidebarExpanded}
            onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
        />
        <main className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>
                <WrenchScrewdriverIcon className={styles.titleIcon} aria-hidden="true" />
                Налаштування періодів подачі заяв
                {user.role === 'dorm_manager' && user.dormitory_name && ` для гуртожитку "${user.dormitory_name}"`}
                {user.role === 'faculty_dean_office' && user.faculty_name && ` для факультету "${user.faculty_name}"`}
            </h1>
            <button onClick={handleAddPreset} className={styles.actionButtonMain} disabled={isLoadingData || actionLoading}>
              <PlusIcon className={styles.buttonIcon} aria-hidden="true" /> Створити налаштування
            </button>
          </div>

            <div className={styles.contentWrapper}>
                <div className={styles.filtersPanel}>
                    {(user.role === 'admin' || user.role === 'superadmin') && (
                        <>
                        <select name="dormitory_id" value={filters.dormitory_id} onChange={handleFilterChange} className={styles.inputField}>
                            <option value="">Всі гуртожитки</option>
                            {allDormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select name="faculty_id" value={filters.faculty_id} onChange={handleFilterChange} className={styles.inputField}>
                            <option value="">Всі факультети</option>
                            {allFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        </>
                    )}
                    <input
                        type="text"
                        name="academic_year"
                        value={filters.academic_year}
                        onChange={handleFilterChange}
                        placeholder="Академ. рік (РРРР-РРРР)"
                        className={styles.inputField}
                    />
                    <select name="is_active" value={filters.is_active} onChange={handleFilterChange} className={styles.inputField}>
                        <option value="">Статус (всі)</option>
                        <option value="true">Активні</option>
                        <option value="false">Неактивні</option>
                    </select>
                     <button onClick={handleResetFilters} className={styles.resetFilterButton}>
                        <XCircleIcon className={styles.buttonIconSm}/> Скинути
                    </button>
                </div>

                {isLoadingData ? (
                    <div className={styles.loading}>Завантаження налаштувань...</div>
                ) : presets.length === 0 ? (
                    <div className={styles.emptyMessage}>
                        <InformationCircleIcon aria-hidden="true"/>
                        <p>Налаштування періодів подачі заяв ще не створені або не знайдено за фільтрами.</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th onClick={() => handleSortChangeInternal('id')}>ID {sort.sortBy === 'id' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon}/> : <ArrowDownIcon className={styles.sortIcon}/>)}</th>
                            <th onClick={() => handleSortChangeInternal('dormitory_name')}>Гуртожиток {sort.sortBy === 'dormitory_name' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon}/> : <ArrowDownIcon className={styles.sortIcon}/>)}</th>
                            <th onClick={() => handleSortChangeInternal('faculty_name')}>Факультет {sort.sortBy === 'faculty_name' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon}/> : <ArrowDownIcon className={styles.sortIcon}/>)}</th>
                            <th onClick={() => handleSortChangeInternal('academic_year')}>Акад. рік {sort.sortBy === 'academic_year' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon}/> : <ArrowDownIcon className={styles.sortIcon}/>)}</th>
                            <th onClick={() => handleSortChangeInternal('start_date')}>Початок</th>
                            <th onClick={() => handleSortChangeInternal('end_date')}>Кінець</th>
                            <th onClick={() => handleSortChangeInternal('is_active')}>Активний</th>
                            <th className={styles.commentHeader}>Коментар</th>
                            <th className={styles.actionsHeader}>Дії</th>
                        </tr>
                        </thead>
                        <tbody>
                        {presets.map(p => (
                            <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.dormitory_name || 'N/A'}</td>
                            <td>{p.faculty_name || 'Для всіх'}</td>
                            <td>{p.academic_year}</td>
                            <td>{formatDate(p.start_date)}</td>
                            <td>{formatDate(p.end_date)}</td>
                            <td className={styles.statusCell}>
                                {p.is_active ? <CheckBadgeIcon className={styles.statusIconActive} title="Активний"/> : <NoSymbolIcon className={styles.statusIconInactive} title="Неактивний"/>}
                            </td>
                            <td title={p.default_comments || ''} className={styles.commentCell}>
                                {p.default_comments?.substring(0,30)}{p.default_comments && p.default_comments.length > 30 ? '...' : ''}
                            </td>
                            <td className={styles.actionsCell}>
                                <button onClick={() => handleEditPreset(p)} className={`${styles.actionButton} ${styles.editButton}`} title="Редагувати" disabled={actionLoading}>
                                <PencilIcon />
                                </button>
                                <button onClick={() => handleDeletePreset(p.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Видалити" disabled={actionLoading}>
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
            {!isLoadingData && presets.length > 0 && pagination.total > pagination.limit && (
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
        <div className={styles.modalOverlayGlobal} onClick={() => setIsModalOpen(false)} role="dialog" aria-modal="true">
            <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className={styles.closeButtonIconGlobal}
                    aria-label="Закрити форму налаштувань"
                >
                    <CloseModalIcon />
                </button>
                <ApplicationPresetForm
                    preset={editingPreset}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => { fetchData(1, pagination.limit); setIsModalOpen(false); }}
                    dormitories={allDormitories}
                    faculties={allFaculties}
                    currentUser={user}
                    isLoadingForm={formSubmitting} // Передаємо formSubmitting
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplicationPresetsPage;