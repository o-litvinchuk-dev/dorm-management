import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { ToastService } from '../../../utils/toastConfig';
import Sidebar from '../../../components/UI/Sidebar/Sidebar';
import Navbar from '../../../components/UI/Navbar/Navbar';
import styles from './styles/RoomDetailPage.module.css';
import { UsersIcon, CheckCircleIcon, ArrowLeftIcon, BuildingOffice2Icon, ChatBubbleLeftEllipsisIcon, NoSymbolIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'; // Removed CurrencyDollarIcon
import { useUser } from '../../../contexts/UserContext';

const RoomDetailPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const academicYearFromState = location.state?.academicYearForReservation;
  const roomDetailsFromSearch = location.state?.roomDetailsFromSearch;

  const [roomDetails, setRoomDetails] = useState(roomDetailsFromSearch || null);
  const [isLoading, setIsLoading] = useState(!roomDetailsFromSearch);
  const [isReserving, setIsReserving] = useState(false);
  const [academicYear, setAcademicYear] = useState(academicYearFromState || "");
  const [studentNotes, setStudentNotes] = useState('');

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const fetchRoomDetails = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const params = {};
      if (academicYear) params.academic_year = academicYear;
      const response = await api.get(`/services/rooms/${roomId}`, { params });
      setRoomDetails(response.data);
    } catch (error) {
      ToastService.handleApiError(error);
      setRoomDetails(null);
      navigate('/services/rooms/search', { replace: true, state: { error: "Кімнату не знайдено або сталася помилка" } });
    } finally {
      setIsLoading(false);
    }
  }, [roomId, academicYear, navigate]);

  useEffect(() => {
    if (!roomDetailsFromSearch || String(roomDetailsFromSearch.id) !== String(roomId)) {
      fetchRoomDetails();
    }
  }, [roomId, roomDetailsFromSearch, fetchRoomDetails]);

  const handleReservation = async () => {
    if (!user) {
      ToastService.error("Будь ласка, увійдіть в систему для бронювання.");
      navigate("/login", { state: { from: location } });
      return;
    }
    if (!academicYear) {
        ToastService.error("Академічний рік для бронювання не визначено.");
        return;
    }
    if (!roomDetails?.isAvailable && roomDetails?.is_reservable) {
      ToastService.error("На жаль, ця кімната недоступна на вибрані дати/академічний рік.");
      return;
    }
    if (!roomDetails?.is_reservable) {
      ToastService.error("Ця кімната наразі не доступна для бронювання.");
      return;
    }

    setIsReserving(true);
    try {
      const payload = {
        academic_year: academicYear,
        notes_student: studentNotes || null,
      };
      await api.post(`/services/rooms/${roomId}/reserve`, payload);
      ToastService.success(`Кімната №${roomDetails.number} успішно заброньована!`, "Очікуйте підтвердження адміністрацією.");
      navigate('/my-reservations');
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setIsReserving(false);
    }
  };

  const genderTypeLabels = {
    male: 'Чоловіча',
    female: 'Жіноча',
    mixed: 'Змішана',
    any: 'Будь-яка / залежить від першого поселенця'
  };
  const currentGenderOccupancyLabels = {
    male: 'Чоловіки',
    female: 'Жінки',
    empty: 'Вільна (стать не визначено)'
  };


  if (isLoading) {
    return (
      <div className={styles.layout}>
        <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
        <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
          <Navbar isSidebarExpanded={isSidebarExpanded} />
          <div className={styles.pageContainer}><div className={styles.loadingSpinner}>Завантаження деталей кімнати...</div></div>
        </div>
      </div>
    );
  }

  if (!roomDetails) {
    return (
      <div className={styles.layout}>
        <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
        <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
          <Navbar isSidebarExpanded={isSidebarExpanded} />
          <div className={styles.pageContainer}><p className={styles.errorMessage}>Не вдалося завантажити інформацію про кімнату.</p></div>
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
          <button onClick={() => navigate('/services/rooms/search', { state: { academicYearForReservation: academicYear } })} className={styles.backButton}>
            <ArrowLeftIcon />
            Назад до пошуку
          </button>
          <h1 className={styles.pageTitle}>Деталі кімнати №{roomDetails.number}</h1>
          <p className={styles.pageSubtitle}>Бронювання на {academicYear || "не вказаний"} навчальний рік.</p>
          
          <div className={styles.roomDetailsGrid}>
            <div className={styles.roomImagePlaceholder}>
              <BuildingOffice2Icon />
            </div>
            <div className={styles.roomInfo}>
              <h2>{roomDetails.dormitory_name} - Кімната {roomDetails.number}</h2>
              <p className={styles.description}>{roomDetails.description || "Опис відсутній."}</p>
              
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}><UsersIcon /> Місткість: {roomDetails.capacity} чол.</div>
                <div className={styles.infoItem}><BuildingOffice2Icon /> Поверх: {roomDetails.floor || 'N/A'}</div>
                <div className={styles.infoItem}><ShieldCheckIcon /> Тип по статі: {genderTypeLabels[roomDetails.gender_type] || 'N/A'}</div>
                <div className={styles.infoItem}><UsersIcon /> Поточне заселення (стать): {currentGenderOccupancyLabels[roomDetails.current_gender_occupancy] || 'N/A'}</div>
                <div className={styles.infoItem}><UsersIcon /> Зайнято місць: {roomDetails.occupied_places}</div>
                {/* Price removed from here */}
              </div>

              <div className={styles.notesSection}>
                <label htmlFor="student_notes" className={styles.notesLabel}>
                  <ChatBubbleLeftEllipsisIcon/> Ваші побажання (необов'язково):
                </label>
                <textarea
                  id="student_notes"
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="Наприклад, бажаний час заїзду, особливі потреби..."
                  rows="3"
                  className={styles.notesTextarea}
                />
              </div>

              {roomDetails.is_reservable ? (
                roomDetails.isAvailable ? (
                    <button
                    onClick={handleReservation}
                    disabled={isReserving || !academicYear}
                    className={styles.reserveButton}
                    >
                    <CheckCircleIcon />
                    {isReserving ? 'Бронювання...' : 'Забронювати на ' + academicYear}
                    </button>
                ) : (
                    <p className={styles.notAvailableMessage}>
                    <NoSymbolIcon /> На жаль, ця кімната вже заброньована або недоступна на цей академічний рік.
                    </p>
                )
              ) : (
                <p className={styles.notAvailableMessage}>
                  <NoSymbolIcon /> Ця кімната наразі не доступна для бронювання.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;