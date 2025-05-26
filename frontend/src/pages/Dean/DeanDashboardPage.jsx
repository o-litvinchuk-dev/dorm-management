import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { ToastService } from '../../utils/toastConfig';
import Sidebar from '../../components/UI/Sidebar/Sidebar';
import Navbar from '../../components/UI/Navbar/Navbar';
import styles from './styles/DeanDashboardPage.module.css';
import {
    ClipboardDocumentListIcon,
    AcademicCapIcon as GroupsIcon,
    WrenchScrewdriverIcon,
    BuildingLibraryIcon as DeanPanelTitleIcon,
    UserGroupIcon as StudentCouncilIcon // Додано імпорт іконки для студради
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

const DeanDashboardPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [stats, setStats] = useState({
        facultyApplicationsCount: 0,
        facultyGroupsCount: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    const fetchDeanStats = useCallback(async () => {
        if (!user || user.role !== 'faculty_dean_office' || !user.faculty_id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        let applicationsRes, groupsRes;

        try {
            const appParams = { status: 'pending', limit: 1, page: 1 };
            const applicationsPromise = api.get('/admin/accommodation-applications', { params: appParams });
            const groupsPromise = api.get(`/faculties/${user.faculty_id}/groups`);

            [applicationsRes, groupsRes] = await Promise.allSettled([applicationsPromise, groupsPromise]);

            const getResultData = (promiseResult, field = 'total') => {
                if (promiseResult.status === 'fulfilled') {
                    return promiseResult.value.data?.[field] ?? promiseResult.value.data?.meta?.[field] ?? 0;
                }
                return '?';
            };

            setStats({
                facultyApplicationsCount: getResultData(applicationsRes),
                facultyGroupsCount: groupsRes.status === 'fulfilled' ? (groupsRes.value.data?.length ?? 0) : '?',
            });

        } catch (err) {
            ToastService.error("Сталася системна помилка при завантаженні статистики.");
            setError("Не вдалося завантажити статистику. Спробуйте оновити сторінку.");
            setStats({ facultyApplicationsCount: '?', facultyGroupsCount: '?' });
        } finally {
            setIsLoading(false);
            const resultsArray = [applicationsRes, groupsRes].filter(Boolean);
            const hasErrors = resultsArray.some(res => res.status === 'rejected');

            if (hasErrors && !error) {
                 ToastService.warn("Не вдалося завантажити деякі дані статистики.");
                 setError("Частина статистичних даних не завантажилась.");
            }
        }
    }, [user]);

    useEffect(() => {
        if (user && user.role === 'faculty_dean_office' && user.faculty_id) {
            fetchDeanStats();
        } else {
            setIsLoading(false);
        }
    }, [fetchDeanStats, user]);

    const handleNavigate = (path) => {
        navigate(path);
    };

    if (!user) {
        return <div className={styles.layout}><div className={styles.loading}>Завантаження даних користувача...</div></div>;
    }

    if (user.role !== 'faculty_dean_office') {
        return <Navigate to="/dashboard" replace />;
    }

    if (user.role === 'faculty_dean_office' && !user.faculty_id) {
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
                                <DeanPanelTitleIcon className={styles.titleIcon} aria-hidden="true" />
                                Панель Деканату
                            </h1>
                        </div>
                        <div className={styles.contentWrapper}>
                            <p className={styles.errorMessage}>Інформація про ваш факультет не визначена. Будь ласка, зверніться до адміністратора системи.</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const formatSectionCount = (count, labelPrefix = "", itemTitle = "") => {
        if (isLoading && count === 0 && !itemTitle.includes("Налаштування")) return "...";
        if (count === '?') return "?";
        if (!labelPrefix && itemTitle.includes("Налаштування")) return undefined;
        return `${labelPrefix}${count}`;
    };

    const deanSections = [
        { title: "Заявки на Поселення", countKey: "facultyApplicationsCount", labelPrefix: "В очікуванні: ", icon: ClipboardDocumentListIcon, linkTo: "/admin/accommodation-applications", description: "Розгляд та управління заявками студентів вашого факультету." },
        { title: "Управління Групами", countKey: "facultyGroupsCount", labelPrefix: "Груп: ", icon: GroupsIcon, linkTo: "/dean/groups", description: "Створення, редагування та видалення навчальних груп факультету." },
        { title: "Управління Студрадою", icon: StudentCouncilIcon, linkTo: "/dean/student-council", description: "Призначення та керування членами студентської ради факультету." }, // Нова картка
        { title: "Налаштування Заяв", icon: WrenchScrewdriverIcon, linkTo: "/admin/application-presets", description: "Керування глобальними та факультет-специфічними налаштуваннями для подачі заяв." },
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
                            <DeanPanelTitleIcon className={styles.titleIcon} aria-hidden="true" />
                            Панель Деканату: {user.faculty_name || "Факультет"}
                        </h1>
                    </div>
                    <div className={styles.contentWrapper}>
                        {(isLoading && !error) && (
                            <div className={styles.loading}>Завантаження даних панелі...</div>
                        )}
                        {error && !isLoading && (
                            <div className={styles.errorMessage}>{error}</div>
                        )}
                        {!isLoading && !error && (
                            <>
                                <h2 className={styles.sectionTitle}>Модулі Керування</h2>
                                <div className={styles.statsGrid}>
                                    {deanSections.map(section => (
                                        <StatCard
                                            key={section.linkTo}
                                            title={section.title}
                                            count={section.countKey ? formatSectionCount(stats[section.countKey], section.labelPrefix, section.title) : undefined}
                                            icon={section.icon}
                                            linkTo={section.linkTo}
                                            onNavigate={handleNavigate}
                                            description={section.description}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        {!isLoading && !error && deanSections.length === 0 && (
                            <p className={styles.emptyMessage}>Модулі керування для деканату відсутні.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DeanDashboardPage;