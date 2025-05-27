import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/DormManagerDashboardPage.module.css';
import {
    ClipboardDocumentListIcon,
    BookmarkSquareIcon,
    DocumentTextIcon as ContractIcon,
    BuildingStorefrontIcon,
    BuildingLibraryIcon,
    WrenchScrewdriverIcon,
    UserGroupIcon as StudentCouncilIcon,
    CalendarDaysIcon as EventsIcon, // For Managing Events
    ListBulletIcon as ScheduleAdminIcon // For Managing Settlement Schedule
} from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';

const StatCard = ({ title, count, icon, linkTo, onNavigate, description }) => {
    const IconComponent = icon;
    return (
        <div
            className={styles.statCard}
            onClick={() => onNavigate(linkTo)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(linkTo); }}
            aria-label={title}
        >
            <div className={styles.cardIconWrapper}>
                <IconComponent className={styles.cardIcon} aria-hidden="true" />
            </div>
            <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{title}</h3>
                {count !== undefined && <p className={styles.cardCount}>{count}</p>}
                {description && <p className={styles.cardDescription}>{description}</p>}
            </div>
        </div>
    );
};

const DormManagerDashboardPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [stats, setStats] = useState({
        accommodationApplicationsCount: 0,
        roomReservationsCount: 0,
        settlementAgreementsCount: 0,
        dormitoryName: user?.dormitory_name || "Ваш гуртожиток"
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    const fetchStats = useCallback(async () => {
        if (!user || user.role !== 'dorm_manager' || !user.dormitory_id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/dorm-manager/stats');
            setStats(response.data);
        } catch (err) {
            ToastService.handleApiError(err);
            setError("Не вдалося завантажити статистику. Спробуйте оновити сторінку.");
            setStats({
                accommodationApplicationsCount: '?',
                roomReservationsCount: '?',
                settlementAgreementsCount: '?',
                dormitoryName: user?.dormitory_name || 'Помилка завантаження назви'
            });
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && user.role === 'dorm_manager' && user.dormitory_id) {
            fetchStats();
        } else if (user && (user.role !== 'dorm_manager' || !user.dormitory_id)) {
            setIsLoading(false); // Ensure loading stops if user is not a dorm manager or has no dorm
        }
    }, [fetchStats, user]);

    const handleNavigate = (path) => {
        navigate(path);
    };

    if (!user) {
        return <div className={styles.layout}><div className={styles.loading}>Завантаження даних користувача...</div></div>;
    }

    if (user.role !== 'dorm_manager') {
        return <Navigate to="/dashboard" replace />;
    }

    if (user.role === 'dorm_manager' && !user.dormitory_id) {
        return (
            <div className={styles.layout}>
                <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
                <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                    <Navbar
                        isSidebarExpanded={isSidebarExpanded}
                        onMenuToggle={() => setIsSidebarExpanded(prev => !prev)}
                    />
                    <main className={styles.pageContainer}>
                        <div className={styles.header}>
                            <h1 className={styles.title}>Панель Коменданта</h1>
                        </div>
                        <div className={styles.contentWrapper}>
                            <p className={styles.errorMessage}>Вам не призначено гуртожиток для управління. Будь ласка, зверніться до адміністратора системи.</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const formatStatCount = (count, labelPrefix = "", itemTitle = "") => {
        if (isLoading && count === 0 && !itemTitle.includes("Налаштування") && !itemTitle.includes("Подіями") && !itemTitle.includes("Розклад")) return "...";
        if (count === '?') return "?";
        if (!labelPrefix && (itemTitle.includes("Налаштування") || itemTitle.includes("Подіями") || itemTitle.includes("Розклад"))) return undefined;
        return `${labelPrefix}${count}`;
    };

    const dormManagerSections = [
        { title: "Заявки на Поселення", countKey: "accommodationApplicationsCount", labelPrefix: "Активних: ", icon: ClipboardDocumentListIcon, linkTo: "/admin/accommodation-applications", description: "Розгляд та управління заявками на поселення у вашому гуртожитку." },
        { title: "Бронювання Кімнат", countKey: "roomReservationsCount", labelPrefix: "Активних: ", icon: BookmarkSquareIcon, linkTo: "/admin/room-reservations", description: "Управління бронюваннями кімнат у вашому гуртожитку." },
        { title: "Договори на Поселення", countKey: "settlementAgreementsCount", labelPrefix: "На розгляді: ", icon: ContractIcon, linkTo: "/admin/settlement-agreements", description: "Перегляд та адміністрування договорів на поселення для вашого гуртожитку." },
        { title: "Керування Кімнатами", icon: BuildingLibraryIcon, linkTo: "/dorm-manager/rooms", description: "Додавання, редагування та видалення кімнат у вашому гуртожитку." },
        { title: "Керування Подіями", icon: EventsIcon, linkTo: "/admin/manage-events", description: "Створення та редагування подій для вашого гуртожитку та університету."},
        { title: "Розклад Поселення (Адмін)", icon: ScheduleAdminIcon, linkTo: "/admin/manage-settlement-schedule", description: "Адміністрування записів у загальному розкладі поселення."},
        { title: "Студентські Ради", icon: StudentCouncilIcon, linkTo: "/dean/student-council", description: "Перегляд інформації про студентські ради факультетів." },
        { title: "Налаштування Заяв", icon: WrenchScrewdriverIcon, linkTo: "/admin/application-presets", description: "Конфігурація параметрів подачі заяв для вашого гуртожитку." },
    ];

    return (
        <div className={styles.layout}>
            <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
            <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
                <Navbar
                    isSidebarExpanded={isSidebarExpanded}
                    onMenuToggle={() => setIsSidebarExpanded(prev => !prev)}
                />
                <main className={styles.pageContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>
                            <BuildingStorefrontIcon className={styles.titleIcon} aria-hidden="true" />
                            Панель Керування Гуртожитком: {stats.dormitoryName}
                        </h1>
                    </div>
                    <div className={styles.contentWrapper}>
                        {isLoading && !error && (
                            <div className={styles.loading}>Завантаження даних панелі...</div>
                        )}
                        {error && !isLoading && (
                            <div className={styles.errorMessage}>{error}</div>
                        )}
                        {!isLoading && !error && (
                            <>
                                <h2 className={styles.sectionTitle}>Модулі Керування</h2>
                                <div className={styles.statsGrid}>
                                    {dormManagerSections.map(section => (
                                        <StatCard
                                            key={section.linkTo}
                                            title={section.title}
                                            count={section.countKey ? formatStatCount(stats[section.countKey], section.labelPrefix, section.title) : undefined}
                                            icon={section.icon}
                                            linkTo={section.linkTo}
                                            onNavigate={handleNavigate}
                                            description={section.description}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        {!isLoading && !error && dormManagerSections.length === 0 && (
                            <p className={styles.emptyMessage}>Модулі керування для коменданта відсутні.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DormManagerDashboardPage;