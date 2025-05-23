// frontend/src/pages/AdminManagement/UsersPage.jsx
import React, { useState, useEffect } from "react";
import AssignRoleModal from "../../components/Admin/AssignRoleModal";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import styles from "./styles/UsersPage.module.css";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ search: "", role: "" });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/api/v1/users", { params: filters });
      setUsers(response.data);
    } catch (error) {
      ToastService.handleApiError(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управління користувачами</h1>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Пошук за ПІБ або email"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="">Всі ролі</option>
          {["student", "admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"].map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ПІБ</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Факультет</th>
            <th>Гуртожиток</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.faculty_name || "Н/Д"}</td>
              <td>{user.dormitory_name || "Н/Д"}</td>
              <td>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setIsModalOpen(true);
                  }}
                  className={styles.editButton}
                >
                  Редагувати роль
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isModalOpen && (
        <AssignRoleModal
          user={selectedUser}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};

export default UsersPage;