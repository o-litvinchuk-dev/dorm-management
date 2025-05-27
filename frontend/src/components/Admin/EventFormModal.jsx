import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import styles from './styles/EventFormModal.module.css';
import { CalendarDaysIcon, XCircleIcon, CheckCircleIcon, PlusCircleIcon, TrashIcon, TagIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Joi from 'joi'; // Joi використовується для валідації в схемі
import { useFormik } from 'formik'; // Імпорт Formik
import { useUser } from '../../contexts/UserContext';

// Схеми валідації залишаються тими ж
const eventTargetSchemaFE = Joi.object({
    target_type: Joi.string().valid('all_settled', 'dormitory', 'faculty', 'course', 'group').required().messages({
        'any.required': "Тип цілі обов'язковий", 'any.only': "Невірний тип цілі"
    }),
    target_id: Joi.number().integer().positive().allow(null, "").when('target_type', {
        is: Joi.valid('faculty', 'dormitory', 'group'),
        then: Joi.required().messages({'any.required': "ID цілі обов'язковий для цього типу"}),
        otherwise: Joi.when('target_type', {
            is: 'course',
            then: Joi.number().integer().min(1).max(6).required().messages({'any.required': "Курс (1-6) обов'язковий", 'number.min':'Курс від 1', 'number.max':'Курс до 6'}),
            otherwise: Joi.optional().allow(null, "")
        })
    }),
    temp_faculty_for_group: Joi.number().integer().positive().allow(null, "").optional()
});

const eventSchemaFE = Joi.object({
    title: Joi.string().min(3).max(255).required().messages({
        'string.empty': "Назва події обов'язкова.",
        'string.min': "Назва події має містити щонайменше 3 символи.",
        'string.max': "Назва події не може перевищувати 255 символів."
    }),
    description: Joi.string().allow(null, "").max(5000).messages({'string.max': "Опис макс. 5000 символів"}),
    start_time: Joi.date().iso().required().messages({ 'any.required': "Дата та час початку обов'язкові.", 'date.format': "Невірний формат дати"}),
    end_time: Joi.date().iso().min(Joi.ref('start_time')).allow(null, "").messages({ 'date.min': "Дата закінчення має бути після дати початку.", 'date.format': "Невірний формат дати"}),
    location: Joi.string().allow(null, "").max(255).messages({'string.max': "Локація макс. 255 символів"}),
    color_tag: Joi.string().allow(null, "").max(7).pattern(/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/).messages({
        'string.pattern.base': "Колір має бути HEX (напр. #3b82f6)"
    }),
    category: Joi.string().allow(null, "").max(50).messages({'string.max': "Категорія макс. 50 символів"}),
    targets: Joi.array().items(eventTargetSchemaFE).min(0).optional().default([]),
});


const EventFormModal = ({ event, onClose, onSuccess, isLoadingForm: propIsLoadingForm, dormitories, faculties }) => {
    const { user } = useUser();
    const isDormManager = user?.role === 'dorm_manager';
    const isFacultyDean = user?.role === 'faculty_dean_office';

    const getInitialTargets = useCallback(() => {
        if (event?.targets && event.targets.length > 0) {
            return event.targets.map(t => ({
                ...t,
                target_id: t.target_id ? String(t.target_id) : '',
                temp_faculty_for_group: t.target_type === 'group' && t.faculty_id_for_group ? String(t.faculty_id_for_group) : (isFacultyDean ? String(user.faculty_id) : '')
            }));
        }
        if (isDormManager && user.dormitory_id) return [{ target_type: 'dormitory', target_id: String(user.dormitory_id), temp_faculty_for_group: '' }];
        if (isFacultyDean && user.faculty_id) return [{ target_type: 'faculty', target_id: String(user.faculty_id), temp_faculty_for_group: '' }];
        return [];
    }, [event, user, isDormManager, isFacultyDean]);
    
    const formik = useFormik({
        initialValues: {
            title: event?.title || '',
            description: event?.description || '',
            start_time: event?.start_time ? new Date(event.start_time).toISOString().substring(0, 16) : '',
            end_time: event?.end_time ? new Date(event.end_time).toISOString().substring(0, 16) : '',
            location: event?.location || '',
            color_tag: event?.color_tag || '#3b82f6',
            category: event?.category || '',
            targets: getInitialTargets()
        },
        enableReinitialize: true, // Важливо для оновлення initialValues при зміні 'event'
        onSubmit: async (values) => {
            const dataToValidate = {
                ...values,
                end_time: values.end_time || null,
                color_tag: values.color_tag || null,
                targets: values.targets.map(t => ({
                    ...t,
                    target_id: (t.target_type === 'all_settled' || !t.target_id || t.target_id === "null") ? null : Number(t.target_id)
                }))
            };
        
            const { error, value: validatedValue } = eventSchemaFE.validate(dataToValidate, { abortEarly: false });
        
            if (error) {
                const newErrors = {};
                error.details.forEach(detail => {
                    const path = detail.path.join('.');
                    newErrors[path] = detail.message;
                });
                formik.setErrors(newErrors); // Використовуємо setErrors від Formik
                ToastService.error("Будь ласка, виправте помилки у формі.");
                return;
            }
        
            const payload = {
                ...validatedValue,
                 targets: validatedValue.targets.map(t => ({ target_type: t.target_type, target_id: t.target_id }))
            };
            
            onSuccess(true); // isLoadingForm = true
            try {
                if (event?.id) {
                    await api.put(`/admin/events/${event.id}`, payload);
                    ToastService.success("Подію оновлено");
                } else {
                    await api.post("/admin/events", payload);
                    ToastService.success("Подію створено");
                }
                onSuccess(false, true); // isLoadingForm = false, wasSuccessful = true
            } catch (apiError) {
                ToastService.handleApiError(apiError);
                onSuccess(false, false); // isLoadingForm = false, wasSuccessful = false
            }
        },
    });
    
    // isLoadingForm тепер береться з пропсів, але Formik має свій isSubmitting
    const isLoading = propIsLoadingForm || formik.isSubmitting;

    const [groupsForTarget, setGroupsForTarget] = useState(() => formik.values.targets.map(() => []));
    const [isFetchingGroups, setIsFetchingGroups] = useState(false);
    const [facultyDormitories, setFacultyDormitories] = useState([]);

    useEffect(() => {
        if (isFacultyDean && user.faculty_id) {
            api.get(`/faculty-dormitories?faculty_id=${user.faculty_id}`)
                .then(res => setFacultyDormitories(res.data || []))
                .catch(err => ToastService.handleApiError(err));
        }
    }, [isFacultyDean, user?.faculty_id]);

    const fetchGroupsForFaculty = useCallback(async (facultyId, targetIndex) => {
        if (!facultyId) {
            setGroupsForTarget(prev => {
                const newGroups = [...prev];
                newGroups[targetIndex] = [];
                return newGroups;
            });
            formik.setFieldValue(`targets[${targetIndex}].target_id`, '');
            return;
        }
        setIsFetchingGroups(true);
        try {
            const response = await api.get(`/faculties/${facultyId}/groups`);
             setGroupsForTarget(prev => {
                const newGroups = [...prev];
                newGroups[targetIndex] = response.data || [];
                return newGroups;
            });
        } catch (error) {
            ToastService.handleApiError(error);
            setGroupsForTarget(prev => {
                const newGroups = [...prev];
                newGroups[targetIndex] = [];
                return newGroups;
            });
        } finally {
            setIsFetchingGroups(false);
        }
    }, [formik]);

     useEffect(() => {
        const newGroupsForTarget = formik.values.targets.map(() => []);
        let needsUpdate = false;
        const promises = formik.values.targets.map((target, index) => {
            if (target.target_type === 'group' && target.temp_faculty_for_group) {
                if (!groupsForTarget[index] || groupsForTarget[index].length === 0) { // Fetch only if not already fetched or empty
                    needsUpdate = true;
                    return api.get(`/faculties/${target.temp_faculty_for_group}/groups`)
                        .then(response => { newGroupsForTarget[index] = response.data || []; })
                        .catch(() => { newGroupsForTarget[index] = []; }); // Handle error for individual fetch
                } else {
                     newGroupsForTarget[index] = groupsForTarget[index]; // Keep existing if already there
                }
            }
            return Promise.resolve();
        });
        if(needsUpdate){
             Promise.all(promises).then(() => {
                setGroupsForTarget(newGroupsForTarget);
            });
        }

    }, [formik.values.targets]); // Removed fetchGroupsForFaculty from deps

    const handleChangeTargetField = (index, field, value) => {
        const targetPath = `targets[${index}].${field}`;
        formik.setFieldValue(targetPath, value);
    
        if (field === 'target_type') {
            formik.setFieldValue(`targets[${index}].target_id`, ''); 
            formik.setFieldValue(`targets[${index}].temp_faculty_for_group`, isFacultyDean ? String(user.faculty_id) : '');
            setGroupsForTarget(prev => {
                const newGroups = [...prev];
                newGroups[index] = [];
                return newGroups;
            });
            if (value === 'group' && (isFacultyDean || formik.values.targets[index].temp_faculty_for_group)) {
                 fetchGroupsForFaculty(isFacultyDean ? user.faculty_id : formik.values.targets[index].temp_faculty_for_group, index);
            }
        }
        if (field === 'temp_faculty_for_group' && formik.values.targets[index].target_type === 'group') {
            fetchGroupsForFaculty(value, index);
            formik.setFieldValue(`targets[${index}].target_id`, '');
        }
    };
    
    const handleAddTarget = () => {
        if (isDormManager) return;
        const newTarget = { 
            target_type: isFacultyDean ? 'faculty' : 'all_settled', 
            target_id: isFacultyDean ? String(user.faculty_id) : '', 
            temp_faculty_for_group: isFacultyDean ? String(user.faculty_id) : ''
        };
        formik.setFieldValue('targets', [...formik.values.targets, newTarget]);
        setGroupsForTarget(prev => [...prev, []]);
    };

    const handleRemoveTarget = (index) => {
        if (isDormManager || (isFacultyDean && formik.values.targets.length === 1 && formik.values.targets[0].target_type === 'faculty' && String(formik.values.targets[0].target_id) === String(user.faculty_id))) {
            return;
        }
        const newTargets = formik.values.targets.filter((_, i) => i !== index);
        formik.setFieldValue('targets', newTargets);
        setGroupsForTarget(prev => prev.filter((_,i) => i !== index));
    };

    let targetTypeOptions = [
        { value: 'all_settled', label: 'Усі поселені' },
        { value: 'dormitory', label: 'Гуртожиток' },
        { value: 'faculty', label: 'Факультет' },
        { value: 'course', label: 'Курс' },
        { value: 'group', label: 'Група' }
    ];

    if (isFacultyDean) {
        targetTypeOptions = [
            { value: 'faculty', label: `Мій Факультет (${user.faculty_name || ''})` },
            { value: 'course', label: 'Курс (в межах факультету)' },
            { value: 'group', label: 'Група (в межах факультету)' },
            { value: 'dormitory', label: 'Гуртожиток (закріплений за факультетом)' }
        ];
    }
    if (isDormManager) {
         targetTypeOptions = [{ value: 'dormitory', label: `Мій гуртожиток: ${user.dormitory_name || `ID ${user.dormitory_id}`}` }];
    }
    
    return (
        <div className={styles.modalInnerContent}>
            <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                    <CalendarDaysIcon className={styles.modalTitleIcon} />
                    {event?.id ? `Редагувати Подію ID: ${event.id}` : "Створити Нову Подію"}
                </h2>
            </div>
            <form onSubmit={formik.handleSubmit}>
                <div className={styles.modalBody}>
                    <div className={styles.formGrid}>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label htmlFor="title_event_form">Назва *</label>
                            <input type="text" id="title_event_form" name="title" value={formik.values.title} onChange={formik.handleChange} onBlur={formik.handleBlur} required className={formik.touched.title && formik.errors.title ? styles.inputError : ""} disabled={isLoading}/>
                            {formik.touched.title && formik.errors.title && <p className={styles.errorMessage}>{formik.errors.title}</p>}
                        </div>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label htmlFor="description_event_form">Опис</label>
                            <textarea id="description_event_form" name="description" value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur} rows="3" disabled={isLoading} className={formik.touched.description && formik.errors.description ? styles.inputError : ""}></textarea>
                            {formik.touched.description && formik.errors.description && <p className={styles.errorMessage}>{formik.errors.description}</p>}
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="start_time_event_form">Дата/Час Початку *</label>
                            <input type="datetime-local" id="start_time_event_form" name="start_time" value={formik.values.start_time} onChange={formik.handleChange} onBlur={formik.handleBlur} required className={formik.touched.start_time && formik.errors.start_time ? styles.inputError : ""} disabled={isLoading}/>
                            {formik.touched.start_time && formik.errors.start_time && <p className={styles.errorMessage}>{formik.errors.start_time}</p>}
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="end_time_event_form">Дата/Час Закінчення</label>
                            <input type="datetime-local" id="end_time_event_form" name="end_time" value={formik.values.end_time} onChange={formik.handleChange} onBlur={formik.handleBlur} className={formik.touched.end_time && formik.errors.end_time ? styles.inputError : ""} disabled={isLoading}/>
                            {formik.touched.end_time && formik.errors.end_time && <p className={styles.errorMessage}>{formik.errors.end_time}</p>}
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="location_event_form">Місцезнаходження</label>
                            <input type="text" id="location_event_form" name="location" value={formik.values.location} onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={isLoading} className={formik.touched.location && formik.errors.location ? styles.inputError : ""}/>
                            {formik.touched.location && formik.errors.location && <p className={styles.errorMessage}>{formik.errors.location}</p>}
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="category_event_form">Категорія</label>
                            <input type="text" id="category_event_form" name="category" value={formik.values.category} onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={isLoading} className={formik.touched.category && formik.errors.category ? styles.inputError : ""}/>
                            {formik.touched.category && formik.errors.category && <p className={styles.errorMessage}>{formik.errors.category}</p>}
                        </div>
                        <div className={styles.formGroup}>
                        <label htmlFor="color_tag_event_form">Тег Кольору</label>
                            <div className={styles.colorPickerWrapper}>
                                <input type="color" id="color_tag_picker_event" value={formik.values.color_tag || '#3b82f6'} onChange={(e) => formik.setFieldValue('color_tag', e.target.value)} style={{width: '40px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer' }} disabled={isLoading}/>
                                <input type="text" id="color_tag_event_form" name="color_tag" value={formik.values.color_tag} onChange={formik.handleChange} onBlur={formik.handleBlur} placeholder="#RRGGBB" className={`${styles.colorTagInput} ${formik.touched.color_tag && formik.errors.color_tag ? styles.inputError : ""}`} disabled={isLoading}/>
                            </div>
                            {formik.touched.color_tag && formik.errors.color_tag && <p className={styles.errorMessage}>{formik.errors.color_tag}</p>}
                        </div>
                    </div>
                    
                    <div className={styles.targetsSection}>
                        <h4 className={styles.targetsTitle}><UserGroupIcon/> Цільова аудиторія</h4>
                        {formik.values.targets.map((target, index) => (
                            <div key={index} className={styles.targetItem}>
                                <div className={styles.targetInputs}>
                                    <select 
                                        name={`targets[${index}].target_type`} 
                                        value={target.target_type} 
                                        onChange={(e) => handleChangeTargetField(index, 'target_type', e.target.value)}
                                        onBlur={() => formik.setFieldTouched(`targets[${index}].target_type`, true)}
                                        className={formik.touched.targets?.[index]?.target_type && formik.errors.targets?.[index]?.target_type ? styles.inputError : ""} 
                                        disabled={isLoading || isDormManager || (isFacultyDean && target.target_type === 'faculty' && String(target.target_id) === String(user.faculty_id) && formik.values.targets.length === 1)}
                                    >
                                        {targetTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>

                                    {isFacultyDean && target.target_type === 'group' && (
                                        <input type="text" value={user.faculty_name || `Факультет ID ${user.faculty_id}`} disabled className={styles.readOnlyFacultyInput}/>
                                    )}
                                    {(user?.role === 'admin' || user?.role === 'superadmin') && target.target_type === 'group' && (
                                        <select 
                                            name={`targets[${index}].temp_faculty_for_group`} 
                                            value={target.temp_faculty_for_group || ''} 
                                            onChange={(e) => handleChangeTargetField(index, 'temp_faculty_for_group', e.target.value)} 
                                            onBlur={() => formik.setFieldTouched(`targets[${index}].temp_faculty_for_group`, true)}
                                            disabled={isLoading || isFetchingGroups}
                                        >
                                            <option value="">Оберіть факультет для групи</option>
                                            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    )}

                                    {['dormitory', 'faculty', 'group', 'course'].includes(target.target_type) && (
                                        target.target_type === 'course' ? (
                                            <input type="number" name={`targets[${index}].target_id`} value={target.target_id} onChange={(e) => handleChangeTargetField(index, 'target_id', e.target.value)} onBlur={() => formik.setFieldTouched(`targets[${index}].target_id`, true)} placeholder="Курс (1-6)" min="1" max="6" className={formik.touched.targets?.[index]?.target_id && formik.errors.targets?.[index]?.target_id ? styles.inputError : ""} disabled={isLoading || (isFacultyDean && target.target_type === 'faculty')}/>
                                        ) : target.target_type === 'group' ? (
                                            <select 
                                                name={`targets[${index}].target_id`} 
                                                value={target.target_id} 
                                                onChange={(e) => handleChangeTargetField(index, 'target_id', e.target.value)} 
                                                onBlur={() => formik.setFieldTouched(`targets[${index}].target_id`, true)}
                                                disabled={isLoading || isFetchingGroups || (!target.temp_faculty_for_group && !isFacultyDean) || (groupsForTarget[index] && groupsForTarget[index].length === 0)}
                                                className={formik.touched.targets?.[index]?.target_id && formik.errors.targets?.[index]?.target_id ? styles.inputError : ""}
                                            >
                                                <option value="">{isFetchingGroups ? "Завантаження груп..." : ((groupsForTarget[index] && groupsForTarget[index].length === 0 && (target.temp_faculty_for_group || isFacultyDean)) ? "Немає груп" : "Оберіть групу")}</option>
                                                {(groupsForTarget[index] || []).map(g => <option key={g.id} value={g.id}>{g.name} ({g.course} курс)</option>)}
                                            </select>
                                        ) : ( 
                                            <select 
                                                name={`targets[${index}].target_id`} 
                                                value={target.target_id} 
                                                onChange={(e) => handleChangeTargetField(index, 'target_id', e.target.value)} 
                                                onBlur={() => formik.setFieldTouched(`targets[${index}].target_id`, true)}
                                                className={formik.touched.targets?.[index]?.target_id && formik.errors.targets?.[index]?.target_id ? styles.inputError : ""} 
                                                disabled={isLoading || (isDormManager && target.target_type === 'dormitory') || (isFacultyDean && target.target_type === 'faculty')}
                                            >
                                                <option value="">{`Оберіть ${target.target_type === 'faculty' ? 'факультет' : 'гуртожиток'}`}</option>
                                                {(target.target_type === 'faculty' ? faculties : (isFacultyDean ? facultyDormitories.map(fd => ({id: fd.dormitory_id, name: fd.dormitory_name})) : dormitories )).map(opt => 
                                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                )}
                                            </select>
                                        )
                                    )}
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveTarget(index)} 
                                    className={styles.removeTargetButton} 
                                    disabled={isLoading || isDormManager || (isFacultyDean && formik.values.targets.length === 1 && target.target_type === 'faculty' && String(target.target_id) === String(user.faculty_id)) }
                                    title="Видалити ціль"
                                >
                                    <TrashIcon/>
                                </button>
                                {formik.touched.targets?.[index]?.target_type && formik.errors.targets?.[index]?.target_type && <p className={`${styles.errorMessage} ${styles.targetErrorMessage}`}>{formik.errors.targets[index].target_type}</p>}
                                {formik.touched.targets?.[index]?.target_id && formik.errors.targets?.[index]?.target_id && <p className={`${styles.errorMessage} ${styles.targetErrorMessage}`}>{formik.errors.targets[index].target_id}</p>}
                            </div>
                        ))}
                        {(!isDormManager) && (
                            <button type="button" onClick={handleAddTarget} className={styles.addTargetButton} disabled={isLoading}>
                                <PlusCircleIcon/> Додати Ціль
                            </button>
                        )}
                    </div>

                </div>
                <div className={styles.modalFooter}>
                    <button type="button" onClick={onClose} className={`${styles.formButton} ${styles.cancelButton}`} disabled={isLoading}>
                        <XCircleIcon /> Скасувати
                    </button>
                    <button type="submit" className={`${styles.formButton} ${styles.submitButton}`} disabled={isLoading || !formik.isValid || (event && !formik.dirty && JSON.stringify(getInitialTargets()) === JSON.stringify(formik.values.targets))}>
                        <CheckCircleIcon /> {isLoading ? "Збереження..." : (event?.id ? "Оновити Подію" : "Створити Подію")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EventFormModal;