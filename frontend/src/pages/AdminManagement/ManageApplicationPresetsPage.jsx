import React, { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import adminStyles from "./styles/AdminManagementPage.module.css";
import presetStyles from "./styles/ManageApplicationPresetsPage.module.css";
import { PlusIcon, PencilIcon, TrashIcon, CalendarDaysIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

const ApplicationPresetForm = ({ preset, onClose, onSuccess, dormitories, faculties, currentUser }) => {
  const initialDormitoryId = currentUser?.role === 'dorm_manager' 
    ? (currentUser.dormitory_id || "") 
    : (preset?.dormitory_id || "");

  const initialFacultyId = (currentUser?.role === 'faculty_dean_office' && !preset?.id) 
    ? (currentUser.faculty_id || "")
    : (preset?.faculty_id || null);


  const [formData, setFormData] = useState({
    dormitory_id: initialDormitoryId,
    faculty_id: initialFacultyId,
    academic_year: preset?.academic_year || "",
    start_date: preset?.start_date ? preset.start_date.split('T')[0] : "",
    end_date: preset?.end_date ? preset.end_date.split('T')[0] : "",
    // application_date: preset?.application_date ? preset.application_date.split('T')[0] : "", // Видалено
    default_comments: preset?.default_comments || "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser?.role === 'dorm_manager' && currentUser.dormitory_id) {
      setFormData(prev => ({ ...prev, dormitory_id: currentUser.dormitory_id, faculty_id: null }));
    }
    if (currentUser?.role === 'faculty_dean_office' && currentUser.faculty_id && !preset?.id) {
      setFormData(prev => ({ ...prev, faculty_id: currentUser.faculty_id }));
    }
    if (currentUser?.role === 'faculty_dean_office' && preset?.id && preset.faculty_id) {
        setFormData(prev => ({...prev, faculty_id: preset.faculty_id}));
    }
  }, [currentUser, preset]);


  const validate = () => {
    const newErrors = {};
    if (!formData.dormitory_id) newErrors.dormitory_id = "Гуртожиток обов'язковий";
    if (!formData.academic_year) newErrors.academic_year = "Академічний рік обов'язковий";
    else if (!/^\d{4}-\d{4}$/.test(formData.academic_year)) newErrors.academic_year = "Формат РРРР-РРРР (наприклад 2024-2025)";
    
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = "Дата закінчення має бути після або рівна даті початку";
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
      // application_date: formData.application_date || null, // Видалено
    };
     // Видаляємо application_date з payload, якщо воно там є (старий код міг залишити)
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
    ? dormitories.filter(d => d.id === currentUser.dormitory_id) 
    : dormitories;


  return (
    <div className={presetStyles.modalOverlay}>
      <div className={presetStyles.modal}>
        <form onSubmit={handleSubmit} className={presetStyles.form}>
          <h2>{preset?.id ? "Редагувати налаштування" : "Створити нове налаштування"}</h2>
          
          <div className={presetStyles.formGroup}>
            <label className={presetStyles.label} htmlFor="dormitory_id_preset_form">Гуртожиток:</label>
            <select 
              id="dormitory_id_preset_form"
              name="dormitory_id" 
              value={formData.dormitory_id} 
              onChange={handleChange} 
              required 
              className={presetStyles.select}
              disabled={isDormManager && !!currentUser.dormitory_id} 
            >
              <option value="">Виберіть гуртожиток</option>
              {dormOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.dormitory_id && <p className={presetStyles.errorText}>{errors.dormitory_id}</p>}
          </div>

          { !isDormManager && (currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || isFacultyDean) &&
            <div className={presetStyles.formGroup}>
              <label className={presetStyles.label} htmlFor="faculty_id_preset_form">
                Факультет 
                {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && " (необов'язково, для глобального)"}
                {isFacultyDean && !preset?.id && " (Ваш факультет)"}
                {isFacultyDean && preset?.id && preset.faculty_id === currentUser.faculty_id && " (Ваш факультет)"}
                {isFacultyDean && preset?.id && preset.faculty_id && preset.faculty_id !== currentUser.faculty_id && " (Інший факультет - редагування заборонено)"}
                {isFacultyDean && preset?.id && !preset.faculty_id && " (Глобальний пресет)"}
              </label>
              <select 
                id="faculty_id_preset_form"
                name="faculty_id" 
                value={formData.faculty_id || ""} 
                onChange={handleChange} 
                className={presetStyles.select}
                disabled={
                    (isFacultyDean && preset?.id && preset.faculty_id && preset.faculty_id !== currentUser.faculty_id) || 
                    (isFacultyDean && !preset?.id && !!currentUser.faculty_id)
                }
              >
                <option value="">Для всіх факультетів / Глобальне</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          }


          <div className={presetStyles.formGroup}>
            <label className={presetStyles.label} htmlFor="academic_year_preset_form">Академічний рік (РРРР-РРРР):</label>
            <input 
              id="academic_year_preset_form"
              type="text" 
              name="academic_year" 
              value={formData.academic_year} 
              onChange={handleChange} 
              placeholder="2024-2025" 
              required 
              className={presetStyles.input}
            />
            {errors.academic_year && <p className={presetStyles.errorText}>{errors.academic_year}</p>}
          </div>

          <div className={presetStyles.formGroup}>
            <label className={presetStyles.label} htmlFor="start_date_preset_form">Дата початку проживання:</label>
            <input id="start_date_preset_form" type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={presetStyles.input}/>
            {errors.start_date && <p className={presetStyles.errorText}>{errors.start_date}</p>}
          </div>

          <div className={presetStyles.formGroup}>
            <label className={presetStyles.label} htmlFor="end_date_preset_form">Дата кінця проживання:</label>
            <input id="end_date_preset_form" type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={presetStyles.input}/>
            {errors.end_date && <p className={presetStyles.errorText}>{errors.end_date}</p>}
          </div>
          
          {/*
          <div className={presetStyles.formGroup}>
            <label className={presetStyles.label} htmlFor="application_date_preset_form">Дата подачі заяви (типова):</label>
            <input id="application_date_preset_form" type="date" name="application_date" value={formData.application_date} onChange={handleChange} className={presetStyles.input}/>
            {errors.application_date && <p className={presetStyles.errorText}>{errors.application_date}</p>}
          </div>
          */}

          <div className={presetStyles.formGroup}>
            <label className={presetStyles.label} htmlFor="default_comments_preset_form">Коментарі за замовчуванням:</label>
            <textarea id="default_comments_preset_form" name="default_comments" value={formData.default_comments} onChange={handleChange} className={presetStyles.textarea}></textarea>
          </div>

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
  const { user, isLoading: isUserLoading } = useUser();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => JSON.parse(localStorage.getItem("sidebarOpen") || "true"));
  const [presets, setPresets] = useState([]);
  const [dormitoriesForForm, setDormitoriesForForm] = useState([]); 
  const [facultiesForForm, setFacultiesForForm] = useState([]);   
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoadingData(true);
    try {
      let dormsToLoadForForm = [];
      if (user.role === 'dorm_manager' && user.dormitory_id) {
        const dormRes = await api.get(`/dormitories/${user.dormitory_id}`);
        if (dormRes.data) dormsToLoadForForm = [dormRes.data];
      } else if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'faculty_dean_office') {
        const allDormsResponse = await api.get("/dormitories");
        dormsToLoadForForm = allDormsResponse.data || [];
      }
      setDormitoriesForForm(dormsToLoadForForm);

      if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'faculty_dean_office') {
        const facsRes = await api.get("/faculties");
        setFacultiesForForm(facsRes.data || []);
      } else {
        setFacultiesForForm([]);
      }
      
      const presetsRes = await api.get("/application-presets");
      setPresets(presetsRes.data || []);

    } catch (error) {
      ToastService.handleApiError(error);
      setPresets([]); 
    } finally {
      setIsLoadingData(false);
    }
  }, [user]); 

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    if (user && !isUserLoading) {
      fetchData();
    }
  }, [fetchData, user, isUserLoading]); 

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
  
  if (isLoadingData || isUserLoading) return <div className={adminStyles.loading}>Завантаження...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={adminStyles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${adminStyles.mainContent} ${!isSidebarExpanded ? adminStyles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} />
        <div className={presetStyles.pageContainer}>
          <div className={presetStyles.header}>
            <h1 className={presetStyles.pageTitle}>
                <WrenchScrewdriverIcon className={presetStyles.titleIcon} />
                Налаштування Заяв
                {user.role === 'dorm_manager' && user.dormitory_name && ` для гуртожитку "${user.dormitory_name}"`}
                {user.role === 'faculty_dean_office' && user.faculty_name && ` для факультету "${user.faculty_name}"`}
            </h1>
            <button onClick={handleAddPreset} className={`${presetStyles.addButton}`}>
              <PlusIcon className={presetStyles.buttonIcon} /> Створити налаштування
            </button>
          </div>

          {presets.length === 0 && !isLoadingData ? (
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
                    {/* <th>Дата заяви</th> {/* Видалено */}
                    <th className={presetStyles.commentHeader}>Коментар за замовч.</th>
                    <th className={presetStyles.actionsHeader}>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {presets.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.dormitory_name}</td>
                      <td>{p.faculty_name || 'Для всіх / Глобальне'}</td>
                      <td>{p.academic_year}</td>
                      <td>{formatDate(p.start_date)}</td>
                      <td>{formatDate(p.end_date)}</td>
                      {/* <td>{formatDate(p.application_date)}</td> {/* Видалено */}
                      <td title={p.default_comments || ''} className={presetStyles.commentCell}>
                        {p.default_comments?.substring(0,30)}{p.default_comments && p.default_comments.length > 30 ? '...' : ''}
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
      </div>
      {isModalOpen && (
        <ApplicationPresetForm
          preset={editingPreset}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
          dormitories={dormitoriesForForm} 
          faculties={facultiesForForm}     
          currentUser={user}        
        />
      )}
    </div>
  );
};

export default ManageApplicationPresetsPage;