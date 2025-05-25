import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { ToastService } from '../../../utils/toastConfig';
import Sidebar from '../../../components/UI/Sidebar/Sidebar';
import Navbar from '../../../components/UI/Navbar/Navbar';
import styles from './styles/RoomDetailPage.module.css';
import { UsersIcon, CheckCircleIcon, ArrowLeftIcon, BuildingOffice2Icon, ChatBubbleLeftEllipsisIcon, NoSymbolIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
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
      if (academicYear) params.academic_year = academicYear; // Pass academic year for backend availability check
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
    // If details weren't passed or it's for a different room, fetch them
    if (!roomDetailsFromSearch || String(roomDetailsFromSearch.id) !== String(roomId)) {
      fetchRoomDetails();
    } else if (roomDetailsFromSearch && String(roomDetailsFromSearch.id) === String(roomId) && academicYear && roomDetailsFromSearch.academicYear !== academicYear) {
      // If academic year changed for the same room, re-fetch to check availability for new year
      fetchRoomDetails();
    }
  }, [roomId, roomDetailsFromSearch, fetchRoomDetails, academicYear]);

  const handleReservation = async () => {
    if (!user) {
      ToastService.error("Будь ласка, увійдіть в систему для бронювання.");
      navigate("/login", { state: { from: location } });
      return;
    }
    if (!academicYear) {
      ToastService.error("Академічний рік для бронювання не визначено. Поверніться до пошуку та вкажіть його.");
      return;
    }

    // Double check all conditions before sending request
    const canReserveCheck = checkUserGenderCompatibility(user, roomDetails) &&
                            roomDetails?.is_reservable &&
                            roomDetails?.isAvailable && // isAvailable is from backend check for the academicYear
                            roomDetails?.occupied_places < roomDetails?.capacity;

    if (!canReserveCheck) {
        ToastService.error("Кімната недоступна для бронювання. Можливо, дані оновилися.");
        fetchRoomDetails(); // Re-fetch details
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
      fetchRoomDetails(); // Re-fetch details in case of error (e.g. concurrent reservation)
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
  
  const checkUserGenderCompatibility = (currentUser, room) => {
    if (!currentUser || !room) return false;
    const userGender = currentUser.gender;

    if (!userGender || userGender === 'not_specified' || userGender === 'other') {
        return false; 
    }
    if (room.gender_type === 'male' && userGender !== 'male') return false;
    if (room.gender_type === 'female' && userGender !== 'female') return false;
    if (room.gender_type === 'any' && room.current_gender_occupancy !== 'empty' && room.current_gender_occupancy !== userGender) return false;
    return true;
  };

  let canUserActuallyReserve = false;
  let notAvailableReason = "Кімната недоступна для бронювання.";

  if (roomDetails && user) {
    const isGenderCompatible = checkUserGenderCompatibility(user, roomDetails);
    canUserActuallyReserve = roomDetails.is_reservable &&
                             roomDetails.isAvailable && // Backend confirmed spot available for academic_year dates
                             isGenderCompatible;

    if (!roomDetails.is_reservable) {
        notAvailableReason = "Ця кімната наразі не доступна для бронювання (налаштування адміністратора).";
    } else if (!roomDetails.isAvailable) { // This means backend check (count < capacity for dates) failed
        notAvailableReason = "На жаль, на обраний період вже немає вільних місць у цій кімнаті.";
    } else if (!isGenderCompatible) {
        if (!user.gender || user.gender === 'not_specified' || user.gender === 'other') {
            notAvailableReason = "Будь ласка, вкажіть вашу стать (чоловіча/жіноча) у профілі для бронювання.";
        } else if (roomDetails.gender_type === 'male') {
            notAvailableReason = "Ця кімната призначена тільки для хлопців.";
        } else if (roomDetails.gender_type === 'female') {
            notAvailableReason = "Ця кімната призначена тільки для дівчат.";
        } else if (roomDetails.gender_type === 'any' && roomDetails.current_gender_occupancy !== 'empty') {
            const genderLabel = roomDetails.current_gender_occupancy === 'male' ? 'хлопцями' : 'дівчатами';
            notAvailableReason = `Ця кімната вже частково зайнята ${genderLabel}.`;
        } else {
            notAvailableReason = "Ця кімната не підходить для вашої статі.";
        }
    }
  }


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
                <div className={styles.infoItem}><BuildingOffice2Icon /> Поверх: {roomDetails.floor !== null ? roomDetails.floor : 'N/A'}</div>
                <div className={styles.infoItem}><ShieldCheckIcon /> Тип по статі: {genderTypeLabels[roomDetails.gender_type] || 'N/A'}</div>
                <div className={styles.infoItem}><UsersIcon /> Поточне заселення (стать): {currentGenderOccupancyLabels[roomDetails.current_gender_occupancy] || 'N/A'}</div>
                <div className={styles.infoItem}><UsersIcon /> Зайнято місць: {roomDetails.occupied_places}</div>
                <div className={styles.infoItem}><UsersIcon /> Вільних місць: {Math.max(0, roomDetails.capacity - roomDetails.occupied_places)}</div>
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

              {canUserActuallyReserve ? (
                <button
                  onClick={handleReservation}
                  disabled={isReserving || !academicYear}
                  className={styles.reserveButton}
                >
                  <CheckCircleIcon />
                  {isReserving ? 'Бронювання...' : `Забронювати на ${academicYear || 'цей рік'}`}
                </button>
              ) : (
                <p className={styles.notAvailableMessage}>
                  <NoSymbolIcon /> {notAvailableReason}
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