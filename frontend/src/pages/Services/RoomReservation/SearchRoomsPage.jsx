import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { ToastService } from '../../../utils/toastConfig';
import Sidebar from '../../../components/UI/Sidebar/Sidebar';
import Navbar from '../../../components/UI/Navbar/Navbar';
import styles from './styles/SearchRoomsPage.module.css';
import { MagnifyingGlassIcon, CalendarDaysIcon, UsersIcon, BuildingOffice2Icon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useUser } from '../../../contexts/UserContext';

const RoomCard = ({ room, academicYear }) => {
  const navigate = useNavigate();
  const handleSelect = () => {
    navigate(`/services/rooms/${room.id}`, { state: { academicYearForReservation: academicYear, roomDetailsFromSearch: room } });
  };

  const genderTypeLabels = {
    male: 'Чоловіча',
    female: 'Жіноча',
    mixed: 'Змішана (можливо для обох статей)',
    any: 'Будь-яка / Залежить від першого поселенця'
  };
  const currentGenderOccupancyLabels = {
    male: 'Чоловіки',
    female: 'Жінки',
    empty: 'Вільна (стать не визначено)'
  };


  return (
    <div className={styles.roomCard}>
      <div className={styles.roomCardImagePlaceholder}>
        <BuildingOffice2Icon />
      </div>
      <div className={styles.roomCardContent}>
        <h3>Кімната №{room.number}</h3>
        <p><strong>Гуртожиток:</strong> {room.dormitory_name}</p>
        <p><strong>Місткість:</strong> {room.capacity} чол.</p>
        <p><strong>Вільних місць:</strong> {room.free_places}</p>
        <p><strong>Поточна стать мешканців:</strong> {currentGenderOccupancyLabels[room.current_gender_occupancy] || 'Не визначено'}</p>
        <p><strong>Тип кімнати (по статі):</strong> {genderTypeLabels[room.gender_type] || 'N/A'}</p>
        {room.floor && <p><strong>Поверх:</strong> {room.floor}</p>}
        {/* Price removed */}
      </div>
      <button onClick={handleSelect} className={styles.roomCardButton}>
        Детальніше / Забронювати
      </button>
    </div>
  );
};

const getCurrentAndNextAcademicYear = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    let academicStartYear = today.getFullYear();

    if (currentMonth >= 6) { 
        academicStartYear = today.getFullYear();
    } else { 
        academicStartYear = today.getFullYear();
    }
    
    let nextReservationStartYear = today.getFullYear();
    if (currentMonth >= 6) { 
        nextReservationStartYear = today.getFullYear() + 1;
    }

    const nextAcademicYearString = `${nextReservationStartYear}-${nextReservationStartYear + 1}`;
    
    return {
      nextAcademicYearForBooking: nextAcademicYearString,
    };
};


const SearchRoomsPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const {user} = useUser();
  const { nextAcademicYearForBooking } = getCurrentAndNextAcademicYear();


  const [dormitories, setDormitories] = useState([]);
  const [filters, setFilters] = useState({
    dormitory_id: '',
    gender: user?.gender && ['male', 'female'].includes(user.gender) ? user.gender : '',
    academic_year_for_search: nextAcademicYearForBooking,
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    const fetchDormitories = async () => {
      try {
        const response = await api.get('/dormitories');
        setDormitories(response.data || []);
      } catch (error) {
        ToastService.handleApiError(error);
      }
    };
    fetchDormitories();
  }, []);
  
  useEffect(() => {
    if (user && user.gender && ['male', 'female'].includes(user.gender) && !filters.gender) {
        setFilters(prev => ({ ...prev, gender: user.gender }));
    }
    if (!filters.academic_year_for_search) {
        setFilters(prev => ({ ...prev, academic_year_for_search: nextAcademicYearForBooking}));
    }
  }, [user, filters.gender, filters.academic_year_for_search, nextAcademicYearForBooking]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);
    setAvailableRooms([]);
    try {
      const searchParams = {...filters};
      if (!searchParams.dormitory_id) delete searchParams.dormitory_id;
      if (searchParams.gender === 'any' || !searchParams.gender) delete searchParams.gender;

      const response = await api.get('/services/rooms/search', { params: searchParams });
      setAvailableRooms(response.data || []);
      if (response.data.length === 0) {
        ToastService.info("Вільних кімнат за вашими критеріями не знайдено.");
      }
    } catch (error) {
      ToastService.handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const academicYearOptions = () => {
    return [nextAcademicYearForBooking];
  };


  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar isSidebarExpanded={isSidebarExpanded} />
        <div className={styles.pageContainer}>
          <h1 className={styles.pageTitle}>
            <MagnifyingGlassIcon className={styles.titleIcon} />
            Пошук та Бронювання Кімнат
          </h1>
          <p className={styles.pageDescription}>
            Знайдіть вільну кімнату в гуртожитку на навчальний рік {filters.academic_year_for_search} та забронюйте місце.
          </p>

          <form onSubmit={handleSearch} className={styles.filterForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="academic_year_for_search" className={styles.label}>
                  <CalendarDaysIcon className={styles.labelIcon}/>
                  Навчальний рік для бронювання:
                </label>
                <select
                    id="academic_year_for_search"
                    name="academic_year_for_search"
                    value={filters.academic_year_for_search}
                    onChange={handleFilterChange}
                    className={styles.select}
                    disabled
                >
                    {academicYearOptions().map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="dormitory_id" className={styles.label}>
                    <BuildingOffice2Icon className={styles.labelIcon} />
                    Гуртожиток:
                    </label>
                    <select id="dormitory_id" name="dormitory_id" value={filters.dormitory_id} onChange={handleFilterChange} className={styles.select}>
                    <option value="">Будь-який</option>
                    {dormitories.map(dorm => (
                        <option key={dorm.id} value={dorm.id}>{dorm.name}</option>
                    ))}
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="gender" className={styles.label}>
                    <UsersIcon className={styles.labelIcon} />
                    Ваша стать (для підбору):
                    </label>
                    <select id="gender" name="gender" value={filters.gender} onChange={handleFilterChange} className={styles.select} required>
                        <option value="" disabled>Оберіть стать</option>
                        <option value="male">Чоловіча</option>
                        <option value="female">Жіноча</option>
                    </select>
                </div>
            </div>
            <button type="submit" disabled={isLoading || !filters.gender} className={styles.searchButton}>
              <MagnifyingGlassIcon className={styles.buttonIcon} />
              {isLoading ? 'Пошук...' : 'Знайти кімнати'}
            </button>
          </form>

          {isLoading && <div className={styles.loadingSpinner}>Завантаження результатів...</div>}

          {!isLoading && hasSearched && availableRooms.length === 0 && (
            <div className={styles.noResultsMessage}>
              <InformationCircleIcon/>
              <p>На жаль, вільних кімнат за вашими критеріями не знайдено. Спробуйте змінити фільтри.</p>
            </div>
          )}

          {availableRooms.length > 0 && !isLoading && (
            <div className={styles.resultsContainer}>
              <h2 className={styles.resultsTitle}>Доступні кімнати ({availableRooms.length}) на {filters.academic_year_for_search} н.р.:</h2>
              <div className={styles.roomGrid}>
                {availableRooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    academicYear={filters.academic_year_for_search}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchRoomsPage;