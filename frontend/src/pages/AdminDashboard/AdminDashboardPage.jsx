import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/AdminDashboardPage.module.css';
import {
    ClipboardDocumentListIcon,
    AcademicCapIcon as GroupsIcon,
    WrenchScrewdriverIcon,
    BookmarkSquareIcon,
    HomeModernIcon,
    UsersIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon as AdminPanelIcon,
    DocumentTextIcon as ContractIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';

const StatCard = ({ title, count, icon, linkTo, onNavigate, description, fullWidth }) => {
    const IconComponent = icon;
    return (
        <div
            className={`${styles.statCard} ${fullWidth ? styles.fullWidthCard : ''}`}
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

const AdminDashboardPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [stats, setStats] = useState({
        totalPendingApplications: 0,
        totalActiveReservations: 0,
        totalUsers: 0,
        totalFaculties: 0,
        totalDormitories: 0,
        totalPendingAgreements: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    const fetchAdminStats = useCallback(async () => {
        if (!user || !['admin', 'superadmin'].includes(user.role)) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        // Declare promise result variables here to be accessible in finally
        let applicationsRes, reservationsRes, usersRes, facultiesRes, dormitoriesRes, agreementsRes;

        try {
            const appParams = { status: 'pending', limit: 1, page: 1 };
            // Changed 'active' to 'confirmed' as 'active' is not a valid status for room reservations
            const resParams = { status: 'confirmed', limit: 1, page: 1 };
            const agrParams = { status: 'pending_review', limit: 1, page: 1 };

            [
                applicationsRes,
                reservationsRes,
                usersRes,
                facultiesRes,
                dormitoriesRes,
                agreementsRes
            ] = await Promise.allSettled([
                api.get('/admin/accommodation-applications', { params: appParams }),
                api.get('/admin/room-reservations', { params: resParams }),
                // Changed '/users' to '/users/all' as '/users' is not a GET endpoint
                api.get('/users/all', { params: { limit: 1, page: 1 } }), // Params are ignored by backend but harmless
                api.get('/faculties', { params: { limit: 1, page: 1 } }),  // Params are ignored by backend
                api.get('/dormitories', { params: { limit: 1, page: 1 } }),// Params are ignored by backend
                api.get('/admin/settlement-agreements', { params: agrParams })
            ]);

            const getResultData = (promiseResult, field = 'total') => {
                if (promiseResult.status === 'fulfilled') {
                    return promiseResult.value.data?.[field] ?? promiseResult.value.data?.meta?.[field] ?? 0;
                }
                return '?';
            };

            setStats({
                totalPendingApplications: getResultData(applicationsRes),
                totalActiveReservations: getResultData(reservationsRes),
                totalUsers: usersRes.status === 'fulfilled' ? (usersRes.value.data?.length ?? 0) : '?',
                totalFaculties: facultiesRes.status === 'fulfilled' ? (facultiesRes.value.data?.length ?? 0) : '?',
                totalDormitories: dormitoriesRes.status === 'fulfilled' ? (dormitoriesRes.value.data?.length ?? 0) : '?',
                totalPendingAgreements: getResultData(agreementsRes),
            });

        } catch (err) { // This catch handles errors from Promise.allSettled itself or setStats
            ToastService.error("Сталася системна помилка при завантаженні статистики.");
            setError("Не вдалося завантажити всю статистику. Спробуйте оновити сторінку.");
            setStats(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: '?' }), {}));
        } finally {
            setIsLoading(false);
            // Check for individual promise rejections
            const resultsArray = [applicationsRes, reservationsRes, usersRes, facultiesRes, dormitoriesRes, agreementsRes];
            const hasErrors = resultsArray.some(res => res && res.status === 'rejected');

            if (hasErrors && !error) { // If general error wasn't set, but individual ones exist
                 ToastService.warn("Не вдалося завантажити деякі дані статистики.");
                 setError("Частина статистичних даних не завантажилась.");
            }
        }
    }, [user]); // Removed `error` from dependency array

    useEffect(() => {
        if (user) {
            fetchAdminStats();
        }
    }, [fetchAdminStats, user]);

    const handleNavigate = (path) => {
        navigate(path);
    };

    if (!user) {
        return <div className={styles.layout}><div className={styles.loading}>Завантаження даних користувача...</div></div>;
    }
    if (!['admin', 'superadmin'].includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    const formatStatCount = (count) => {
        if (isLoading && count === 0) return "...";
        if (count === '?') return "?";
        return count;
    };

    const formatSectionCount = (count, labelPrefix = "", itemTitle = "") => {
        if (isLoading && count === 0 && !itemTitle.includes("Налаштування") && !itemTitle.includes("Системою") ) return "...";
        if (count === '?') return "?";
        if (!labelPrefix && (itemTitle.includes("Налаштування") || itemTitle.includes("Системою"))) return undefined;
        return `${labelPrefix}${count}`;
    }

    const adminSections = [
        { title: "Заявки на Поселення", countKey: "totalPendingApplications", labelPrefix: "В очікуванні: ", icon: ClipboardDocumentListIcon, linkTo: "/admin/accommodation-applications", description: "Розгляд та управління студентськими заявками на проживання." },
        { title: "Бронювання Кімнат", countKey: "totalActiveReservations", labelPrefix: "Активних: ", icon: BookmarkSquareIcon, linkTo: "/admin/room-reservations", description: "Управління процесом бронювання кімнат студентами." },
        { title: "Договори на Поселення", countKey: "totalPendingAgreements", labelPrefix: "На розгляді: ", icon: ContractIcon, linkTo: "/admin/settlement-agreements", description: "Перегляд та адміністрування договорів на поселення." },
        { title: "Налаштування Заяв", icon: WrenchScrewdriverIcon, linkTo: "/admin/application-presets", description: "Конфігурація параметрів та періодів подачі заяв." },
        { title: "Гуртожитки та Кімнати", countKey: "totalDormitories", labelPrefix: "Гуртожитків: ", icon: BuildingOfficeIcon, linkTo: "/admin/management/dormitories", description: "Керування гуртожитками та кімнатним фондом." },
    ];

    if (user.role === 'superadmin') {
         adminSections.push({ title: "Керування Системою", icon: AdminPanelIcon, linkTo: "/admin/management", description: "Користувачі, ролі, факультети, глобальні налаштування." });
    }

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
                            <AdminPanelIcon className={styles.titleIcon} aria-hidden="true" />
                            Панель Адміністратора
                        </h1>
                    </div>

                    <div className={styles.contentWrapper}>
                        {(isLoading && !error && Object.values(stats).every(val => val === 0)) && (
                            <div className={styles.loading}>Завантаження даних панелі...</div>
                        )}
                        {error && !isLoading && (
                            <div className={styles.errorMessage}>{error}</div>
                        )}

                        {(!isLoading || !Object.values(stats).every(val => val === 0)) && !error && (
                            <>
                                <div className={styles.overallStatsContainer}>
                                    <div className={styles.overallStatItem}>
                                        <UsersIcon className={styles.overallStatIcon} aria-hidden="true" />
                                        <div>
                                            <span className={styles.overallStatValue}>{formatStatCount(stats.totalUsers)}</span>
                                            <span className={styles.overallStatLabel}>Користувачів</span>
                                        </div>
                                    </div>
                                    <div className={styles.overallStatItem}>
                                        <GroupsIcon className={styles.overallStatIcon} aria-hidden="true" />
                                        <div>
                                            <span className={styles.overallStatValue}>{formatStatCount(stats.totalFaculties)}</span>
                                            <span className={styles.overallStatLabel}>Факультетів</span>
                                        </div>
                                    </div>
                                    <div className={styles.overallStatItem}>
                                        <HomeModernIcon className={styles.overallStatIcon} aria-hidden="true" />
                                        <div>
                                            <span className={styles.overallStatValue}>{formatStatCount(stats.totalDormitories)}</span>
                                            <span className={styles.overallStatLabel}>Гуртожитків</span>
                                        </div>
                                    </div>
                                </div>

                                <h2 className={styles.sectionTitle}>Модулі Керування</h2>
                                <div className={styles.statsGrid}>
                                    {adminSections.map(section => (
                                        <StatCard
                                            key={section.linkTo}
                                            title={section.title}
                                            count={section.countKey ? formatSectionCount(stats[section.countKey], section.labelPrefix, section.title) : undefined}
                                            icon={section.icon}
                                            linkTo={section.linkTo}
                                            onNavigate={handleNavigate}
                                            description={section.description}
                                            fullWidth={section.fullWidth}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        { !isLoading && !error && adminSections.length === 0 && (
                            <p className={styles.emptyMessage}>Модулі керування відсутні.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardPage;