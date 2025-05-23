import React, { useState, useEffect } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import styles from "./styles/AdminManagementPage.module.css";
import {
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
  HomeModernIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

const AdminManagementPage = () => {
  const { user } = useUser();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    return JSON.parse(localStorage.getItem("sidebarOpen") || "true");
  });
  const [faculties, setFaculties] = useState([]);
  const [dormitories, setDormitories] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: "" });
  const [newDormitory, setNewDormitory] = useState({ name: "", address: "", capacity: "" });
  const [editDormitory, setEditDormitory] = useState(null);
  const [facultyDormForm, setFacultyDormForm] = useState({ faculty_id: "", dorm_id: "", quota: "" });
  const [assignDeanForm, setAssignDeanForm] = useState({ email: "", faculty_id: "" }); // Changed user_id to email
  const [assignDormManagerForm, setAssignDormManagerForm] = useState({ email: "", dormitory_id: "" }); // Changed user_id to email
  const [assignStudentCouncilForm, setAssignStudentCouncilForm] = useState({
    email: "", // Changed user_id to email
    faculty_id: "",
    council_role: "student_council_head",
  });

  const isSuperAdmin = user?.role === "superadmin";
  const isDormManager = user?.role === "dorm_manager";

  const allowedFaculties = isDormManager
    ? faculties.filter((f) => f.dormitories?.some((d) => d.dormitory_id === user.dormitory_id))
    : faculties;
  const allowedDormitories = isDormManager ? dormitories.filter((d) => d.id === user.dormitory_id) : dormitories;

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [facultiesRes, dormsRes, usersRes] = await Promise.all([
          api.get("/faculties"),
          api.get("/dormitories"),
          api.get("/users/all"),
        ]);
        const facultiesWithDorms = await Promise.all(
          facultiesRes.data.map(async (faculty) => {
            const dorms = await api.get(`/faculty-dormitories?faculty_id=${faculty.id}`);
            return { ...faculty, dormitories: dorms.data };
          })
        );
        setFaculties(facultiesWithDorms);
        setDormitories(dormsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для створення факультету");
      return;
    }
    if (!newFaculty.name.trim()) {
      ToastService.error("Назва факультету не може бути порожньою");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/faculties", newFaculty);
      const facultiesRes = await api.get("/faculties");
      const facultiesWithDorms = await Promise.all(
        facultiesRes.data.map(async (faculty) => {
          const dorms = await api.get(`/faculty-dormitories?faculty_id=${faculty.id}`);
          return { ...faculty, dormitories: dorms.data };
        })
      );
      setFaculties(facultiesWithDorms);
      setNewFaculty({ name: "" });
      ToastService.success("Факультет створено");
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDormitory = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для створення гуртожитку");
      return;
    }
    const trimmedName = newDormitory.name.trim();
    if (!trimmedName) {
      ToastService.error("Назва гуртожитку не може бути порожньою");
      return;
    }
    if (trimmedName.length < 3) {
      ToastService.error("Назва гуртожитку повинна містити щонайменше 3 символи");
      return;
    }
    if (trimmedName.length > 100) {
      ToastService.error("Назва гуртожитку не може перевищувати 100 символів");
      return;
    }
    if (newDormitory.capacity) {
      const capacity = parseInt(newDormitory.capacity);
      if (isNaN(capacity) || capacity <= 0) {
        ToastService.error("Місткість повинна бути цілим числом більше 0");
        return;
      }
    }
    setActionLoading(true);
    try {
      const payload = {
        name: trimmedName,
        address: newDormitory.address.trim() || "",
        capacity: newDormitory.capacity ? parseInt(newDormitory.capacity) : undefined,
      };
      console.log("[CreateDormitory Payload]", payload);
      await api.post("/dormitories", payload);
      const dormsRes = await api.get("/dormitories");
      setDormitories(dormsRes.data);
      setNewDormitory({ name: "", address: "", capacity: "" });
      ToastService.success("Гуртожиток створено");
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDormitory = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для оновлення гуртожитку");
      return;
    }
    if (!editDormitory.name.trim()) {
      ToastService.error("Назва гуртожитку не може бути порожньою");
      return;
    }
    if (editDormitory.capacity && parseInt(editDormitory.capacity) <= 0) {
      ToastService.error("Місткість повинна бути більше 0");
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/dormitories/${editDormitory.id}`, {
        ...editDormitory,
        capacity: editDormitory.capacity ? parseInt(editDormitory.capacity) : undefined,
      });
      const dormsRes = await api.get("/dormitories");
      setDormitories(dormsRes.data);
      setEditDormitory(null);
      ToastService.success("Гуртожиток оновлено");
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDormitory = async (dormitoryId) => {
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для видалення гуртожитку");
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/dormitories/${dormitoryId}`);
      setDormitories((prev) => prev.filter((d) => d.id !== dormitoryId));
      ToastService.success("Гуртожиток видалено");
    } catch (error) {
      if (error.response?.data?.code === "DEPENDENCY_EXISTS") {
        ToastService.error("Неможливо видалити гуртожиток через пов’язані записи");
      } else {
        ToastService.handleApiError(error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для видалення факультету");
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/faculties/${facultyId}`);
      setFaculties((prev) => prev.filter((f) => f.id !== facultyId));
      ToastService.success("Факультет видалено");
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDormitory = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для призначення гуртожитку");
      return;
    }
    const { faculty_id, dorm_id, quota } = facultyDormForm;
    if (!faculty_id || !dorm_id || !quota) {
      ToastService.error("Заповніть усі поля: факультет, гуртожиток і квота");
      return;
    }
    if (parseInt(quota) <= 0) {
      ToastService.error("Квота повинна бути більше 0");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/faculty-dormitories", {
        faculty_id: parseInt(faculty_id),
        dormitory_id: parseInt(dorm_id),
        quota: parseInt(quota),
      });
      const facultiesRes = await api.get("/faculties");
      const facultiesWithDorms = await Promise.all(
        facultiesRes.data.map(async (faculty) => {
          const dorms = await api.get(`/faculty-dormitories?faculty_id=${faculty.id}`);
          return { ...faculty, dormitories: dorms.data };
        })
      );
      setFaculties(facultiesWithDorms);
      setFacultyDormForm({ faculty_id: "", dorm_id: "", quota: "" });
      ToastService.success("Гуртожиток призначено факультету");
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDean = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для призначення адміністратора");
      return;
    }
    if (!assignDeanForm.email || !assignDeanForm.faculty_id) {
      ToastService.error("Заповніть усі поля");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/users/assign-faculty-dean-office", {
        email: assignDeanForm.email.trim(),
        facultyId: parseInt(assignDeanForm.faculty_id),
      });
      const usersRes = await api.get("/users/all");
      setUsers(usersRes.data);
      setAssignDeanForm({ email: "", faculty_id: "" });
      ToastService.success("Роль адміністратора призначено");
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDormManager = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для призначення коменданта");
      return;
    }
    if (!assignDormManagerForm.email || !assignDormManagerForm.dormitory_id) {
      ToastService.error("Заповніть усі поля");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/users/assign-dorm-manager", {
        email: assignDormManagerForm.email.trim(),
        dormitoryId: parseInt(assignDormManagerForm.dormitory_id),
      });
      const usersRes = await api.get("/users/all");
      setUsers(usersRes.data);
      setAssignDormManagerForm({ email: "", dormitory_id: "" });
      ToastService.success("Коменданта призначено");
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignStudentCouncil = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin && !isDormManager) {
      ToastService.error("Недостатньо прав для призначення студради");
      return;
    }
    if (!assignStudentCouncilForm.email || !assignStudentCouncilForm.faculty_id) {
      ToastService.error("Заповніть усі поля");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/users/assign-student-council", {
        email: assignStudentCouncilForm.email.trim(),
        facultyId: parseInt(assignStudentCouncilForm.faculty_id),
        role: assignStudentCouncilForm.council_role,
      });
      const usersRes = await api.get("/users/all");
      setUsers(usersRes.data);
      setAssignStudentCouncilForm({
        email: "",
        faculty_id: "",
        council_role: "student_council_head",
      });
      ToastService.success("Представника студради призначено");
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Завантаження...</div>;
  }

  if (!isSuperAdmin && !isDormManager) {
    return <div className={styles.errorMessage}>Недостатньо прав для доступу до цієї сторінки</div>;
  }

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)} />
        <div className={styles.profileContainer}>
          <div className={styles.blocksContainer}>
            <h1 className={styles.pageTitle}>Адміністрування</h1>
            <div className={styles.blocksGrid}>
              {isSuperAdmin && (
                <>
                  <div className={styles.block}>
                    <div className={styles.blockHeader}>
                      <h2 className={styles.blockTitle}>
                        <PlusIcon className={styles.icon} />
                        Створити факультет
                      </h2>
                    </div>
                    <form onSubmit={handleCreateFaculty} className={styles.form}>
                      <input
                        type="text"
                        value={newFaculty.name}
                        onChange={(e) => setNewFaculty({ name: e.target.value })}
                        placeholder="Назва факультету"
                        required
                        className={styles.input}
                        disabled={actionLoading}
                      />
                      <button type="submit" className={styles.submitButton} disabled={actionLoading}>
                        <PlusIcon className={styles.buttonIcon} />
                        {actionLoading ? "Обробка..." : "Створити"}
                      </button>
                    </form>
                    <ul className={styles.list}>
                      {faculties.length === 0 ? (
                        <li className={styles.emptyMessage}>Немає факультетів</li>
                      ) : (
                        faculties.map((faculty) => (
                          <li key={faculty.id} className={styles.listItem}>
                            <span>{faculty.name}</span>
                            <button
                              onClick={() => handleDeleteFaculty(faculty.id)}
                              className={styles.deleteButton}
                              disabled={actionLoading}
                            >
                              <TrashIcon className={styles.buttonIcon} />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className={styles.block}>
                    <div className={styles.blockHeader}>
                      <h2 className={styles.blockTitle}>
                        <BuildingOfficeIcon className={styles.icon} />
                        Управління гуртожитками
                      </h2>
                    </div>
                    {!editDormitory ? (
                      <form onSubmit={handleCreateDormitory} className={styles.form}>
                        <input
                          type="text"
                          value={newDormitory.name}
                          onChange={(e) => setNewDormitory((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Назва гуртожитку"
                          required
                          className={styles.input}
                          disabled={actionLoading}
                        />
                        <textarea
                          value={newDormitory.address}
                          onChange={(e) => setNewDormitory((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="Адреса гуртожитку (необов’язково)"
                          className={styles.textarea}
                          disabled={actionLoading}
                        />
                        <input
                          type="number"
                          value={newDormitory.capacity}
                          onChange={(e) => setNewDormitory((prev) => ({ ...prev, capacity: e.target.value }))}
                          placeholder="Місткість (необов’язково)"
                          min="1"
                          className={styles.input}
                          disabled={actionLoading}
                        />
                        <button type="submit" className={styles.submitButton} disabled={actionLoading}>
                          <BuildingOfficeIcon className={styles.buttonIcon} />
                          {actionLoading ? "Обробка..." : "Створити"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleUpdateDormitory} className={styles.form}>
                        <input
                          type="text"
                          value={editDormitory.name}
                          onChange={(e) => setEditDormitory((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Назва гуртожитку"
                          required
                          className={styles.input}
                          disabled={actionLoading}
                        />
                        <textarea
                          value={editDormitory.address}
                          onChange={(e) => setEditDormitory((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="Адреса гуртожитку (необов’язково)"
                          className={styles.textarea}
                          disabled={actionLoading}
                        />
                        <input
                          type="number"
                          value={editDormitory.capacity}
                          onChange={(e) => setEditDormitory((prev) => ({ ...prev, capacity: e.target.value }))}
                          placeholder="Місткість (необов’язково)"
                          min="1"
                          className={styles.input}
                          disabled={actionLoading}
                        />
                        <div className={styles.buttonGroup}>
                          <button type="submit" className={styles.submitButton} disabled={actionLoading}>
                            <PencilIcon className={styles.buttonIcon} />
                            {actionLoading ? "Обробка..." : "Оновити"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditDormitory(null)}
                            className={styles.cancelButton}
                            disabled={actionLoading}
                          >
                            Скасувати
                          </button>
                        </div>
                      </form>
                    )}
                    <ul className={styles.list}>
                      {dormitories.length === 0 ? (
                        <li className={styles.emptyMessage}>Немає гуртожитків</li>
                      ) : (
                        dormitories.map((dorm) => (
                          <li key={dorm.id} className={styles.listItem}>
                            <span>
                              {dorm.name}
                              {dorm.address && ` (${dorm.address})`}
                              {dorm.capacity && `, місткість: ${dorm.capacity}`}
                            </span>
                            <div>
                              <button
                                onClick={() => setEditDormitory(dorm)}
                                className={styles.editButton}
                                disabled={actionLoading}
                              >
                                <PencilIcon className={styles.buttonIcon} />
                              </button>
                              <button
                                onClick={() => handleDeleteDormitory(dorm.id)}
                                className={styles.deleteButton}
                                disabled={actionLoading}
                              >
                                <TrashIcon className={styles.buttonIcon} />
                              </button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className={styles.block}>
                    <div className={styles.blockHeader}>
                      <h2 className={styles.blockTitle}>
                        <HomeModernIcon className={styles.icon} />
                        Призначити гуртожиток
                      </h2>
                    </div>
                    <form onSubmit={handleAssignDormitory} className={styles.form}>
                      <select
                        value={facultyDormForm.faculty_id}
                        onChange={(e) => setFacultyDormForm((prev) => ({ ...prev, faculty_id: e.target.value }))}
                        required
                        className={styles.select}
                        disabled={actionLoading}
                      >
                        <option value="">Виберіть факультет</option>
                        {faculties.map((faculty) => (
                          <option key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={facultyDormForm.dorm_id}
                        onChange={(e) => setFacultyDormForm((prev) => ({ ...prev, dorm_id: e.target.value }))}
                        required
                        className={styles.select}
                        disabled={actionLoading}
                      >
                        <option value="">Виберіть гуртожиток</option>
                        {dormitories.map((dorm) => (
                          <option key={dorm.id} value={dorm.id}>
                            {dorm.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={facultyDormForm.quota}
                        onChange={(e) => setFacultyDormForm((prev) => ({ ...prev, quota: e.target.value }))}
                        placeholder="Квота (кількість місць)"
                        required
                        min="1"
                        className={styles.input}
                        disabled={actionLoading}
                      />
                      <button type="submit" className={styles.submitButton} disabled={actionLoading}>
                        <HomeModernIcon className={styles.buttonIcon} />
                        {actionLoading ? "Обробка..." : "Призначити"}
                      </button>
                    </form>
                  </div>

                  <div className={styles.block}>
                    <div className={styles.blockHeader}>
                      <h2 className={styles.blockTitle}>
                        <UserPlusIcon className={styles.icon} />
                        Призначити адміністратора факультету
                      </h2>
                    </div>
                    <form onSubmit={handleAssignDean} className={styles.form}>
                      <input
                        type="email"
                        value={assignDeanForm.email}
                        onChange={(e) => setAssignDeanForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Електронна пошта користувача"
                        required
                        className={styles.input}
                        disabled={actionLoading}
                      />
                      <select
                        value={assignDeanForm.faculty_id}
                        onChange={(e) => setAssignDeanForm((prev) => ({ ...prev, faculty_id: e.target.value }))}
                        required
                        className={styles.select}
                        disabled={actionLoading}
                      >
                        <option value="">Виберіть факультет</option>
                        {faculties.map((faculty) => (
                          <option key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className={styles.submitButton} disabled={actionLoading}>
                        <UserPlusIcon className={styles.buttonIcon} />
                        {actionLoading ? "Обробка..." : "Призначити"}
                      </button>
                    </form>
                  </div>

                  <div className={styles.block}>
                    <div className={styles.blockHeader}>
                      <h2 className={styles.blockTitle}>
                        <UserPlusIcon className={styles.icon} />
                        Призначити коменданта
                      </h2>
                    </div>
                    <form onSubmit={handleAssignDormManager} className={styles.form}>
                      <input
                        type="email"
                        value={assignDormManagerForm.email}
                        onChange={(e) =>
                          setAssignDormManagerForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="Електронна пошта користувача"
                        required
                        className={styles.input}
                        disabled={actionLoading}
                      />
                      <select
                        value={assignDormManagerForm.dormitory_id}
                        onChange={(e) =>
                          setAssignDormManagerForm((prev) => ({ ...prev, dormitory_id: e.target.value }))
                        }
                        required
                        className={styles.select}
                        disabled={actionLoading}
                      >
                        <option value="">Виберіть гуртожиток</option>
                        {dormitories.map((dorm) => (
                          <option key={dorm.id} value={dorm.id}>
                            {dorm.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className={styles.submitButton} disabled={actionLoading}>
                        <UserPlusIcon className={styles.buttonIcon} />
                        {actionLoading ? "Обробка..." : "Призначити"}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {(isSuperAdmin || isDormManager) && (
                <div className={styles.block}>
                  <div className={styles.blockHeader}>
                    <h2 className={styles.blockTitle}>
                      <UserGroupIcon className={styles.icon} />
                      Призначити студраду
                    </h2>
                    </div>
                    <form onSubmit={handleAssignStudentCouncil} className={styles.form}>
                      <input
                        type="email"
                        value={assignStudentCouncilForm.email}
                        onChange={(e) =>
                          setAssignStudentCouncilForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="Електронна пошта користувача"
                        required
                        className={styles.input}
                        disabled={actionLoading}
                      />
                      <select
                        value={assignStudentCouncilForm.faculty_id}
                        onChange={(e) =>
                          setAssignStudentCouncilForm((prev) => ({ ...prev, faculty_id: e.target.value }))
                        }
                        required
                        className={styles.select}
                        disabled={actionLoading}
                      >
                        <option value="">Виберіть факультет</option>
                        {allowedFaculties.map((faculty) => (
                          <option key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={assignStudentCouncilForm.council_role}
                        onChange={(e) =>
                          setAssignStudentCouncilForm((prev) => ({ ...prev, council_role: e.target.value }))
                        }
                        className={styles.select}
                        disabled={actionLoading}
                      >
                        <option value="student_council_head">Голова студради</option>
                        <option value="student_council_member">Член студради</option>
                      </select>
                      <button type="submit" className={styles.submitButton} disabled={actionLoading}>
                        <UserGroupIcon className={styles.buttonIcon} />
                        {actionLoading ? "Обробка..." : "Призначити"}
                      </button>
                    </form>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagementPage;