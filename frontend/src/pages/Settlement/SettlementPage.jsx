import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import styles from "./styles/SettlementPage.module.css";
import { ToastService } from "../../utils/toastConfig";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/uk';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    CalendarDaysIcon, InformationCircleIcon, ClockIcon, MapPinIcon, TagIcon, UsersIcon,
    XMarkIcon as CloseModalIcon, UserCircleIcon, BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { useUser } from "../../contexts/UserContext";

moment.locale('uk');
const localizer = momentLocalizer(moment);

// Функція для форматування цільової групи для модального вікна та списку
const formatTargetGroupDisplay = (entry) => {
    if (!entry || !entry.target_group_type) return 'Не вказано';
    const targetTypeToLabel = (type) => {
        const map = { all: 'Усі', faculty: 'Факультет', dormitory: 'Гуртожиток', course: 'Курс', group: 'Група', all_settled: 'Усі поселені' };
        return map[type] || type;
    };

    if (entry.target_group_type === 'all') return 'Для всіх';
    if (entry.target_group_type === 'all_settled') return 'Для всіх поселених';
    
    let name = '';
    // Використовуємо поля, які приходять з моделі SettlementScheduleEntry
    if (entry.target_group_type === 'faculty') name = entry.faculty_name || `Факультет ID: ${entry.target_group_id}`;
    else if (entry.target_group_type === 'dormitory') name = entry.dormitory_name || `Гуртожиток ID: ${entry.target_group_id}`;
    else if (entry.target_group_type === 'course') name = `Курс: ${entry.target_group_id}`;
    else if (entry.target_group_type === 'group') name = entry.group_name_for_target || `Група ID: ${entry.target_group_id}`;
    
    return name || `${targetTypeToLabel(entry.target_group_type)}: ${entry.target_group_id || 'не вказано'}`;
};

const ItemDetailModal = ({ item, onClose }) => {
    if (!item || !item.resource) return null;
    const { resource } = item;
    const isEvent = resource.type === 'event';

    const formatDate = (dateStr, includeTime = true) => {
        if (!dateStr) return 'Не вказано';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Недійсна дата';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        if (includeTime && dateStr.includes('T') && dateStr.length > 10) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return date.toLocaleString('uk-UA', options);
    };
    
    return (
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.modalCloseButton} aria-label="Закрити деталі">
                    <CloseModalIcon />
                </button>
                <h3 id="modalTitle" className={styles.modalTitle}>{item.title}</h3>
                <div className={styles.modalBody}>
                    <p><ClockIcon /> <strong>Початок:</strong> {formatDate(resource.start_time || resource.start_date, !item.allDay)}</p>
                    {(resource.end_time || resource.end_date) &&
                        <p><ClockIcon /> <strong>Кінець:</strong> {formatDate(resource.end_time || resource.end_date, !item.allDay)}</p>
                    }
                    {resource.location && <p><MapPinIcon /> <strong>Місце:</strong> {resource.location}</p>}
                    {resource.description && <p><InformationCircleIcon /> <strong>Опис:</strong> {resource.description}</p>}
                    
                    {isEvent && resource.category && <p><TagIcon /> <strong>Категорія:</strong> {resource.category}</p>}
                    
                    {isEvent && resource.targets && resource.targets.length > 0 && (
                        <p><UsersIcon /> <strong>Для:</strong> {resource.targets.map(t => formatTargetGroupDisplay(t)).join(', ')}</p>
                    )}
                    {!isEvent && resource.target_group_type && (
                         <p><UsersIcon /> <strong>Для:</strong> {formatTargetGroupDisplay(resource)}</p>
                    )}

                    {resource.creator_name && <p><UserCircleIcon /> <strong>Створив:</strong> {resource.creator_name}</p>}
                </div>
            </div>
        </div>
    );
};


