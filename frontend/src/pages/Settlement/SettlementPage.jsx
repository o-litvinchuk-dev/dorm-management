import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    XMarkIcon as CloseModalIcon, BuildingOffice2Icon, PlusIcon, PencilIcon, TrashIcon
} from '@heroicons/react/24/outline';
import { useUser } from "../../contexts/UserContext";
// Admin modals will be imported by the admin management page
// import SettlementScheduleFormModal from "../../components/Admin/SettlementScheduleFormModal";
// import EventFormModal from "../../components/Admin/EventFormModal";

moment.locale('uk');
const localizer = momentLocalizer(moment);

const ItemDetailModal = ({ item, onClose }) => {
    if (!item || !item.resource) return null;
    const { resource } = item;
    const isGeneralEvent = resource.type === 'event';

    const formatDate = (dateStr, includeTime = true) => {
        if (!dateStr) return 'Не вказано';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Недійсна дата';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        if (includeTime && dateStr.includes('T')) { // Crude check for datetime string
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return date.toLocaleString('uk-UA', options);
    };

    const targetTypeToLabel = (type) => {
        const map = { all: 'Усі', faculty: 'Факультет', dormitory: 'Гуртожиток', course: 'Курс', group: 'Група', all_settled: 'Усі поселені' };
        return map[type] || type;
    }

    const formatTargetGroupDisplay = (entry) => {
        if (!entry || !entry.target_group_type || entry.target_group_type === 'all') return 'Усіх';
        let name = '';
        if (entry.target_group_type === 'faculty') name = entry.faculty_name || `Факультет ID: ${entry.target_group_id}`;
        else if (entry.target_group_type === 'dormitory') name = entry.dormitory_name || `Гуртожиток ID: ${entry.target_group_id}`;
        else if (entry.target_group_type === 'course') name = `Курс: ${entry.target_group_id}`;
        else if (entry.target_group_type === 'group') name = entry.group_name_for_target || `Група ID: ${entry.target_group_id}`; // using alias from model
        else if (entry.target_group_type === 'all_settled') return 'Усіх поселених';
        return name || `${targetTypeToLabel(entry.target_group_type)}: ${entry.target_group_id || 'не вказано'}`;
    };


    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.modalCloseButton} aria-label="Закрити деталі">
                    <CloseModalIcon />
                </button>
                <h3 className={styles.modalTitle}>{item.title}</h3>
                <div className={styles.modalBody}>
                    <p><ClockIcon /> <strong>Початок:</strong> {formatDate(resource.start_time || resource.start_date, !item.allDay)}</p>
                    {(resource.end_time || resource.end_date) &&
                        <p><ClockIcon /> <strong>Кінець:</strong> {formatDate(resource.end_time || resource.end_date, !item.allDay)}</p>
                    }
                    {resource.location && <p><MapPinIcon /> <strong>Місце:</strong> {resource.location}</p>}
                    {resource.description && <p><InformationCircleIcon /> <strong>Опис:</strong> {resource.description}</p>}
                    
                    {isGeneralEvent && resource.category && <p><TagIcon /> <strong>Категорія:</strong> {resource.category}</p>}
                    
                    {isGeneralEvent && resource.targets && resource.targets.length > 0 && (
                        <p><UsersIcon /> <strong>Для:</strong> {resource.targets.map(t => formatTargetGroup(t)).join(', ')}</p>
                    )}
                    {!isGeneralEvent && resource.target_group_type && (
                         <p><UsersIcon /> <strong>Для:</strong> {formatTargetGroup(resource)}</p>
                    )}

                    {resource.creator_name && <p><UserCircleIcon /> <strong>Створив:</strong> {resource.creator_name}</p>}
                </div>
            </div>
        </div>
    );
};


const SettlementPage = () => {
    const { user, isLoading: userIsLoading } = useUser();
    const [calendarItems, setCalendarItems] = useState([]);
    const [allDormitories, setAllDormitories] = useState([]); // For filtering dormitory details
    const [selectedDormitoryId, setSelectedDormitoryId] = useState('');
    const [dormitoryScheduleDetails, setDormitoryScheduleDetails] = useState([]);
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
            const titlePrefix = isEvent ? 'Подія: ' : 'Розклад: ';
            const defaultColor = isEvent ? '#3b82f6' : '#f59e0b'; // Blue for events, Orange for schedule

            if (!startDateString) {
                console.warn(`[CalendarTransform] Item ID ${item.id} of type ${type} has no start_date/start_time.`);
                return null;
            }

            const start = new Date(startDateString);
            let end = endDateString ? new Date(endDateString) : null;
            let allDay = false;

            // Check if it's a date-only string (YYYY-MM-DD)
            if (startDateString && !startDateString.includes('T') && startDateString.length === 10) {
                allDay = true;
                // For all-day events, react-big-calendar expects the end date to be exclusive
                if (end && endDateString && !endDateString.includes('T') && endDateString.length === 10) {
                    end.setDate(end.getDate() + 1);
                } else if (!end) { // If no end date, make it a single full day event
                    end = new Date(start);
                    end.setDate(start.getDate() + 1);
                }
            } else if (end && start > end) { // If end is before start (invalid), make it 1 hour long
                end = new Date(start.getTime() + 60*60*1000);
            } else if (!end) { // If no end date for timed event, make it 1 hour long
                 end = new Date(start.getTime() + 60*60*1000);
            }


            return {
                id: `${type}-${item.id}`,
                title: `${titlePrefix}${item.title}`,
                start,
                end,
                allDay,
                resource: { ...item, type }, // Store original item and its type
                hexColor: item.color_tag || defaultColor,
            };
        }).filter(Boolean); // Remove null items (e.g., those without start_date)
    };


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [eventsRes, scheduleRes, dormsRes] = await Promise.allSettled([
                api.get("/secure/events"),
                api.get("/secure/settlement-schedule"),
                api.get("/dormitories")
            ]);

            const eventsData = eventsRes.status === 'fulfilled' ? (eventsRes.value.data?.events || eventsRes.value.data || []) : [];
            const scheduleData = scheduleRes.status === 'fulfilled' ? (scheduleRes.value.data?.entries || scheduleRes.value.data || []) : [];
            const dormsData = dormsRes.status === 'fulfilled' ? (dormsRes.value.data || []) : [];
            
            setAllDormitories(dormsData);

            const transformedEvents = transformToCalendarItems(eventsData, 'event');
            const transformedSchedule = transformToCalendarItems(scheduleData, 'schedule');

            setCalendarItems([...transformedEvents, ...transformedSchedule]);

        } catch (error) {
            console.error("Помилка завантаження даних для календаря:", error);
            ToastService.error("Не вдалося завантажити дані для календаря");
            setError("Помилка завантаження даних.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if(!userIsLoading && user){
           fetchData();
        }
    }, [user, userIsLoading, fetchData]);

    useEffect(() => {
        if (selectedDormitoryId && calendarItems.length > 0) {
            const details = calendarItems
                .filter(item => item.resource.type === 'schedule' && String(item.resource.target_group_id) === String(selectedDormitoryId) && item.resource.target_group_type === 'dormitory')
                .map(item => item.resource)
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            setDormitoryScheduleDetails(details);
        } else {
            setDormitoryScheduleDetails([]);
        }
    }, [selectedDormitoryId, calendarItems]);

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
                    borderColor: event.hexColor, // Make border same as background for solid look
                    color: 'white', // Assuming dark colors for bg, light text. Adjust if needed.
                },
            }),
            className: styles.calendarEventItem, // Add a general class for other styles
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
        event: 'Подія', // Or use item.title if you want specific event title
        noEventsInRange: 'Немає подій у цьому діапазоні.',
        showMore: total => `+ Ще ${total}`,
    };
    
    if (userIsLoading) {
        return <div className={styles.pageLoadingState}>Завантаження...</div>;
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
                            Розклад Поселення та Загальні Події
                        </h1>
                    </div>

                    <div className={styles.contentGrid}>
                        <div className={styles.calendarSection}>
                            {isLoading ? (
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
                        <div className={styles.dormitoryDetailsSection}>
                            <h2 className={styles.sectionTitle}><BuildingOffice2Icon/> Деталі по Гуртожитку</h2>
                            <select
                                value={selectedDormitoryId}
                                onChange={(e) => setSelectedDormitoryId(e.target.value)}
                                className={styles.dormSelect}
                                aria-label="Обрати гуртожиток для деталей"
                            >
                                <option value="">Оберіть гуртожиток...</option>
                                {allDormitories.map(dorm => (
                                    <option key={dorm.id} value={dorm.id}>{dorm.name}</option>
                                ))}
                            </select>

                            {selectedDormitoryId ? (
                                dormitoryScheduleDetails.length > 0 ? (
                                    <ul className={styles.detailsList}>
                                        {dormitoryScheduleDetails.map(entry => (
                                            <li key={`detail-${entry.id}`} className={styles.detailItem}>
                                                <strong>{entry.title}</strong>
                                                <p><ClockIcon /> {new Date(entry.start_date).toLocaleString('uk-UA')} {entry.end_date && `- ${new Date(entry.end_date).toLocaleString('uk-UA')}`}</p>
                                                {entry.location && <p><MapPinIcon /> {entry.location}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className={styles.noDetailsMessage}>Для обраного гуртожитку немає записів у розкладі.</p>
                            ) : <p className={styles.noDetailsMessage}>Оберіть гуртожиток, щоб переглянути деталі.</p>}
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