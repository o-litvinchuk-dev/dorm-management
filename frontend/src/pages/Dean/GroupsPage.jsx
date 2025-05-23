// frontend/src/pages/Dean/GroupsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import GroupForm from "../../components/Dean/GroupForm";
import BatchGroupForm from "../../components/Dean/BatchGroupForm";
import api from "../../utils/api";
import { ToastService } from "../../utils/toastConfig";
import { useUser } from "../../contexts/UserContext";
import styles from "./styles/GroupsPage.module.css";
import { PlusIcon, PencilIcon, TrashIcon, ListBulletIcon } from "@heroicons/react/24/outline";

const GroupsTable = ({ groups, onEdit, onDelete, facultyName, isLoading, searchTerm, courseFilter }) => {
  const filteredGroups = groups.filter(group => {
    const nameMatch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const courseMatch = courseFilter ? group.course === parseInt(courseFilter) : true;
    return nameMatch && courseMatch;
  });

  if (isLoading) {
    return <p className={styles.loadingMessage}>Завантаження груп...</p>;
  }
  if (!groups || groups.length === 0) { // Показуємо це, якщо початковий список порожній
    return <p className={styles.emptyMessage}>Для факультету "{facultyName}" ще не додано жодної групи.</p>;
  }
  if (filteredGroups.length === 0 && (searchTerm || courseFilter)) { // Показуємо це, якщо фільтри не дали результату
    return <p className={styles.emptyMessage}>Груп за вашими критеріями не знайдено.</p>;
  }


  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Назва групи</th>
            <th>Курс</th>
            <th>Створено</th>
            <th>Оновлено</th>
            <th className={styles.actionsCell}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {filteredGroups.map((group) => (
            <tr key={group.id}>
              <td>{group.id}</td>
              <td>{group.name}</td>
              <td>{group.course}</td>
              <td>{new Date(group.created_at).toLocaleDateString("uk-UA", { year: 'numeric', month: 'numeric', day: 'numeric' })}</td>
              <td>{new Date(group.updated_at).toLocaleDateString("uk-UA", { year: 'numeric', month: 'numeric', day: 'numeric' })}</td>
              <td className={styles.actionsCell}>
                <button
                  onClick={() => onEdit(group)}
                  className={`${styles.actionButton} ${styles.editButton}`}
                  title="Редагувати"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => onDelete(group.id)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Видалити"
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const GroupsManagementPage = () => {
  const { user, isLoading: userLoading } = useUser();
  const [groups, setGroups] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const facultyName = user?.faculty_name || "не визначено";

  const fetchGroups = useCallback(async () => {
    // Перевіряємо, чи є user та faculty_id, перш ніж робити запит
    if (!user || !user.faculty_id) {
      setIsLoadingData(false);
      // Якщо це декан і немає faculty_id, виводимо повідомлення (вже обробляється нижче)
      if (user && user.role === 'faculty_dean_office' && !user.faculty_id) {
         console.warn("[GroupsPage] Користувач faculty_dean_office не має faculty_id.");
      }
      return;
    }

    setIsLoadingData(true);
    try {
      // Шлях тепер відносний
      const response = await api.get(`faculties/${user.faculty_id}/groups`);
      setGroups(response.data || []);
    } catch (error) {
      ToastService.handleApiError(error);
      setGroups([]); 
    } finally {
      setIsLoadingData(false);
    }
  }, [user]); // Залежність тільки від user, бо faculty_id є його частиною

  useEffect(() => {
    if (!userLoading && user) { 
        fetchGroups();
    } else if (!userLoading && !user) {
        setIsLoadingData(false);
    }
  }, [userLoading, user, fetchGroups]);

  const handleDelete = async (groupId) => {
    const groupToDelete = groups.find(g => g.id === groupId);
    if (!groupToDelete) return;

    if (user && user.role === 'faculty_dean_office' && groupToDelete.faculty_id !== user.faculty_id) {
        ToastService.error("Помилка", "Ви не можете видалити групу іншого факультету.");
        return;
    }
    // Для admin/superadmin дозволяємо видалення будь-якої групи

    if (window.confirm(`Ви впевнені, що хочете видалити групу "${groupToDelete.name}" (ID: ${groupId})?`)) {
      setIsLoadingData(true); 
      try {
        // Шлях тепер відносний
        await api.delete(`groups/${groupId}`);
        ToastService.success("Групу видалено");
        fetchGroups(); 
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  const handleEdit = (group) => {
    if (user && user.role === 'faculty_dean_office' && group.faculty_id !== user.faculty_id) {
        ToastService.error("Помилка", "Ви не можете редагувати групу іншого факультету.");
        return;
    }
    setSelectedGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleAddGroup = () => {
    setSelectedGroup(null); 
    setIsGroupModalOpen(true);
  };
  
  const handleOpenBatchModal = () => {
    setIsBatchModalOpen(true);
  };

  const handleModalClose = () => {
    setIsGroupModalOpen(false);
    setIsBatchModalOpen(false);
    setSelectedGroup(null);
  };

  const handleModalSuccess = () => {
    fetchGroups();
    // Закриваємо тільки модальне вікно для однієї групи,
    // модальне вікно пакетного додавання має кнопку "Закрити"
    if(isGroupModalOpen) {
      handleModalClose();
    }
  };
  
  if (userLoading) {
    return <div className={styles.loadingMessage}>Завантаження даних користувача...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'faculty_dean_office' && user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/unauthorized" replace />; // Або на /dashboard
  }

  // Специфічна перевірка для faculty_dean_office
  if (user.role === 'faculty_dean_office' && !user.faculty_id) {
    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} />
                <div className={styles.pageContainer}>
                    <h1 className={styles.pageTitle}>Управління групами</h1>
                    <p className={styles.errorMessage}>Інформація про ваш факультет не визначена. Будь ласка, зверніться до адміністратора системи, щоб вам призначили факультет.</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} />
        <div className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>
              {user.role === 'faculty_dean_office' ? `Управління групами факультету "${facultyName}"` : "Управління групами (Адмін)"}
            </h1>
            <div className={styles.headerActions}>
              <button onClick={handleOpenBatchModal} className={`${styles.addButton} ${styles.batchButton}`}>
                <ListBulletIcon />
                Додати списком
              </button>
              <button onClick={handleAddGroup} className={styles.addButton}>
                <PlusIcon />
                Додати групу
              </button>
            </div>
          </div>

          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Пошук за назвою групи..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className={styles.courseSelect}
            >
              <option value="">Всі курси</option>
              {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} курс</option>)}
            </select>
          </div>

          <GroupsTable
            groups={groups}
            onEdit={handleEdit}
            onDelete={handleDelete}
            facultyName={facultyName}
            isLoading={isLoadingData}
            searchTerm={searchTerm}
            courseFilter={courseFilter}
          />
        </div>
      </div>
      {isGroupModalOpen && (
        <GroupForm
          group={selectedGroup}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          facultyName={facultyName}
        />
      )}
      {isBatchModalOpen && user?.faculty_id && (
        <BatchGroupForm
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          facultyName={facultyName}
          facultyId={user.faculty_id}
        />
      )}
    </div>
  );
};

export default GroupsManagementPage;