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
  let nextReservationStartYear = today.getFullYear();
  // Якщо зараз липень (6) або пізніше, то наступний навчальний рік починається з поточного року + 1
  // Якщо раніше липня, то бронювання можливе на поточний навчальний рік, який почався минулого року.
  // Однак, для простоти і оскільки ми зазвичай бронюємо наперед, ми можемо завжди пропонувати
  // рік, що починається з поточного (якщо зараз літо/осінь) або наступного (якщо зараз зима/весна).
  // Логіка для "2025-2026" як дефолтного року для бронювання.
  if (currentMonth >= 6) { // Якщо липень або пізніше, пропонуємо наступний навчальний рік
    nextReservationStartYear = today.getFullYear() + 1;
  } else { // Якщо раніше липня, але користувач, скоріш за все, бронює на осінь, також пропонуємо рік, що починається з поточного + 1
    // Або ж, якщо логіка має бути "поточний доступний", то тут має бути today.getFullYear()
    // Для прикладу, якщо зараз Травень 2024, то "поточний" рік для бронювання може бути 2024-2025.
    // Щоб відповідати скріншоту (дефолт 2025-2026), використаємо логіку, що завжди бере наступний.
    // Припускаючи, що зараз не пізніше червня 2025, то 2025-2026 буде "наступним"
    // Якщо ж потрібно точніше, треба знати поточну дату сервера або користувача.
    // Для простоти, як на скріншоті, зробимо так, щоб дефолтний був "майбутній"
    if (today.getFullYear() === 2025 && currentMonth < 6) { // Якщо зараз початок 2025, то 2025-2026 це актуально
        nextReservationStartYear = 2025;
    } else if (today.getFullYear() < 2025) {
        nextReservationStartYear = 2025; // Якщо раніше 2025, то все одно ціль 2025-2026
    } else { // Якщо вже пізніше червня 2025, то 2026-2027
        nextReservationStartYear = today.getFullYear() + 1;
    }
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
  const { user, isLoading: isUserLoading } = useUser(); // Додано isLoading для user
  const { nextAcademicYearForBooking } = getCurrentAndNextAcademicYear();
  
  const [dormitories, setDormitories] = useState([]);
  const [filters, setFilters] = useState({
    dormitory_id: '',
    gender: '', // Буде встановлено в useEffect
    academic_year_for_search: nextAcademicYearForBooking,
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Завантаження кімнат
  const [hasSearched, setHasSearched] = useState(false);
  
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

  // Встановлюємо стать користувача в фільтр, коли дані користувача завантажені
  useEffect(() => {
    if (user && !isUserLoading) { // Чекаємо, поки дані користувача завантажаться
      if (user.gender && ['male', 'female'].includes(user.gender)) {
        setFilters(prevFilters => ({ ...prevFilters, gender: user.gender }));
      } else {
        // Якщо стать не валідна або не вказана, можна або залишити порожнім,
        // або показати повідомлення, що потрібно вказати стать
        setFilters(prevFilters => ({ ...prevFilters, gender: '' })); // або показати повідомлення
        if (user.role === 'student' && (!user.gender || !['male', 'female'].includes(user.gender))) {
            ToastService.warning("Вкажіть стать у профілі", "Для пошуку кімнат необхідно вказати вашу стать (чоловіча/жіноча) у профілі.");
        }
      }
    }
  }, [user, isUserLoading]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // Поле статі тепер не редагується, тому цей обробник для нього не потрібен,
    // але залишаємо для інших фільтрів, якщо вони будуть
    if (name !== 'gender') {
      setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (user && user.role === 'student' && (!filters.gender || !['male', 'female'].includes(filters.gender))) {
        ToastService.error("Оберіть стать", "Будь ласка, переконайтеся, що ваша стать вказана у профілі для продовження пошуку.");
        return;
    }
    setIsLoading(true);
    setHasSearched(true);
    setAvailableRooms([]);
    try {
      const searchParams = {...filters};
      if (!searchParams.dormitory_id) delete searchParams.dormitory_id;
      // gender тепер завжди буде встановлено, якщо користувач - студент з валідною статтю
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
    // Можна розширити, щоб показувати більше опцій, якщо потрібно
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
                  onChange={handleFilterChange} // Дозволяємо змінювати рік
                  className={styles.select}
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
                <input
                  id="gender"
                  name="gender"
                  type="text"
                  value={filters.gender === 'male' ? 'Чоловіча' : filters.gender === 'female' ? 'Жіноча' : 'Не визначено'}
                  className={styles.inputReadOnly} // Стиль для поля, що не редагується
                  readOnly // Робимо поле нередагованим
                  aria-label="Ваша стать (визначається автоматично з профілю)"
                />
                 {isUserLoading && <span className={styles.loadingTextSmall}>Завантаження статі...</span>}
                 {!isUserLoading && user && user.role === 'student' && (!user.gender || !['male', 'female'].includes(user.gender)) && (
                    <p className={styles.warningTextSmall}>Будь ласка, вкажіть стать (чоловіча/жіноча) у вашому <a href="/profile" className={styles.profileLink}>профілі</a> для пошуку.</p>
                 )}
              </div>
            </div>
            <button 
                type="submit" 
                disabled={isLoading || isUserLoading || (user && user.role === 'student' && (!filters.gender || !['male', 'female'].includes(filters.gender)))} 
                className={styles.searchButton}
            >
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