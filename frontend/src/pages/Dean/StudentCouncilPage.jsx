import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/StudentCouncilPage.module.css';
import { useUser } from '../../contexts/UserContext';
import Pagination from '../../components/Admin/Pagination';
import {
  UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon,
  XCircleIcon, InformationCircleIcon, UserPlusIcon,
  XMarkIcon as CloseModalIcon, AdjustmentsHorizontalIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import * as Yup from 'yup';
import { useFormik } from 'formik';

const StudentCouncilMemberFormModal = ({ member, facultyId, facultyName, onClose, onSuccess, isLoadingForm }) => {
  const [usersWithoutCouncilRole, setUsersWithoutCouncilRole] = useState([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const isEditing = !!member;
  
  const validationSchema = Yup.object({
    email: Yup.string().when('isEditing', {
      is: false,
      then: schema => schema.email("Невірний формат email").required("Email студента є обов'язковим"),
      otherwise: (schema) => schema.optional(),
    }),
    council_role: Yup.string()
      .oneOf(["student_council_head", "student_council_member"], "Невірна роль")
      .required("Роль у студраді обов'язкова"),
  });
  
  const formik = useFormik({
    initialValues: {
      email: member?.email || "",
      council_role: member?.role || "student_council_member",
      isEditing: isEditing,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (isLoadingForm) return;
      onSuccess(true); // Signal that form submission is in progress
      try {
        if (isEditing) {
          const payload = {
            role: values.council_role,
            facultyId: facultyId,
          };
          await api.put(`/users/${member.id}/role`, payload);
          ToastService.success("Роль члена студради оновлено");
        } else {
          const payload = {
            email: values.email,
            role: values.council_role,
            facultyId: facultyId,
          };
          await api.post('/users/assign-student-council', payload);
          ToastService.success("Члена студради додано");
        }
        onSuccess(false, true); // Signal success and trigger data refresh
      } catch (error) {
        ToastService.handleApiError(error);
        onSuccess(false, false); // Signal failure
      } finally {
        setSubmitting(false); // Formik specific
      }
    },
  });
  
  useEffect(() => {
    formik.setFieldValue('isEditing', isEditing);
  }, [isEditing]);

  return (
    <div className={styles.modalInnerContent}>
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>
          <UserPlusIcon className={styles.modalTitleIcon} />
          {isEditing ? `Редагувати члена студради: ${member.name}` : `Додати члена до студради факультету "${facultyName}"`}
        </h2>
      </div>
      <form onSubmit={formik.handleSubmit}>
        <div className={styles.modalBody}>
          {!isEditing ? (
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.inputLabel}>Email Студента *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`${styles.inputField} ${formik.touched.email && formik.errors.email ? styles.inputError : ""}`}
                placeholder="Введіть email студента"
                disabled={isLoadingForm}
              />
              {formik.touched.email && formik.errors.email ? (
                <div className={styles.errorMessage}>{formik.errors.email}</div>
              ) : null}
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label htmlFor="email_display" className={styles.inputLabel}>Email Студента</label>
              <input id="email_display" type="email" value={formik.values.email} className={styles.inputField} disabled={true} />
            </div>
          )}
          <div className={styles.formGroup}>
            <label htmlFor="council_role" className={styles.inputLabel}>Роль у студраді *</label>
            <select
              id="council_role"
              name="council_role"
              value={formik.values.council_role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`${styles.selectField} ${formik.touched.council_role && formik.errors.council_role ? styles.inputError : ""}`}
              disabled={isLoadingForm}
            >
              <option value="student_council_member">Член студради</option>
              <option value="student_council_head">Голова студради</option>
            </select>
            {formik.touched.council_role && formik.errors.council_role ? (
              <div className={styles.errorMessage}>{formik.errors.council_role}</div>
            ) : null}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={`${styles.formButton} ${styles.cancelButton}`} disabled={isLoadingForm || formik.isSubmitting}>
            <XCircleIcon /> Скасувати
          </button>
          <button type="submit" className={`${styles.formButton} ${styles.submitButton}`} disabled={isLoadingForm || formik.isSubmitting || !formik.isValid || (isEditing && !formik.dirty)}>
            <CheckCircleIcon /> {isLoadingForm || formik.isSubmitting ? "Збереження..." : (isEditing ? "Оновити" : "Додати")}
          </button>
        </div>
      </form>
    </div>
  );
};

const StudentCouncilPage = () => {
  const { user, isLoading: userIsLoading } = useUser();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => JSON.parse(localStorage.getItem("sidebarOpen") || "true"));
  const [councilMembers, setCouncilMembers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const initialFilters = useMemo(() => ({
    searchTerm: "",
    roleFilter: "",
    faculty_id: (user?.role === 'admin' || user?.role === 'superadmin') ? "" : user?.faculty_id || ""
  }), [user]);
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState({ sortBy: "name", sortOrder: "asc" });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [allFaculties, setAllFaculties] = useState([]);
  const [linkedFacultiesForDorm, setLinkedFacultiesForDorm] = useState([]);
  const isDormManager = user?.role === 'dorm_manager';
  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const facultyNameForDisplay = useMemo(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      if (filters.faculty_id) {
        const foundFaculty = allFaculties.find(f => String(f.id) === String(filters.faculty_id));
        return foundFaculty?.name || `Факультет ID: ${filters.faculty_id}`;
      }
      return "Всі факультети";
    } else if (user?.role === 'dorm_manager') {
      if (filters.faculty_id) {
        const foundFaculty = linkedFacultiesForDorm.find(f => String(f.id) === String(filters.faculty_id));
        return foundFaculty?.name || `Факультет ID: ${filters.faculty_id}`;
      }
      return "Всі пов'язані факультети";
    }
    return user?.faculty_name || "не визначено";
  }, [user, filters.faculty_id, allFaculties, linkedFacultiesForDorm]);

  const fetchCouncilMembers = useCallback(async () => {
    if (!user) {
      setIsLoadingData(false);
      return;
    }
    if (user.role === 'faculty_dean_office' && !user.faculty_id) {
      setError("Інформація про ваш факультет не визначена.");
      setIsLoadingData(false);
      setCouncilMembers([]);
      setPagination(prev => ({ ...prev, total: 0, page: 1 }));
      return;
    }

    setIsLoadingData(true);
    setError(null);
    try {
      const params = {
        role: filters.roleFilter || "student_council_head,student_council_member",
        search: filters.searchTerm || undefined,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      };

      let facultyIdToUse;
      if (isAdminOrSuperAdmin) {
        facultyIdToUse = filters.faculty_id;
      } else if (user.role === 'faculty_dean_office') {
        facultyIdToUse = user.faculty_id;
      } else if (isDormManager) {
        if (filters.faculty_id) {
          facultyIdToUse = filters.faculty_id;
        } else if (linkedFacultiesForDorm.length > 0) {
          facultyIdToUse = linkedFacultiesForDorm.map(f => f.id).join(',');
        } else {
          setCouncilMembers([]);
          setPagination(prev => ({ ...prev, total: 0, page: 1 }));
          setIsLoadingData(false);
          return;
        }
      }
      
      if (facultyIdToUse) params.faculty_id = facultyIdToUse;
      const response = await api.get('/users/all', { params });

      setCouncilMembers(response.data.users || response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || response.data?.length || 0,
      }));
    } catch (err) {
      ToastService.handleApiError(err);
      setError("Не вдалося завантажити членів студради.");
      setCouncilMembers([]);
      setPagination(prev => ({ ...prev, total: 0, page: 1 }));
    } finally {
      setIsLoadingData(false);
    }
  }, [user, filters, sort, pagination.page, pagination.limit, linkedFacultiesForDorm, isDormManager, isAdminOrSuperAdmin]);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    if (user && !userIsLoading) {
      fetchCouncilMembers();
      if (isAdminOrSuperAdmin) {
        api.get("/faculties").then(res => setAllFaculties(res.data || [])).catch(ToastService.handleApiError);
      } else if (isDormManager && user.dormitory_id) {
        api.get('/faculty-dormitories')
          .then(res => {
            const facultiesForDorm = (res.data || [])
              .filter(link => String(link.dormitory_id) === String(user.dormitory_id))
              .map(link => ({ id: link.faculty_id, name: link.faculty_name }));
            setLinkedFacultiesForDorm(facultiesForDorm);
          })
          .catch(ToastService.handleApiError);
      }
    } else if (!user && !userIsLoading) {
      setIsLoadingData(false);
    }
  }, [user, userIsLoading, fetchCouncilMembers, isAdminOrSuperAdmin, isDormManager]);

  const handleAddMember = () => {
    if (user.role === 'faculty_dean_office' && !user.faculty_id) {
      ToastService.error("Спочатку оберіть факультет для вашого профілю.");
      return;
    }
    if ((isAdminOrSuperAdmin || isDormManager) && !filters.faculty_id) {
      ToastService.error("Будь ласка, оберіть факультет у фільтрах, щоб додати члена студради.");
      return;
    }
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (window.confirm(`Ви впевнені, що хочете видалити "${memberName}" зі складу студради? Роль користувача буде змінена на "student".`)) {
      setActionLoading(true);
      try {
        await api.put(`/users/${memberId}/role`, { role: "student", facultyId: null });
        ToastService.success(`"${memberName}" видалено зі студради.`);
        fetchCouncilMembers();
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleModalSuccess = (isSubmittingNow, wasSuccessful) => {
    setFormSubmitting(isSubmittingNow);
    if (!isSubmittingNow && wasSuccessful) {
      fetchCouncilMembers();
      handleModalClose();
    }
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

  if (userIsLoading) {
    return <div className={styles.layout}><div className={styles.loading}>Завантаження...</div></div>;
  }
  if (!user || !['faculty_dean_office', 'dorm_manager', 'admin', 'superadmin'].includes(user.role)) {
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
              <h1 className={styles.title}><UserGroupIcon className={styles.titleIcon} />Управління Студрадою</h1>
            </div>
            <div className={styles.contentWrapper}>
              <p className={styles.errorMessage}>Інформація про ваш факультет не визначена. Зверніться до адміністратора.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const roleLabels = {
    student_council_head: "Голова студради",
    student_council_member: "Член студради",
  };

  const currentFacultyIdForModal = (isAdminOrSuperAdmin || isDormManager) ? filters.faculty_id : user.faculty_id;

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded(prev => !prev)} />
        <main className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              <UserGroupIcon className={styles.titleIcon} />
              Управління Студентською Радою {facultyNameForDisplay !== "Всі факультети" && facultyNameForDisplay !== "не визначено" && facultyNameForDisplay !== "Всі пов'язані факультети" ? `факультету "${facultyNameForDisplay}"` : (isDormManager ? `(Гуртожиток: ${user.dormitory_name})` : "")}
            </h1>
            {(user.role === 'faculty_dean_office' || (isAdminOrSuperAdmin && filters.faculty_id) || (isDormManager && filters.faculty_id)) && (
              <button
                onClick={handleAddMember}
                className={styles.actionButtonMain}
                disabled={isLoadingData || actionLoading || ((isAdminOrSuperAdmin || isDormManager) && !filters.faculty_id)}
                title={((isAdminOrSuperAdmin || isDormManager) && !filters.faculty_id) ? "Оберіть факультет для додавання" : "Додати члена студради"}
              >
                <PlusIcon className={styles.buttonIcon} /> Додати члена
              </button>
            )}
          </div>
          <div className={styles.contentWrapper}>
            <div className={styles.filtersPanel}>
              <input
                type="text"
                name="searchTerm"
                placeholder="Пошук за ПІБ або email..."
                value={filters.searchTerm}
                onChange={handleFilterChange}
                className={styles.inputField}
                disabled={isLoadingData}
              />
              <select
                name="roleFilter"
                value={filters.roleFilter}
                onChange={handleFilterChange}
                className={styles.inputField}
                disabled={isLoadingData}
              >
                <option value="">Всі ролі в студраді</option>
                <option value="student_council_head">Голова студради</option>
                <option value="student_council_member">Член студради</option>
              </select>
              {(isAdminOrSuperAdmin || isDormManager) && (
                <select name="faculty_id" value={filters.faculty_id || ''} onChange={handleFilterChange} className={styles.inputField} disabled={isLoadingData || (isDormManager ? linkedFacultiesForDorm.length === 0 : allFaculties.length === 0)}>
                  <option value="">{isLoadingData ? "Завантаження..." : (isDormManager ? "Всі пов зв'язані факультети" : "Всі факультети")}</option>
                  {(isDormManager ? linkedFacultiesForDorm : allFaculties).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              )}
              <button onClick={handleResetFilters} className={styles.resetFilterButton} disabled={isLoadingData}>
                <XCircleIcon className={styles.buttonIconSm} /> Скинути
              </button>
            </div>

            {isLoadingData ? (
              <div className={styles.loading}>Завантаження...</div>
            ) : error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : councilMembers.length === 0 ? (
              <div className={styles.emptyMessage}>
                <InformationCircleIcon />
                <p>Членів студради не знайдено за вашими критеріями, або їх ще не додано.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')}>ПІБ {sort.sortBy === 'name' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />)}</th>
                      <th onClick={() => handleSort('email')}>Email {sort.sortBy === 'email' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />)}</th>
                      <th onClick={() => handleSort('role')}>Роль {sort.sortBy === 'role' && (sort.sortOrder === 'asc' ? <ArrowUpIcon className={styles.sortIcon} /> : <ArrowDownIcon className={styles.sortIcon} />)}</th>
                      {(isAdminOrSuperAdmin || isDormManager) && <th>Факультет</th>}
                      <th className={styles.actionsHeader}>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {councilMembers.map(member => (
                      <tr key={member.id}>
                        <td data-label="ПІБ">{member.name || 'N/A'}</td>
                        <td data-label="Email">{member.email}</td>
                        <td data-label="Роль">{roleLabels[member.role] || member.role}</td>
                        {(isAdminOrSuperAdmin || isDormManager) && <td data-label="Факультет">{member.faculty_name || 'N/A'}</td>}
                        <td className={styles.actionsCell}>
                          <button onClick={() => handleEditMember(member)} className={`${styles.actionButton} ${styles.editButton}`} title="Редагувати роль" disabled={actionLoading}>
                            <PencilIcon />
                          </button>
                          <button onClick={() => handleRemoveMember(member.id, member.name)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Видалити зі студради" disabled={actionLoading}>
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
          {!isLoadingData && !error && councilMembers.length > 0 && pagination.total > 0 && pagination.total > pagination.limit && (
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
      {isModalOpen && currentFacultyIdForModal && (
        <div className={styles.modalOverlayGlobal} onClick={handleModalClose} role="dialog" aria-modal="true">
          <div className={styles.modalContentGlobal} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleModalClose} className={styles.closeButtonIconGlobal} aria-label="Закрити форму">
              <CloseModalIcon />
            </button>
            <StudentCouncilMemberFormModal
              member={editingMember}
              facultyId={currentFacultyIdForModal}
              facultyName={facultyNameForDisplay}
              onClose={handleModalClose}
              onSuccess={handleModalSuccess}
              isLoadingForm={formSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCouncilPage;