import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/ManageRoomsPage.module.css';
import RoomListTable from '../../components/DormManager/RoomListTable';
import RoomFormModal from '../../components/DormManager/RoomFormModal';
import { BuildingLibraryIcon, PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';
import { Navigate } from 'react-router-dom';

const ManageRoomsPage = () => {
  const { user } = useUser();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchRooms = useCallback(async () => {
    if (!user || !user.dormitory_id) {
        setIsLoading(false);
        if (user && (user.role === 'dorm_manager' || user.role === 'admin' || user.role === 'superadmin') && !user.dormitory_id && user.role !== 'admin' && user.role !== 'superadmin') {
            ToastService.error("Гуртожиток не призначено цьому користувачу.");
        }
        return;
    }
    setIsLoading(true);
    try {
      const dormitoryIdToFetch = user.dormitory_id;
      
      if (!dormitoryIdToFetch && user.role !== 'admin' && user.role !== 'superadmin') {
          ToastService.error("Не вдалося визначити гуртожиток.");
          setIsLoading(false);
          return;
      }
      
      let response;
      // Admins/Superadmins without a specific dormitory_id assigned to their user record
      // might need a different way to select which dormitory's rooms to manage.
      // For now, this page is designed for a dorm_manager with a specific dorm.
      // Or an admin/superadmin who has selected/been assigned a dorm.
      if (dormitoryIdToFetch) {
        response = await api.get(`/dormitories/${dormitoryIdToFetch}/rooms`);
        setRooms(response.data || []);
      } else {
        // Handle case for admin/superadmin without a specific dorm_id - maybe they should not use this page directly
        // or a dormitory selection mechanism should be implemented.
        ToastService.info("Адміністратори/Суперадміни: Оберіть гуртожиток для управління кімнатами (можливо, на іншій сторінці або через налаштування профілю).");
        setRooms([]);
      }

    } catch (error) {
      ToastService.handleApiError(error);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) { // Ensure user context is loaded before fetching
        fetchRooms();
    }
  }, [fetchRooms, user]);

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Ви впевнені, що хочете видалити цю кімнату? Це також видалить усі пов\'язані бронювання.')) {
      setActionLoading(true);
      try {
        await api.delete(`/rooms/${roomId}`); 
        ToastService.success('Кімнату успішно видалено');
        fetchRooms(); 
      } catch (error) {
        ToastService.handleApiError(error);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleModalSuccess = () => {
    fetchRooms();
    handleModalClose();
  };

  if (!user || !(user.role === 'dorm_manager' || user.role === 'admin' || user.role === 'superadmin')) {
      return <Navigate to="/unauthorized" replace />;
  }
  // For dorm_manager, ensure they have a dormitory_id
  if (user.role === 'dorm_manager' && !user.dormitory_id) {
    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar isSidebarExpanded={isSidebarExpanded} />
                <div className={styles.pageContainer}>
                    <h1 className={styles.pageTitle}>Керування кімнатами</h1>
                    <p className={styles.errorMessage}>Вам не призначено гуртожиток для управління.</p>
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
              <BuildingLibraryIcon className={styles.titleIcon} />
              Керування кімнатами {user.dormitory_name ? `гуртожитку "${user.dormitory_name}"` : ""}
            </h1>
            <button onClick={handleAddRoom} className={styles.addButton}>
              <PlusIcon className={styles.buttonIcon} /> Додати кімнату
            </button>
          </div>

          {isLoading ? (
            <div className={styles.loadingSpinner}>Завантаження кімнат...</div>
          ) : rooms.length === 0 ? (
            <div className={styles.noResultsMessage}>
              <InformationCircleIcon />
              <p>У цьому гуртожитку ще немає кімнат. Додайте першу!</p>
            </div>
          ) : (
            <RoomListTable
              rooms={rooms}
              onEdit={handleEditRoom}
              onDelete={handleDeleteRoom}
              actionLoading={actionLoading}
            />
          )}
        </div>
      </div>
      {isModalOpen && user.dormitory_id && ( // Ensure dormitoryId is available for the form
        <RoomFormModal
          dormitoryId={user.dormitory_id}
          room={editingRoom}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default ManageRoomsPage;