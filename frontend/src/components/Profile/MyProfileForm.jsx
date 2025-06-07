import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/MyProfileForm.module.css";
import Avatar from "../UI/Avatar/Avatar";
import AvatarEditor from 'react-avatar-editor';
import {
    UserCircleIcon, AcademicCapIcon, InformationCircleIcon,
    PencilIcon, XMarkIcon, CheckIcon, CakeIcon, PhoneIcon,
    BuildingOffice2Icon, UserGroupIcon, CameraIcon,
    SparklesIcon, CheckBadgeIcon,
    CheckCircleIcon // <<< ПОЧАТОК ВИПРАВЛЕННЯ: Додано відсутню іконку
} from "@heroicons/react/24/outline";

const InfoItem = ({ icon, label, children }) => (
    <div className={styles.infoItem}>
        <div className={styles.infoIconWrapper}>
            {React.cloneElement(icon, { className: styles.infoIcon })}
        </div>
        <div className={styles.infoTextWrapper}>
            <span className={styles.infoLabel}>{label}</span>
            <div className={styles.infoValue}>{children || "Не вказано"}</div>
        </div>
    </div>
);

const ImageEditorModal = ({ image, onSave, onClose, isAvatar = true }) => {
    const editorRef = useRef(null);
    const [zoom, setZoom] = useState(1.2);
    const handleSave = () => {
        if (editorRef.current) {
            const canvas = editorRef.current.getImageScaledToCanvas();
            canvas.toBlob((blob) => {
                onSave(blob);
                onClose();
            }, 'image/png', 0.95);
        }
    };
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h3>{isAvatar ? "Редагувати аватар" : "Редагувати банер"}</h3>
                <div className={styles.editorContainer}>
                    <AvatarEditor
                        ref={editorRef}
                        image={image}
                        width={isAvatar ? 250 : 400}
                        height={isAvatar ? 250 : 200}
                        border={50}
                        borderRadius={isAvatar ? 125 : 0}
                        color={[255, 255, 255, 0.6]}
                        scale={zoom}
                        rotate={0}
                    />
                </div>
                <div className={styles.zoomControls}>
                    <span>Масштаб:</span>
                    <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.01"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                    />
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.cancelButton}>Скасувати</button>
                    <button onClick={handleSave} className={`${styles.saveButton} ${styles.modalSaveButton}`}>Зберегти</button>
                </div>
            </div>
        </div>
    );
};

const MyProfileForm = ({ initialUserData, onUpdate, loading: propLoading }) => {
    const [editMode, setEditMode] = useState(false);
    const [faculties, setFaculties] = useState([]);
    const [groups, setGroups] = useState([]);
    const [dormitories, setDormitories] = useState([]);
    const [dataLoading, setDataLoading] = useState({ faculties: false, groups: false, dormitories: false });
    const [newAvatar, setNewAvatar] = useState(null);
    const [newBanner, setNewBanner] = useState(null);
    const [editorImage, setEditorImage] = useState(null);
    const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
    const [isBannerEditorOpen, setIsBannerEditorOpen] = useState(false);
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const isStudent = initialUserData?.role === "student";
    const isFacultyRole = ["faculty_dean_office", "student_council_head", "student_council_member", "admin", "superadmin"].includes(initialUserData?.role);
    const isDormManager = ["dorm_manager", "admin", "superadmin"].includes(initialUserData?.role);
    const profileCompleteness = initialUserData?.is_profile_complete ? 100 : 80;
    const validationSchema = Yup.object().shape({
        name: Yup.string().trim().max(255).required("Ім'я є обов'язковим."),
        phone: Yup.string().trim().matches(/^\+380\d{9}$/, "Формат: +380XXXXXXXXX.").nullable(),
        birthday: Yup.date().max(new Date(), 'Дата не може бути в майбутньому.').nullable(),
        aboutMe: Yup.string().trim().max(1000).nullable(),
        interests: Yup.string().trim().max(255).nullable(),
        faculty_id: Yup.number().when('role', {
            is: (role) => ["student", "faculty_dean_office", "student_council_head", "student_council_member"].includes(role),
            then: (schema) => schema.required("Факультет обов'язковий."),
        }),
        group_id: Yup.number().when('role', { is: 'student', then: (schema) => schema.required("Група обов'язкова.") }),
        dormitory_id: Yup.number().when('role', { is: 'dorm_manager', then: (schema) => schema.required("Гуртожиток обов'язковий.") }),
    });
    const formik = useFormik({
        initialValues: {
            name: initialUserData?.name || '',
            phone: initialUserData?.phone || '',
            birthday: initialUserData?.birthday ? new Date(initialUserData.birthday).toISOString().split('T')[0] : '',
            aboutMe: initialUserData?.about_me || '',
            interests: initialUserData?.interests || '',
            faculty_id: initialUserData?.faculty_id ? String(initialUserData.faculty_id) : '',
            group_id: initialUserData?.group_id ? String(initialUserData.group_id) : '',
            dormitory_id: initialUserData?.dormitory_id ? String(initialUserData.dormitory_id) : '',
            role: initialUserData?.role,
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            const payload = { ...values };
            Object.keys(payload).forEach(key => { if (payload[key] === '') payload[key] = null; });
            payload.about_me = payload.aboutMe;
            delete payload.aboutMe;
            const success = await onUpdate(payload, newAvatar, newBanner);
            if (success) {
                setEditMode(false);
                setNewAvatar(null);
                setNewBanner(null);
            }
        },
    });
    const handleFileChange = (e, isAvatar) => {
        const file = e.target.files[0];
        if (file) {
            setEditorImage(URL.createObjectURL(file));
            if (isAvatar) setIsAvatarEditorOpen(true);
            else setIsBannerEditorOpen(true);
            e.target.value = null;
        }
    };
    const handleCancel = useCallback(() => {
        formik.resetForm();
        setNewAvatar(null);
        setNewBanner(null);
        setEditMode(false);
    }, [formik]);
    useEffect(() => {
        if (editMode) {
            setDataLoading(prev => ({ ...prev, faculties: true, dormitories: true }));
            Promise.all([
                isFacultyRole ? api.get("/faculties") : Promise.resolve({ data: [] }),
                isDormManager ? api.get("/dormitories") : Promise.resolve({ data: [] })
            ]).then(([facultiesRes, dormitoriesRes]) => {
                setFaculties(facultiesRes.data || []);
                setDormitories(dormitoriesRes.data || []);
            }).catch(() => ToastService.error("Не вдалося завантажити довідники."))
                .finally(() => setDataLoading(prev => ({ ...prev, faculties: false, dormitories: false })));
        }
    }, [editMode, isFacultyRole, isDormManager]);
    useEffect(() => {
        if (isStudent && formik.values.faculty_id && editMode) {
            setDataLoading(prev => ({ ...prev, groups: true }));
            api.get(`/faculties/${formik.values.faculty_id}/groups`)
                .then(res => setGroups(res.data || []))
                .catch(() => setGroups([]))
                .finally(() => setDataLoading(prev => ({ ...prev, groups: false })));
        }
    }, [formik.values.faculty_id, isStudent, editMode]);
    const isLoading = propLoading || formik.isSubmitting || Object.values(dataLoading).some(Boolean);
    return (
        <div className={styles.profileContainer}>
            {isAvatarEditorOpen && <ImageEditorModal image={editorImage} onClose={() => setIsAvatarEditorOpen(false)} onSave={setNewAvatar} isAvatar={true} />}
            {isBannerEditorOpen && <ImageEditorModal image={editorImage} onClose={() => setIsBannerEditorOpen(false)} onSave={setNewBanner} isAvatar={false} />}
            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, true)} style={{ display: 'none' }} accept="image/*" />
            <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, false)} style={{ display: 'none' }} accept="image/*" />
            <div className={styles.profileBanner} style={{ backgroundImage: newBanner ? `url(${URL.createObjectURL(newBanner)})` : (initialUserData?.banner ? `url(${initialUserData.banner})` : 'var(--system-gradient, linear-gradient(135deg, var(--primary-color-light), var(--primary-color)))') }}>
                {editMode && <button type='button' className={styles.bannerEditButton} onClick={() => bannerInputRef.current.click()}><CameraIcon />Змінити банер</button>}
            </div>
            <div className={styles.profileHeader}>
                <div className={styles.headerAvatar}>
                    <Avatar user={{ ...initialUserData, avatar: newAvatar ? URL.createObjectURL(newAvatar) : initialUserData.avatar }} size={140} />
                    <div className={styles.statusDot} title="Онлайн"></div>
                    {editMode && <button type='button' className={styles.avatarEditButton} onClick={() => avatarInputRef.current.click()}><CameraIcon /></button>}
                </div>
                <div className={styles.headerInfo}>
                    <div className={styles.nameContainer}>
                        <h1>{initialUserData?.name || "Ім'я не вказано"}</h1>
                        <CheckBadgeIcon className={styles.verifiedIcon} title="Верифікований акаунт" />
                    </div>
                    <p>{initialUserData?.email}</p>
                    <div className={styles.socialLinksContainer}>
                        {initialUserData?.instagram && (
                            <a href={`https://instagram.com/${initialUserData.instagram}`} target="_blank" rel="noopener noreferrer">
                                <img src="/images/instagram-icon.svg" alt="Instagram" />
                            </a>
                        )}
                        {initialUserData?.telegram && (
                            <a href={`https://t.me/${initialUserData.telegram}`} target="_blank" rel="noopener noreferrer">
                                <img src="/images/telegram-icon.svg" alt="Telegram" />
                            </a>
                        )}
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button type="button" onClick={editMode ? handleCancel : () => setEditMode(true)} className={styles.editButton} disabled={isLoading}>
                        {editMode ? <XMarkIcon /> : <PencilIcon />}
                        {editMode ? "Скасувати" : "Редагувати"}
                    </button>
                </div>
            </div>
            <form className={styles.profileBody} onSubmit={formik.handleSubmit}>
                <div className={styles.leftColumn}>
                    <div className={styles.infoCard}>
                        <h3><InformationCircleIcon />Про себе</h3>
                        {editMode ? (
                            <textarea {...formik.getFieldProps('aboutMe')} rows="6" placeholder="Розкажіть трохи про себе..." />
                        ) : (
                            <p className={styles.aboutText}>{initialUserData?.about_me || "Інформація про себе не заповнена."}</p>
                        )}
                    </div>
                    <div className={styles.infoCard}>
                        <h3><SparklesIcon />Інтереси</h3>
                        {editMode ? (
                            <input {...formik.getFieldProps('interests')} placeholder="Наприклад: спорт, музика, читання..." />
                        ) : (
                            <div className={styles.tagsContainer}>
                                {(initialUserData?.interests || "Не вказано").split(',').map((tag, i) => (
                                    tag.trim() && <span key={i} className={styles.tag}>{tag.trim()}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={`${styles.infoCard} ${styles.completenessCard}`}>
                        <h3><CheckCircleIcon />Заповненість профілю</h3>
                        <div className={styles.progressWrapper}>
                            <div className={styles.progressBar} style={{ width: `${profileCompleteness}%` }}></div>
                        </div>
                        <span className={styles.progressText}>{profileCompleteness}%</span>
                        <p>Заповніть профіль, щоб отримати доступ до всіх можливостей системи.</p>
                    </div>
                </div>
                <div className={styles.rightColumn}>
                    <div className={styles.infoCard}>
                        <h3><UserCircleIcon />Інформація</h3>
                        <div className={styles.introList}>
                            {editMode ? (
                                <>
                                    <InfoItem icon={<UserCircleIcon />} label="ПІБ"><input {...formik.getFieldProps('name')} /></InfoItem>
                                    <InfoItem icon={<PhoneIcon />} label="Телефон"><input {...formik.getFieldProps('phone')} placeholder="+380XXXXXXXXX" /></InfoItem>
                                    <InfoItem icon={<CakeIcon />} label="Дата народження"><input type="date" {...formik.getFieldProps('birthday')} /></InfoItem>
                                    {(isStudent || isFacultyRole) && <InfoItem icon={<AcademicCapIcon />} label="Факультет">
                                        <select {...formik.getFieldProps('faculty_id')} disabled={dataLoading.faculties}>
                                            <option value="">{dataLoading.faculties ? "Завантаження..." : "Оберіть"}</option>
                                            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </InfoItem>}
                                    {isStudent && <InfoItem icon={<UserGroupIcon />} label="Група">
                                        <select {...formik.getFieldProps('group_id')} disabled={!formik.values.faculty_id || dataLoading.groups}>
                                            <option value="">Оберіть</option>
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </InfoItem>}
                                    {isDormManager && <InfoItem icon={<BuildingOffice2Icon />} label="Гуртожиток">
                                        <select {...formik.getFieldProps('dormitory_id')} disabled={dataLoading.dormitories}>
                                            <option value="">{dataLoading.dormitories ? "Завантаження..." : "Оберіть"}</option>
                                            {dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </InfoItem>}
                                </>
                            ) : (
                                <>
                                    <InfoItem icon={<AcademicCapIcon />} label="Факультет">{initialUserData?.faculty_name}</InfoItem>
                                    {isStudent && <InfoItem icon={<UserGroupIcon />} label="Група">{initialUserData?.group_name} ({initialUserData?.course} курс)</InfoItem>}
                                    {isDormManager && <InfoItem icon={<BuildingOffice2Icon />} label="Гуртожиток">{initialUserData?.dormitory_name}</InfoItem>}
                                    <InfoItem icon={<PhoneIcon />} label="Телефон">{initialUserData?.phone}</InfoItem>
                                    <InfoItem icon={<CakeIcon />} label="Дата народження">{initialUserData?.birthday ? new Date(initialUserData.birthday).toLocaleDateString("uk-UA") : null}</InfoItem>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {editMode && (
                    <div className={styles.saveButtonContainer}>
                        <button type="submit" className={styles.saveButton} disabled={isLoading || !formik.isValid || (!formik.dirty && !newAvatar && !newBanner)}>
                            <CheckIcon />
                            {isLoading ? "Збереження..." : "Зберегти зміни"}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default MyProfileForm;