const SettlementPage = () => {
    const { user, isLoading: userIsLoading } = useUser(); // user тепер містить faculty_id, dormitory_id, group_id, course
    const [calendarItems, setCalendarItems] = useState([]);
    const [visibleScheduleEntries, setVisibleScheduleEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const savedState = localStorage.getItem("sidebarOpen");
        return savedState !== null ? JSON.parse(savedState) : true;
    });
    const [selectedCalendarItem, setSelectedCalendarItem] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    const transformToCalendarItems = (items, type) => {
        if (!items || !Array.isArray(items)) return [];
        return items.map(item => {
            const isEvent = type === 'event';
            const startDateString = isEvent ? item.start_time : item.start_date;
            const endDateString = isEvent ? item.end_time : item.end_date;
            // Для подій title може бути просто item.title, для розкладу - item.title
            const titlePrefix = ''; // Прибираємо префікс, щоб назва була чистішою
            const baseTitle = item.title || (isEvent ? 'Подія без назви' : 'Запис розкладу');
            const calendarTitle = `${titlePrefix}${baseTitle}`;

            const defaultColor = isEvent ? '#3b82f6' : '#f59e0b';

            if (!startDateString) {
                console.warn(`[CalendarTransform] Item ID ${item.id} of type ${type} has no start_date/start_time.`);
                return null;
            }

            const start = new Date(startDateString);
            let end = endDateString ? new Date(endDateString) : null;
            let allDay = false;

            if (startDateString && !startDateString.includes('T') && startDateString.length === 10) {
                allDay = true;
                if (end && endDateString && !endDateString.includes('T') && endDateString.length === 10) {
                    const tempEnd = new Date(end);
                    tempEnd.setDate(tempEnd.getDate() + 1);
                    end = tempEnd;
                } else if (!end) {
                    end = new Date(start);
                    end.setDate(start.getDate() + 1);
                }
            } else if (end && start.getTime() === end.getTime()) {
                end = new Date(start.getTime() + 60 * 60 * 1000);
            } else if (end && start > end) {
                end = new Date(start.getTime() + 60 * 60 * 1000);
            } else if (!end) {
                 end = new Date(start.getTime() + 60 * 60 * 1000);
            }

            return {
                id: `${type}-${item.id}`,
                title: calendarTitle,
                start,
                end,
                allDay,
                resource: { ...item, type }, 
                hexColor: item.color_tag || defaultColor,
            };
        }).filter(Boolean);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        if (!user) { // Якщо користувач ще не завантажений, не робимо запит
            setIsLoading(false);
            return;
        }
        try {
            // Запити вже повинні враховувати контекст користувача на бекенді
            const [eventsRes, scheduleRes] = await Promise.allSettled([
                api.get("/secure/events"), 
                api.get("/secure/settlement-schedule") 
            ]);

            const eventsData = eventsRes.status === 'fulfilled' ? (eventsRes.value.data || []) : [];
            // Якщо eventsRes.value.data має 'events', використовуємо його, інакше самі дані
            const actualEvents = Array.isArray(eventsData.events) ? eventsData.events : Array.isArray(eventsData) ? eventsData : [];


            const scheduleData = scheduleRes.status === 'fulfilled' ? (scheduleRes.value.data || []) : [];
             // scheduleData може бути масивом або об'єктом { entries: [...] }
            const actualScheduleEntries = Array.isArray(scheduleData) ? scheduleData : (scheduleData && Array.isArray(scheduleData.entries)) ? scheduleData.entries : [];
            
            const transformedEvents = transformToCalendarItems(actualEvents, 'event');
            const transformedSchedule = transformToCalendarItems(actualScheduleEntries, 'schedule'); // Використовуємо відфільтровані записи для календаря
            
            setCalendarItems([...transformedEvents, ...transformedSchedule]);
            // Встановлюємо відфільтровані записи для списку
            setVisibleScheduleEntries(actualScheduleEntries.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)));

        } catch (error) {
            console.error("Помилка завантаження даних для календаря:", error);
            ToastService.error("Не вдалося завантажити дані для календаря");
            setError("Помилка завантаження даних.");
        } finally {
            setIsLoading(false);
        }
    }, [user]); // Додаємо user до залежностей, щоб перезавантажити дані, коли користувач зміниться

    useEffect(() => {
        if(!userIsLoading){ // Переконуємося, що дані користувача завантажені
           fetchData();
        }
    }, [userIsLoading, fetchData]); // fetchData вже містить user у своїх залежностях


    const handleSelectCalendarItem = useCallback((item) => {
        setSelectedCalendarItem(item);
        setIsDetailModalOpen(true);
    }, []);

    const closeDetailModal = useCallback(() => {
        setIsDetailModalOpen(false);
        setSelectedCalendarItem(null);
    }, []);
    
    const eventPropGetter = useCallback(
        (event) => ({
            ...(event.hexColor && {
                style: {
                    backgroundColor: event.hexColor,
                    borderColor: event.hexColor, 
                    color: 'white', 
                },
            }),
            className: styles.calendarEventItem, 
        }),
        []
    );

    const messages = {
        allDay: 'Весь день',
        previous: 'Назад',
        next: 'Вперед',
        today: 'Сьогодні',
        month: 'Місяць',
        week: 'Тиждень',
        day: 'День',
        agenda: 'Порядок денний',
        date: 'Дата',
        time: 'Час',
        event: 'Захід', 
        noEventsInRange: 'Немає запланованих заходів.',
        showMore: total => `+ Ще ${total}`,
    };
    
    if (userIsLoading) { 
        return <div className={styles.pageLoadingState}>Завантаження даних користувача...</div>;
    }
    if (isLoading && !calendarItems.length) { // Показуємо завантаження, тільки якщо даних ще немає
         return <div className={styles.pageLoadingState}>Завантаження розкладу...</div>;
    }


    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar
                    isSidebarExpanded={isSidebarExpanded}
                    onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
                />
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>
                            <CalendarDaysIcon className={styles.titleIcon} />
                            Розклад Поселення та Події
                        </h1>
                    </div>

                    <div className={styles.contentGrid}>
                        <div className={styles.calendarSection}>
                            {isLoading && calendarItems.length === 0 ? ( // Показувати завантаження, якщо дані ще не завантажені
                                <div className={styles.loadingMessage}>Завантаження календаря...</div>
                            ) : error ? (
                                <div className={styles.errorMessage}>{error}</div>
                            ) : (
                                <div className={styles.calendarContainer}>
                                    <Calendar
                                        localizer={localizer}
                                        events={calendarItems}
                                        startAccessor="start"
                                        endAccessor="end"
                                        allDayAccessor="allDay"
                                        style={{ height: '100%', width: '100%'}}
                                        onSelectEvent={handleSelectCalendarItem}
                                        eventPropGetter={eventPropGetter}
                                        messages={messages}
                                        culture='uk'
                                        views={['month', 'week', 'day', 'agenda']}
                                    />
                                </div>
                            )}
                        </div>
                        <div className={styles.scheduleListSection}>
                            <h2 className={styles.sectionTitle}><BuildingOffice2Icon/> Розклад Поселення</h2>
                            
                            {isLoading && visibleScheduleEntries.length === 0 ? ( // Показувати завантаження, якщо дані ще не завантажені
                                <div className={styles.loadingMessageSmall}>Завантаження розкладу...</div>
                            ) : visibleScheduleEntries.length > 0 ? (
                                <ul className={styles.detailsList}>
                                    {visibleScheduleEntries.map(entry => (
                                        <li key={`schedule-entry-${entry.id}`} className={styles.detailItem}>
                                            <strong>{entry.title}</strong>
                                            <p><ClockIcon /> 
                                                {new Date(entry.start_date).toLocaleString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                {entry.end_date && ` - ${new Date(entry.end_date).toLocaleString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                                            </p>
                                            {entry.location && <p><MapPinIcon /> {entry.location}</p>}
                                            {entry.description && <p><InformationCircleIcon /> {entry.description}</p>}
                                            {entry.target_group_type && (
                                                <p><UsersIcon />Для: {formatTargetGroupDisplay(entry)}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.noDetailsMessage}>Немає доступних записів у розкладі поселення.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isDetailModalOpen && selectedCalendarItem && (
                <ItemDetailModal item={selectedCalendarItem} onClose={closeDetailModal} />
            )}
        </div>
    );
};

export default SettlementPage;