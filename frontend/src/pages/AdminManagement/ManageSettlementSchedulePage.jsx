import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/ManageSettlementSchedulePage.module.css';
import {
    CalendarDaysIcon, PlusIcon, PencilIcon, TrashIcon,
    XMarkIcon as CloseModalIcon, BuildingOfficeIcon, UsersIcon, TagIcon, MapPinIcon, AdjustmentsHorizontalIcon, InformationCircleIcon // Додано InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';
import Joi from 'joi'; // Joi використовується у формі, переконайтесь, що він встановлений

const scheduleEntrySchema = Joi.object({
    title: Joi.string().min(3).max(255).required().messages({
        'string.empty': "Назва обов'язкова",
        'string.min': "Назва має бути не менше 3 символів",
        'string.max': "Назва не може перевищувати 255 символів"
    }),
    description: Joi.string().allow(null, "").max(2000).messages({
        'string.max': "Опис не може перевищувати 2000 символів"
    }),
    start_date: Joi.date().iso().required().messages({
        'any.required': "Дата початку обов'язкова",
        'date.format': "Невірний формат дати початку (YYYY-MM-DDTHH:mm)"
    }),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null, "").messages({ // Allow empty string for optional end date
        'date.min': "Дата закінчення має бути після або рівна даті початку",
        'date.format': "Невірний формат дати закінчення (YYYY-MM-DDTHH:mm)"
    }),
    target_group_type: Joi.string().valid('all', 'faculty', 'dormitory', 'course', 'group').allow(null, "").default('all'),
    target_group_id: Joi.number().integer().positive().allow(null, "").when('target_group_type', {
        is: Joi.valid('faculty', 'dormitory', 'group', 'course'), // Added 'course'
        then: Joi.when('target_group_type', { // Conditional based on type
            is: 'course',
            then: Joi.number().integer().min(1).max(6).required(), // For 'course' type, it's a number 1-6
            otherwise: Joi.number().integer().positive().required() // For 'faculty', 'dormitory', 'group' it's an ID
        }),
        otherwise: Joi.optional().allow(null, "") // Allow empty string if not required
    }).messages({
        'any.required': "ID цільової групи або номер курсу обов'язковий для обраного типу",
        'number.min': "Номер курсу має бути від 1 до 6",
        'number.max': "Номер курсу має бути від 1 до 6"
    }),
    location: Joi.string().allow(null, "").max(255),
    color_tag: Joi.string().allow(null, "").max(7).pattern(/^#([0-9A-Fa-f]{3}){1,2}$/).messages({
        'string.pattern.base': "Колір має бути в форматі #RGB або #RRGGBB"
    })
});

const ScheduleEntryFormModal = ({ entry, onClose, onSuccess, faculties, dormitories, isLoadingForm }) => {
    const [formData, setFormData] = useState({
        title: entry?.title || '',
        description: entry?.description || '',
        start_date: entry?.start_date ? new Date(entry.start_date).toISOString().substring(0, 16) : '',
        end_date: entry?.end_date ? new Date(entry.end_date).toISOString().substring(0, 16) : '',
        target_group_type: entry?.target_group_type || 'all',
        target_group_id: entry?.target_group_id || '',
        location: entry?.location || '',
        color_tag: entry?.color_tag || '',
    });
    const [formErrors, setFormErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'target_group_type' && !['faculty', 'dormitory', 'group', 'course'].includes(value)) {
            setFormData(prev => ({ ...prev, target_group_id: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});
        // Prepare data for validation, ensuring optional end_date is null if empty
        const dataToValidate = {
            ...formData,
            end_date: formData.end_date || null,
            target_group_id: formData.target_group_id || null,
            color_tag: formData.color_tag || null,
            location: formData.location || null,
            description: formData.description || null,
        };


        const { error, value: validatedValue } = scheduleEntrySchema.validate(dataToValidate, { abortEarly: false });
        
        if (error) {
            const newErrors = {};
            error.details.forEach(detail => newErrors[detail.path[0]] = detail.message);
            setFormErrors(newErrors);
            ToastService.error("Будь ласка, виправте помилки у формі.");
            return;
        }
        
        // Use validatedValue which has defaults applied and types coerced by Joi
        const payload = {
            ...validatedValue,
            target_group_id: ['faculty', 'dormitory', 'group', 'course'].includes(validatedValue.target_group_type) && validatedValue.target_group_id ? Number(validatedValue.target_group_id) : null,
        };
        
        if (payload.target_group_type === 'all') {
            payload.target_group_id = null; // Ensure target_group_id is null if type is 'all'
        }


        onSuccess(true); // Indicate form submission is in progress
        try {
            if (entry?.id) {
                await api.put(`/admin/settlement-schedule/${entry.id}`, payload);
                ToastService.success("Запис оновлено");
            } else {
                await api.post("/admin/settlement-schedule", payload);
                ToastService.success("Запис створено");
            }
            onSuccess(false, true); // Indicate submission finished, successfully
        } catch (apiError) {
            ToastService.handleApiError(apiError);
            onSuccess(false, false); // Indicate submission finished, with error
        }
    };

    return (
        <div className={styles.modalInnerContent}>
            <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{entry?.id ? "Редагувати Запис" : "Створити Запис"}</h2>
            </div>
            <form onSubmit={handleSubmit}>
                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label htmlFor="title">Назва *</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} disabled={isLoadingForm} className={formErrors.title ? styles.inputError : ""} />
                        {formErrors.title && <p className={styles.errorMessage}>{formErrors.title}</p>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="start_date">Дата/Час Початку *</label>
                        <input type="datetime-local" id="start_date" name="start_date" value={formData.start_date} onChange={handleChange} disabled={isLoadingForm} className={formErrors.start_date ? styles.inputError : ""} />
                        {formErrors.start_date && <p className={styles.errorMessage}>{formErrors.start_date}</p>}
                    </div>
                     <div className={styles.formGroup}>
                        <label htmlFor="end_date">Дата/Час Закінчення</label>
                        <input type="datetime-local" id="end_date" name="end_date" value={formData.end_date} onChange={handleChange} disabled={isLoadingForm} className={formErrors.end_date ? styles.inputError : ""} />
                        {formErrors.end_date && <p className={styles.errorMessage}>{formErrors.end_date}</p>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="target_group_type">Тип Цільової Групи</label>
                        <select id="target_group_type" name="target_group_type" value={formData.target_group_type} onChange={handleChange} disabled={isLoadingForm}>
                            <option value="all">Усі</option>
                            <option value="faculty">Факультет</option>
                            <option value="dormitory">Гуртожиток</option>
                            <option value="course">Курс</option>
                            {/* <option value="group">Група</option>  Групи поки що не реалізовані для вибору */}
                        </select>
                    </div>
                    {['faculty', 'dormitory'/*, 'group'*/].includes(formData.target_group_type) && (
                        <div className={styles.formGroup}>
                            <label htmlFor="target_group_id">
                                {formData.target_group_type === 'faculty' && 'Факультет *'}
                                {formData.target_group_type === 'dormitory' && 'Гуртожиток *'}
                                {/* {formData.target_group_type === 'group' && 'Група *'} */}
                            </label>
                            <select id="target_group_id" name="target_group_id" value={formData.target_group_id} onChange={handleChange} disabled={isLoadingForm} className={formErrors.target_group_id ? styles.inputError : ""}>
                                <option value="">Оберіть...</option>
                                {formData.target_group_type === 'faculty' && faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                {formData.target_group_type === 'dormitory' && dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                {/* Groups would need dynamic fetching based on faculty, more complex for this stub */}
                            </select>
                            {formErrors.target_group_id && <p className={styles.errorMessage}>{formErrors.target_group_id}</p>}
                        </div>
                    )}
                    {formData.target_group_type === 'course' && (
                         <div className={styles.formGroup}>
                            <label htmlFor="target_group_id">Номер Курсу *</label>
                            <input type="number" id="target_group_id" name="target_group_id" value={formData.target_group_id} onChange={handleChange} disabled={isLoadingForm} min="1" max="6" className={formErrors.target_group_id ? styles.inputError : ""} />
                            {formErrors.target_group_id && <p className={styles.errorMessage}>{formErrors.target_group_id}</p>}
                        </div>
                    )}
                    <div className={styles.formGroup}>
                        <label htmlFor="location">Місцезнаходження</label>
                        <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} disabled={isLoadingForm} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="color_tag">Тег Кольору</label>
                        <div className={styles.colorPickerWrapper}>
                            <input type="color" id="color_tag_picker" value={formData.color_tag || '#ffffff'} onChange={(e) => setFormData(prev => ({...prev, color_tag: e.target.value}))} style={{width: '40px', height: '40px', padding: '0', border: '1px solid var(--border-color)', cursor: 'pointer' }} disabled={isLoadingForm}/>
                            <input type="text" id="color_tag" name="color_tag" value={formData.color_tag} onChange={handleChange} disabled={isLoadingForm} placeholder="#RRGGBB" className={`${styles.colorTagInput} ${formErrors.color_tag ? styles.inputError : ""}`} />
                        </div>
                        {formErrors.color_tag && <p className={styles.errorMessage}>{formErrors.color_tag}</p>}
                    </div>
                     <div className={styles.formGroup}>
                        <label htmlFor="description">Опис</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" disabled={isLoadingForm}></textarea>
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <button type="button" onClick={onClose} className={`${styles.formButton} ${styles.cancelButton}`} disabled={isLoadingForm}>Скасувати</button>
                    <button type="submit" className={`${styles.formButton} ${styles.submitButton}`} disabled={isLoadingForm}>{isLoadingForm ? "Збереження..." : "Зберегти"}</button>
                </div>
            </form>
        </div>
    );
};

const ManageSettlementSchedulePage = () => {
    const { user } = useUser();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => JSON.parse(localStorage.getItem("sidebarOpen") || "true"));
    const [scheduleEntries, setScheduleEntries] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [allFaculties, setAllFaculties] = useState([]);
    const [allDormitories, setAllDormitories] = useState([]);

    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const [entriesRes, facultiesRes, dormsRes] = await Promise.all([
                api.get("/admin/settlement-schedule"),
                api.get("/faculties"),
                api.get("/dormitories")
            ]);
            setScheduleEntries(entriesRes.data || []);
            setAllFaculties(facultiesRes.data || []);
            setAllDormitories(dormsRes.data || []);
        } catch (error) {
            ToastService.handleApiError(error);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    useEffect(() => {
        if(user) fetchData();
    }, [user, fetchData]);

    const handleAddEntry = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEditEntry = (entry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDeleteEntry = async (id) => {
        if (window.confirm("Ви впевнені, що хочете видалити цей запис?")) {
            setActionLoading(true);
            try {
                await api.delete(`/admin/settlement-schedule/${id}`);
                ToastService.success("Запис видалено");
                fetchData(); // Refresh data
            } catch (error) {
                ToastService.handleApiError(error);
            } finally {
                setActionLoading(false);
            }
        }
    };
    
    const handleModalFormSuccess = (isSubmitting, wasSuccessful) => {
        setFormSubmitting(isSubmitting);
        if (!isSubmitting && wasSuccessful) {
            fetchData(); // Refresh data on successful save
            setIsModalOpen(false);
            setEditingEntry(null);
        }
    };


    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('uk-UA', {dateStyle: 'medium', timeStyle: 'short'}) : 'Не вказано';
    
    const formatTargetGroup = (entry) => {
        if (!entry) return 'N/A';
        if (entry.target_group_type === 'all' || !entry.target_group_type) return 'Усі';
        
        let name = '';
        if (entry.target_group_type === 'faculty') {
            const faculty = allFaculties.find(f => f.id === entry.target_group_id);
            name = faculty ? faculty.name : `ID: ${entry.target_group_id}`;
            return `Факультет: ${name}`;
        }
        if (entry.target_group_type === 'dormitory') {
            const dormitory = allDormitories.find(d => d.id === entry.target_group_id);
            name = dormitory ? dormitory.name : `ID: ${entry.target_group_id}`;
            return `Гуртожиток: ${name}`;
        }
        if (entry.target_group_type === 'course') return `Курс: ${entry.target_group_id}`;
        if (entry.target_group_type === 'group') return `Група ID: ${entry.target_group_id}`; // Group name would require another fetch or join
        
        return `${entry.target_group_type}${entry.target_group_id ? ': ' + entry.target_group_id : ''}`;
    };


    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} />
                <main className={styles.pageContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}><CalendarDaysIcon className={styles.titleIcon} /> Керування Розкладом Поселення</h1>
                        <button onClick={handleAddEntry} className={styles.actionButtonMain} disabled={isLoadingData || actionLoading}>
                            <PlusIcon className={styles.buttonIcon} /> Створити Запис
                        </button>
                    </div>
                    <div className={styles.contentWrapper}>
                        {isLoadingData ? (
                            <div className={styles.loading}>Завантаження...</div>
                        ) : scheduleEntries.length === 0 ? (
                            <div className={styles.emptyMessage}><InformationCircleIcon className={styles.titleIcon} /><p>Записів у розкладі немає.</p></div>
                        ) : (
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Назва</th>
                                            <th>Початок</th>
                                            <th>Кінець</th>
                                            <th>Локація</th>
                                            <th>Цільова група</th>
                                            <th>Колір</th>
                                            <th className={styles.actionsHeader}>Дії</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scheduleEntries.map(entry => (
                                            <tr key={entry.id}>
                                                <td>{entry.id}</td>
                                                <td title={entry.title} className={styles.titleCell}>{entry.title}</td>
                                                <td>{formatDate(entry.start_date)}</td>
                                                <td>{formatDate(entry.end_date)}</td>
                                                <td>{entry.location || 'N/A'}</td>
                                                <td>{formatTargetGroup(entry)}</td>
                                                <td>
                                                    {entry.color_tag && <div style={{backgroundColor: entry.color_tag, width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #ccc', margin: 'auto'}}></div>}
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <button onClick={() => handleEditEntry(entry)} className={`${styles.actionButton} ${styles.editButton}`} title="Редагувати" disabled={actionLoading}><PencilIcon/></button>
                                                    <button onClick={() => handleDeleteEntry(entry.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Видалити" disabled={actionLoading}><TrashIcon/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            {isModalOpen && (
                <div className={styles.modalOverlayGlobal} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()} style={{maxWidth: '650px'}}>
                        <button onClick={() => setIsModalOpen(false)} className={styles.closeButtonIconGlobal}><CloseModalIcon /></button>
                        <ScheduleEntryFormModal 
                            entry={editingEntry} 
                            onClose={() => setIsModalOpen(false)} 
                            onSuccess={handleModalFormSuccess}
                            faculties={allFaculties}
                            dormitories={allDormitories}
                            isLoadingForm={formSubmitting}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSettlementSchedulePage;