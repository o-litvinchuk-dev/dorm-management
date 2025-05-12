import React, { useState, useEffect } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/AdminManagementPage.module.css";
import { useUser } from "../../contexts/UserContext";

const AdminManagementPage = () => {
  const { user } = useUser();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [faculties, setFaculties] = useState([]);
  const [dormitories, setDormitories] = useState([]);
  const [users, setUsers] = useState([]);
  const [newFaculty, setNewFaculty] = useState({ name: "" });
  const [facultyDormForm, setFacultyDormForm] = useState({ faculty_id: "", dorm_id: "" });
  const [assignDeanForm, setAssignDeanForm] = useState({ user_id: "", faculty_id: "" });
  const [assignDormManagerForm, setAssignDormManagerForm] = useState({ user_id: "", dormitory_id: "" });
  const [assignStudentCouncilForm, setAssignStudentCouncilForm] = useState({
    user_id: "",
    faculty_id: "",
    council_role: "student_council_head",
  });

  const isSuperAdmin = user?.role === "superadmin";
  const isDormManager = user?.role === "dorm_manager";
  const allowedFaculties = isDormManager
    ? faculties.filter((f) => f.dormitory_id === user.dormitory_id)
    : faculties;
  const allowedDormitories = isDormManager
    ? dormitories.filter((d) => d.id === user.dormitory_id)
    : dormitories;

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facultiesRes, dormsRes, usersRes] = await Promise.all([
          api.get("/faculties"),
          api.get("/dormitories"),
          api.get("/secure/users"),
        ]);
        setFaculties(facultiesRes.data);
        setDormitories(dormsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        ToastService.handleApiError(error);
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
    try {
      const response = await api.post("/faculties", newFaculty);
      setFaculties((prev) => [...prev, response.data]);
      setNewFaculty({ name: "" });
      ToastService.success("Факультет створено");
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для видалення факультету");
      return;
    }
    try {
      await api.delete(`/faculties/${facultyId}`);
      setFaculties((prev) => prev.filter((f) => f.id !== facultyId));
      ToastService.success("Факультет видалено");
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleAssignDormitory = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для призначення гуртожитку");
      return;
    }
    try {
      await api.post("/faculties/assign-dormitory", facultyDormForm);
      ToastService.success("Гуртожиток призначено факультету");
      setFacultyDormForm({ faculty_id: "", dorm_id: "" });
      const facultiesRes = await api.get("/faculties");
      setFaculties(facultiesRes.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleAssignDean = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для призначення адміністратора");
      return;
    }
    try {
      await api.post("/assign-faculty-dean", assignDeanForm);
      ToastService.success("Роль faculty_dean_office призначено");
      setAssignDeanForm({ user_id: "", faculty_id: "" });
      const usersRes = await api.get("/secure/users");
      setUsers(usersRes.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleAssignDormManager = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      ToastService.error("Недостатньо прав для призначення коменданта");
      return;
    }
    try {
      await api.post("/assign-dorm-manager", assignDormManagerForm);
      ToastService.success("Коменданта призначено");
      setAssignDormManagerForm({ user_id: "", dormitory_id: "" });
      const usersRes = await api.get("/secure/users");
      setUsers(usersRes.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  const handleAssignStudentCouncil = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin && !isDormManager) {
      ToastService.error("Недостатньо прав для призначення студради");
      return;
    }
    try {
      await api.post("/assign-student-council", assignStudentCouncilForm);
      ToastService.success("Представника студ. ради призначено");
      setAssignStudentCouncilForm({
        user_id: "",
        faculty_id: "",
        council_role: "student_council_head",
      });
      const usersRes = await api.get("/secure/users");
      setUsers(usersRes.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div
        className={`${styles.mainContent} ${
          !isSidebarExpanded ? styles.sidebarCollapsed : ""
        }`}
      >
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
        />
        <div className={styles.container}>
          <h2>Управління для Суперадміністратора</h2>

          {isSuperAdmin && (
            <>
              <section className={styles.section}>
                <h3>Створити факультет</h3>
                <form onSubmit={handleCreateFaculty} className={styles.form}>
                  <input
                    type="text"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ name: e.target.value })}
                    placeholder="Назва факультету"
                    required
                    className={styles.input}
                  />
                  <button type="submit" className={styles.button}>
                    Створити
                  </button>
                </form>
                <ul className={styles.list}>
                  {faculties.map((faculty) => (
                    <li key={faculty.id} className={styles.listItem}>
                      {faculty.name}
                      <button
                        onClick={() => handleDeleteFaculty(faculty.id)}
                        className={styles.deleteButton}
                      >
                        Видалити
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.section}>
                <h3>Призначити гуртожиток факультету</h3>
                <form onSubmit={handleAssignDormitory} className={styles.form}>
                  <select
                    value={facultyDormForm.faculty_id}
                    onChange={(e) =>
                      setFacultyDormForm((prev) => ({
                        ...prev,
                        faculty_id: e.target.value,
                      }))
                    }
                    required
                    className={styles.select}
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
                    onChange={(e) =>
                      setFacultyDormForm((prev) => ({
                        ...prev,
                        dorm_id: e.target.value,
                      }))
                    }
                    required
                    className={styles.select}
                  >
                    <option value="">Виберіть гуртожиток</option>
                    {dormitories.map((dorm) => (
                      <option key={dorm.id} value={dorm.id}>
                        {dorm.number}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={styles.button}>
                    Призначити
                  </button>
                </form>
              </section>

              <section className={styles.section}>
                <h3>Призначити адміністратора факультету</h3>
                <form onSubmit={handleAssignDean} className={styles.form}>
                  <select
                    value={assignDeanForm.user_id}
                    onChange={(e) =>
                      setAssignDeanForm((prev) => ({
                        ...prev,
                        user_id: e.target.value,
                      }))
                    }
                    required
                    className={styles.select}
                  >
                    <option value="">Виберіть користувача</option>
                    {users
                      .filter((u) => u.role === "student" || !u.role)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                  </select>
                  <select
                    value={assignDeanForm.faculty_id}
                    onChange={(e) =>
                      setAssignDeanForm((prev) => ({
                        ...prev,
                        faculty_id: e.target.value,
                      }))
                    }
                    required
                    className={styles.select}
                  >
                    <option value="">Виберіть факультет</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={styles.button}>
                    Призначити
                  </button>
                  </form>
              </section>

              <section className={styles.section}>
                <h3>Призначити коменданта гуртожитку</h3>
                <form onSubmit={handleAssignDormManager} className={styles.form}>
                  <select
                    value={assignDormManagerForm.user_id}
                    onChange={(e) =>
                      setAssignDormManagerForm((prev) => ({
                        ...prev,
                        user_id: e.target.value,
                      }))
                    }
                    required
                    className={styles.select}
                  >
                    <option value="">Виберіть користувача</option>
                    {users
                      .filter((u) => u.role === "student" || !u.role)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                  </select>
                  <select
                    value={assignDormManagerForm.dormitory_id}
                    onChange={(e) =>
                      setAssignDormManagerForm((prev) => ({
                        ...prev,
                        dormitory_id: e.target.value,
                      }))
                    }
                    required
                    className={styles.select}
                  >
                    <option value="">Виберіть гуртожиток</option>
                    {dormitories.map((dorm) => (
                      <option key={dorm.id} value={dorm.id}>
                        {dorm.number}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={styles.button}>
                    Призначити
                  </button>
                </form>
              </section>
            </>
          )}

          {(isSuperAdmin || isDormManager) && (
            <section className={styles.section}>
              <h3>Призначити представників студентської ради</h3>
              <form onSubmit={handleAssignStudentCouncil} className={styles.form}>
                <select
                  value={assignStudentCouncilForm.user_id}
                  onChange={(e) =>
                    setAssignStudentCouncilForm((prev) => ({
                      ...prev,
                      user_id: e.target.value,
                    }))
                  }
                  required
                  className={styles.select}
                >
                  <option value="">Виберіть користувача</option>
                  {users
                    .filter((u) => u.role === "student" || !u.role)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                </select>
                <select
                  value={assignStudentCouncilForm.faculty_id}
                  onChange={(e) =>
                    setAssignStudentCouncilForm((prev) => ({
                      ...prev,
                      faculty_id: e.target.value,
                    }))
                  }
                  required
                  className={styles.select}
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
                    setAssignStudentCouncilForm((prev) => ({
                      ...prev,
                      council_role: e.target.value,
                    }))
                  }
                  className={styles.select}
                >
                  <option value="student_council_head">Голова студентської ради</option>
                  <option value="student_council_member">Член студентської ради</option>
                </select>
                <button type="submit" className={styles.button}>
                  Призначити
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagementPage;