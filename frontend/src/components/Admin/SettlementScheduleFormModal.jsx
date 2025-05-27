import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import styles from './styles/SettlementScheduleFormModal.module.css'; // Переконайся, що стилі імпортуються правильно
import { CalendarDaysIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Joi from 'joi';
import { useUser } from '../../contexts/UserContext';

const scheduleEntrySchemaFE = Joi.object({
    title: Joi.string().min(3).max(255).required().messages({
        'string.empty': "Назва обов'язкова.",
        'string.min': "Назва має містити щонайменше 3 символи.",
        'string.max': "Назва не може перевищувати 255 символів."
    }),
    description: Joi.string().allow(null, "").max(2000).messages({'string.max': "Опис макс. 2000 символів"}),
    start_date: Joi.date().iso().required().messages({ 'any.required': "Дата та час початку обов'язкові.", 'date.format': "Невірний формат дати"}),
    end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null, "").messages({ 'date.min': "Дата закінчення має бути після дати початку.", 'date.format': "Невірний формат дати"}),
    location: Joi.string().allow(null, "").max(255).messages({'string.max': "Локація макс. 255 символів"}),
    color_tag: Joi.string().allow(null, "").max(7).pattern(/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/).messages({
        'string.pattern.base': "Колір має бути HEX (напр. #3b82f6)"
    }),
    target_group_type: Joi.string().valid('all', 'faculty', 'dormitory', 'course', 'group').allow(null).default('all').messages({
        'any.only': "Невірний тип цільової групи"
    }),
    target_group_id: Joi.number().integer().positive().allow(null, "").when('target_group_type', {
        is: Joi.valid('faculty', 'dormitory', 'group'),
        then: Joi.required().messages({'any.required': "ID цілі обов'язковий для цього типу"}),
        otherwise: Joi.when('target_group_type', {
            is: 'course',
            then: Joi.number().integer().min(1).max(6).required().messages({'any.required': "Курс (1-6) обов'язковий", 'number.min':'Мін. 1', 'number.max':'Макс. 6'}),
            otherwise: Joi.optional().allow(null, "") 
        })
    }),
    // temp_faculty_for_group: Joi.number().integer().positive().allow(null, "").optional() // Якщо групи будуть реалізовані
});


