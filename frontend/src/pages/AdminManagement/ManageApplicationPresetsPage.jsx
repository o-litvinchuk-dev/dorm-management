import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import adminStyles from "./styles/AdminManagementPage.module.css"; // General layout styles
import presetStyles from "./styles/ManageApplicationPresetsPage.module.css"; // Styles for this page and its form
import { PlusIcon, PencilIcon, TrashIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

const ApplicationPresetForm = ({ preset, onClose, onSuccess, dormitories, faculties }) => {
    const { user } = useUser();
    const [formData, setFormData] = useState({
        dormitory_id: preset?.dormitory_id || "",
        faculty_id: preset?.faculty_id || (user?.role === 'faculty_dean_office' ? user.faculty_id : ""), 
        academic_year: preset?.academic_year || "",
        start_date: preset?.start_date ? preset.start_date.split('T')[0] : "",
        end_date: preset?.end_date ? preset.end_date.split('T')[0] : "",
        application_date: preset?.application_date ? preset.application_date.split('T')[0] : "",
        default_comments: preset?.default_comments || "",
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!formData.dormitory_id) newErrors.dormitory_id = "Гуртожиток обов'язковий";
        if (!formData.academic_year) newErrors.academic_year = "Академічний рік обов'язковий";
        else if (!/^\d{4}-\d{4}$/.test(formData.academic_year)) newErrors.academic_year = "Формат РРРР-РРРР";
        
        if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
            newErrors.end_date = "Дата закінчення має бути після дати початку";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        // Ensure faculty_id is correctly set for deans, even if the select is not shown/editable for them
        let facultyIdToSend = formData.faculty_id ? parseInt(formData.faculty_id) : null;
        if (user.role === 'faculty_dean_office' && user.faculty_id) {
            facultyIdToSend = user.faculty_id;
        }

        const payload = {
            ...formData,
            faculty_id: facultyIdToSend,
            dormitory_id: parseInt(formData.dormitory_id),
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            application_date: formData.application_date || null,
        };

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
    
    const filteredDormitories = user.role === 'faculty_dean_office' && user.faculty_id
        ? dormitories.filter(d => d.faculty_links?.some(fl => fl.faculty_id === user.faculty_id))
        : dormitories;


    return (
        <div className={presetStyles.modalOverlay}>
            <div className={presetStyles.modal}>
                <form onSubmit={handleSubmit} className={presetStyles.form}>
                    <h2>{preset?.id ? "Редагувати налаштування" : "Створити налаштування"}</h2>
                    
                    <label className={presetStyles.label}>Гуртожиток:</label>
                    <select name="dormitory_id" value={formData.dormitory_id} onChange={handleChange} required className={presetStyles.select}>
                        <option value="">Виберіть гуртожиток</option>
                        {filteredDormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {errors.dormitory_id && <p className={presetStyles.errorText}>{errors.dormitory_id}</p>}

                    {(user.role === 'admin' || user.role === 'superadmin') && (
                         <>
                            <label className={presetStyles.label}>Факультет (необов'язково):</label>
                            <select name="faculty_id" value={formData.faculty_id} onChange={handleChange} className={presetStyles.select}>
                                <option value="">Для всіх факультетів</option>
                                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                         </>
                    )}
                     {user.role === 'faculty_dean_office' && (
                         <>
                            <label className={presetStyles.label}>Факультет:</label>
                            <input type="text" value={user.faculty_name || ""} disabled className={presetStyles.input}/>
                            {/* faculty_id is set in initial state and payload for deans */}
                         </>
                    )}


                    <label className={presetStyles.label}>Академічний рік (РРРР-РРРР):</label>
                    <input type="text" name="academic_year" value={formData.academic_year} onChange={handleChange} placeholder="2024-2025" required className={presetStyles.input}/>
                    {errors.academic_year && <p className={presetStyles.errorText}>{errors.academic_year}</p>}
                    
                    <label className={presetStyles.label}>Дата початку проживання:</label>
                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={presetStyles.input}/>
                    {errors.start_date && <p className={presetStyles.errorText}>{errors.start_date}</p>}

                    <label className={presetStyles.label}>Дата кінця проживання:</label>
                    <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={presetStyles.input}/>
                    {errors.end_date && <p className={presetStyles.errorText}>{errors.end_date}</p>}

                    <label className={presetStyles.label}>Дата подачі заяви (типова):</label>
                    <input type="date" name="application_date" value={formData.application_date} onChange={handleChange} className={presetStyles.input}/>
                    {errors.application_date && <p className={presetStyles.errorText}>{errors.application_date}</p>}

                    <label className={presetStyles.label}>Коментарі за замовчуванням:</label>
                    <textarea name="default_comments" value={formData.default_comments} onChange={handleChange} className={presetStyles.textarea}></textarea>
                    
                    <div className={presetStyles.buttonGroup}>
                        <button type="submit" className={presetStyles.submitButton}><CalendarDaysIcon className={presetStyles.buttonIcon}/> Зберегти</button>
                        <button type="button" onClick={onClose} className={presetStyles.cancelButton}>Скасувати</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ManageApplicationPresetsPage = () => {
    const { user } = useUser();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => JSON.parse(localStorage.getItem("sidebarOpen") || "true"));
    const [presets, setPresets] = useState([]);
    const [dormitories, setDormitories] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const allDormsResponse = await api.get("/dormitories");
            let allDormitoriesData = allDormsResponse.data;

            if (user.role === 'faculty_dean_office' && user.faculty_id) {
                const facultyDormsLinksResponse = await api.get(`/faculty-dormitories?faculty_id=${user.faculty_id}`);
                const deanDormIds = facultyDormsLinksResponse.data.map(fd => fd.dormitory_id);
                
                allDormitoriesData = allDormitoriesData.map(dorm => ({
                    ...dorm,
                    // Add a flag or the actual links if needed by the form's filteredDormitories logic
                    faculty_links: facultyDormsLinksResponse.data.filter(link => link.dormitory_id === dorm.id) 
                })).filter(dorm => deanDormIds.includes(dorm.id)); // Filter for form dropdown
            }
            
            const [presetsRes, facsRes] = await Promise.all([
                api.get("/application-presets"), 
                (user.role === 'admin' || user.role === 'superadmin') ? api.get("/faculties") : Promise.resolve({data: []})
            ]);
            
            setDormitories(allDormitoriesData); 
            setFaculties(facsRes.data);
            setPresets(presetsRes.data);
        } catch (error) {
            ToastService.handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    useEffect(() => {
        if (user) { 
            fetchData();
        }
    }, [fetchData, user]);

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
            try {
                await api.delete(`/application-presets/${id}`);
                ToastService.success("Налаштування видалено");
                fetchData(); 
            } catch (error) {
                ToastService.handleApiError(error);
            }
        }
    };
    
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('uk-UA') : 'N/A';

    if (isLoading) return <div className={adminStyles.loading}>Завантаження...</div>;

    return (
        <div className={adminStyles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${adminStyles.mainContent} ${!isSidebarExpanded ? adminStyles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} />
                {/* Removed one wrapping div here that seemed extra */}
                <div className={presetStyles.pageContainer}>
                    <div className={presetStyles.header}>
                            <h1 className={presetStyles.pageTitle}>Налаштування параметрів заяв на поселення</h1>
                            <button onClick={handleAddPreset} className={`${presetStyles.addButton}`}>
                            <PlusIcon className={presetStyles.buttonIcon} /> Створити налаштування
                        </button>
                    </div>

                    {presets.length === 0 ? (
                        <p className={presetStyles.emptyMessage}>Налаштування ще не створені.</p>
                    ) : (
                        <div className={presetStyles.tableContainer}>
                            <table className={presetStyles.table}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Гуртожиток</th>
                                        <th>Факультет</th>
                                        <th>Академ. рік</th>
                                        <th>Початок прож.</th>
                                        <th>Кінець прож.</th>
                                        <th>Дата заяви</th>
                                        <th>Коментар</th>
                                        <th className={presetStyles.actionsHeader}>Дії</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {presets.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.id}</td>
                                            <td>{p.dormitory_name}</td>
                                            <td>{p.faculty_name || 'Для всіх'}</td>
                                            <td>{p.academic_year}</td>
                                            <td>{formatDate(p.start_date)}</td>
                                            <td>{formatDate(p.end_date)}</td>
                                            <td>{formatDate(p.application_date)}</td>
                                            <td title={p.default_comments} className={presetStyles.commentCell}>
                                                {p.default_comments?.substring(0,30)}{p.default_comments?.length > 30 ? '...' : ''}
                                            </td>
                                            <td className={presetStyles.actionsCell}>
                                                <button onClick={() => handleEditPreset(p)} className={`${presetStyles.actionButton} ${presetStyles.editButton}`} title="Редагувати">
                                                    <PencilIcon />
                                                </button>
                                                <button onClick={() => handleDeletePreset(p.id)} className={`${presetStyles.actionButton} ${presetStyles.deleteButton}`} title="Видалити">
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
                {/* This div was removed */}
            </div>
            {isModalOpen && (
                <ApplicationPresetForm
                    preset={editingPreset}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchData}
                    dormitories={dormitories}
                    faculties={faculties}
                />
            )}
        </div>
    );
};

export default ManageApplicationPresetsPage;