const SettlementScheduleFormModal = ({ entry, onClose, onFormSubmitSuccess, faculties, dormitories, allGroups, isLoadingForm }) => {
    const { user } = useUser();
    const [formData, setFormData] = useState({
        title: entry?.title || '',
        description: entry?.description || '',
        start_date: entry?.start_date ? new Date(entry.start_date).toISOString().substring(0, 16) : '',
        end_date: entry?.end_date ? new Date(entry.end_date).toISOString().substring(0, 16) : '',
        location: entry?.location || '',
        color_tag: entry?.color_tag || '#3b82f6', // Default color
        target_group_type: entry?.target_group_type || 'all',
        target_group_id: entry?.target_group_id ? String(entry.target_group_id) : '',
        // temp_faculty_for_group: entry?.group_faculty_id_for_validation ? String(entry.group_faculty_id_for_validation) : '' // Якщо групи будуть
    });
    const [formErrors, setFormErrors] = useState({});
    const [groupsForSelectedFaculty, setGroupsForSelectedFaculty] = useState([]);
    const [isFetchingGroups, setIsFetchingGroups] = useState(false);

    useEffect(() => {
        // Встановлення початкових значень на основі ролі, якщо це новий запис
        if (!entry?.id && user) {
            let newTargetType = 'all';
            let newTargetId = '';
            if (user.role === 'faculty_dean_office' && user.faculty_id) {
                newTargetType = 'faculty';
                newTargetId = String(user.faculty_id);
            } else if (user.role === 'dorm_manager' && user.dormitory_id) {
                newTargetType = 'dormitory';
                newTargetId = String(user.dormitory_id);
            }
            setFormData(prev => ({ ...prev, target_group_type: newTargetType, target_group_id: newTargetId }));
        }
    }, [entry, user]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'target_group_type') {
                newState.target_group_id = ''; 
                // newState.temp_faculty_for_group = ''; // Якщо групи будуть
                // Авто-вибір ID, якщо роль це дозволяє і тип змінюється на відповідний
                if (value === 'faculty' && user?.role === 'faculty_dean_office' && user.faculty_id) {
                    newState.target_group_id = String(user.faculty_id);
                } else if (value === 'dormitory' && user?.role === 'dorm_manager' && user.dormitory_id) {
                    newState.target_group_id = String(user.dormitory_id);
                }
            }
            // if (name === 'temp_faculty_for_group' && newState.target_group_type === 'group') { // Якщо групи будуть
            //     newState.target_group_id = ''; 
            // }
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});
        const dataToValidate = {
            ...formData,
            end_date: formData.end_date || null,
            color_tag: formData.color_tag || null,
            location: formData.location || null,
            description: formData.description || null,
            target_group_id: (formData.target_group_type === 'all' || !formData.target_group_id || String(formData.target_group_id).trim() === "" ) ? null : Number(formData.target_group_id),
        };

        const { error: validationError, value: validatedValue } = scheduleEntrySchemaFE.validate(dataToValidate, { abortEarly: false });
        
        if (validationError) {
            const newErrors = {};
            validationError.details.forEach(detail => {
                const path = detail.path.join('.');
                newErrors[path] = detail.message;
            });
            setFormErrors(newErrors);
            ToastService.error("Будь ласка, виправте помилки у формі.");
            return;
        }
        
        const { temp_faculty_for_group, ...payload } = validatedValue; // Видаляємо тимчасове поле
        
        onFormSubmitSuccess(true); 
        try {
            if (entry?.id) {
                await api.put(`/admin/settlement-schedule/${entry.id}`, payload);
                ToastService.success("Запис розкладу оновлено");
            } else {
                await api.post("/admin/settlement-schedule", payload);
                ToastService.success("Запис розкладу створено");
            }
            onFormSubmitSuccess(false, true);
        } catch (apiError) {
            ToastService.handleApiError(apiError);
            onFormSubmitSuccess(false, false);
        }
    };
    
    let targetTypeOptions = [
        { value: 'all', label: 'Усі (Загальний)' },
        { value: 'dormitory', label: 'Гуртожиток' },
        { value: 'faculty', label: 'Факультет' },
        { value: 'course', label: 'Курс' },
        // { value: 'group', label: 'Група' } // Якщо групи будуть
    ];

    if (user?.role === 'faculty_dean_office') {
        targetTypeOptions = [
            { value: 'faculty', label: `Мій Факультет (${user.faculty_name || ''})` },
            { value: 'course', label: 'Курс (в межах факультету)' },
            // { value: 'group', label: 'Група (в межах факультету)' } // Якщо групи будуть
        ];
    } else if (user?.role === 'dorm_manager') {
        targetTypeOptions = [
            { value: 'dormitory', label: `Мій Гуртожиток (${user.dormitory_name || `ID: ${user.dormitory_id}`})` }
        ];
    }
    
    return (
        <div className={styles.modalInnerContent}>
            <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}><CalendarDaysIcon className={styles.titleIcon}/>{entry?.id ? `Редагувати Запис ID: ${entry.id}` : "Створити Новий Запис Розкладу"}</h2>
            </div>
            <form onSubmit={handleSubmit}>
                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label htmlFor="title_schedule_form">Назва *</label>
                        <input type="text" id="title_schedule_form" name="title" value={formData.title} onChange={handleChange} required className={formErrors.title ? styles.inputError : ""} disabled={isLoadingForm}/>
                        {formErrors.title && <p className={styles.errorMessage}>{formErrors.title}</p>}
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label htmlFor="start_date_schedule_form">Дата/Час Початку *</label>
                            <input type="datetime-local" id="start_date_schedule_form" name="start_date" value={formData.start_date} onChange={handleChange} required className={formErrors.start_date ? styles.inputError : ""} disabled={isLoadingForm}/>
                            {formErrors.start_date && <p className={styles.errorMessage}>{formErrors.start_date}</p>}
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="end_date_schedule_form">Дата/Час Закінчення</label>
                            <input type="datetime-local" id="end_date_schedule_form" name="end_date" value={formData.end_date} onChange={handleChange} className={formErrors.end_date ? styles.inputError : ""} disabled={isLoadingForm}/>
                            {formErrors.end_date && <p className={styles.errorMessage}>{formErrors.end_date}</p>}
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="location_schedule_form">Місцезнаходження</label>
                        <input type="text" id="location_schedule_form" name="location" value={formData.location} onChange={handleChange} disabled={isLoadingForm} className={formErrors.location ? styles.inputError : ""}/>
                        {formErrors.location && <p className={styles.errorMessage}>{formErrors.location}</p>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="color_tag_schedule_form">Тег Кольору</label>
                        <div className={styles.colorPickerWrapper}>
                            <input type="color" id="color_tag_picker_schedule" value={formData.color_tag || '#3b82f6'} onChange={(e) => setFormData(prev => ({...prev, color_tag: e.target.value}))} style={{width: '40px', height: '40px', padding: '0', border: '1px solid var(--border-color)', cursor: 'pointer', borderRadius: 'var(--border-radius-sm)' }} disabled={isLoadingForm}/>
                            <input type="text" id="color_tag_schedule_form" name="color_tag" value={formData.color_tag} onChange={handleChange} placeholder="#RRGGBB" className={`${styles.colorTagInput} ${formErrors.color_tag ? styles.inputError : ""}`} disabled={isLoadingForm}/>
                        </div>
                        {formErrors.color_tag && <p className={styles.errorMessage}>{formErrors.color_tag}</p>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="target_group_type_schedule_form">Тип Цільової Групи</label>
                        <select id="target_group_type_schedule_form" name="target_group_type" value={formData.target_group_type} onChange={handleChange} className={`${styles.selectField} ${formErrors.target_group_type ? styles.inputError : ""}`} disabled={isLoadingForm}>
                            {targetTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        {formErrors.target_group_type && <p className={styles.errorMessage}>{formErrors.target_group_type}</p>}
                    </div>

                    { (user?.role === 'admin' || user?.role === 'superadmin') && formData.target_group_type === 'group' && (
                        <div className={styles.formGroup}>
                            {/* Логіка вибору факультету для групи, якщо вона буде */}
                        </div>
                    )}

                    {['faculty', 'dormitory'/*, 'group'*/].includes(formData.target_group_type) && (
                        <div className={styles.formGroup}>
                            <label htmlFor="target_group_id_schedule_form">
                                {formData.target_group_type === 'faculty' && 'Факультет *'}
                                {formData.target_group_type === 'dormitory' && 'Гуртожиток *'}
                                {/* {formData.target_group_type === 'group' && 'Група *'} */}
                            </label>
                            <select 
                                id="target_group_id_schedule_form" 
                                name="target_group_id" 
                                value={formData.target_group_id} 
                                onChange={handleChange}
                                disabled={isLoadingForm || 
                                    (formData.target_group_type === 'faculty' && user?.role === 'faculty_dean_office') ||
                                    (formData.target_group_type === 'dormitory' && user?.role === 'dorm_manager') 
                                    // || (formData.target_group_type === 'group' && isFetchingGroups)  // Якщо групи
                                    // || (formData.target_group_type === 'group' && groupsForSelectedFaculty.length === 0) // Якщо групи
                                }
                                className={`${styles.selectField} ${formErrors.target_group_id ? styles.inputError : ""}`}
                                required={['faculty', 'dormitory', 'group', 'course'].includes(formData.target_group_type)}
                            >
                                <option value="">
                                    {/* Логіка плейсхолдера для груп */}
                                    {`Оберіть ${targetTypeToLabel(formData.target_group_type)}...`}
                                </option>
                                {formData.target_group_type === 'faculty' && faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                {formData.target_group_type === 'dormitory' && dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                {/* {formData.target_group_type === 'group' && groupsForSelectedFaculty.map(g => <option key={g.id} value={g.id}>{g.name} (Курс: {g.course})</option>)} */}
                            </select>
                            {formErrors.target_group_id && <p className={styles.errorMessage}>{formErrors.target_group_id}</p>}
                        </div>
                    )}
                     {formData.target_group_type === 'course' && (
                         <div className={styles.formGroup}>
                            <label htmlFor="target_group_id_course">Номер Курсу *</label>
                            <input type="number" id="target_group_id_course" name="target_group_id" value={formData.target_group_id} onChange={handleChange} disabled={isLoadingForm} min="1" max="6" className={formErrors.target_group_id ? styles.inputError : ""} />
                            {formErrors.target_group_id && <p className={styles.errorMessage}>{formErrors.target_group_id}</p>}
                        </div>
                    )}
                    <div className={styles.formGroup}>
                        <label htmlFor="description_schedule_form">Опис</label>
                        <textarea id="description_schedule_form" name="description" value={formData.description} onChange={handleChange} rows="3" disabled={isLoadingForm} className={formErrors.description ? styles.inputError : ""}></textarea>
                        {formErrors.description && <p className={styles.errorMessage}>{formErrors.description}</p>}
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <button type="button" onClick={onClose} className={`${styles.formButton} ${styles.cancelButton}`} disabled={isLoadingForm}>
                        <XCircleIcon /> Скасувати
                    </button>
                    <button type="submit" className={`${styles.formButton} ${styles.submitButton}`} disabled={isLoadingForm}>
                        <CheckCircleIcon /> {isLoadingForm ? "Збереження..." : (entry?.id ? "Оновити Запис" : "Створити Запис")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettlementScheduleFormModal;