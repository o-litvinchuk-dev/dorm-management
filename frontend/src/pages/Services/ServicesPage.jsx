import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import styles from "./styles/ServicesPage.module.css";
import {
    ClipboardDocumentCheckIcon,
    HomeModernIcon,
    DocumentTextIcon as ContractIcon,
    IdentificationIcon,
    ArrowRightCircleIcon,
    InformationCircleIcon,
    MagnifyingGlassCircleIcon, // Нова іконка
    BookmarkSquareIcon, // Нова іконка
} from "@heroicons/react/24/outline";

const ServiceItem = ({ service, onClick }) => {
    const IconComponent = service.icon;
    return (
        <div
            className={styles.serviceItem}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
            aria-labelledby={`service-title-${service.id}`}
            aria-describedby={`service-desc-${service.id}`}
        >
            {IconComponent && (
                <div className={styles.serviceIconWrapper}>
                    <IconComponent className={styles.serviceIcon} aria-hidden="true" />
                </div>
            )}
            <div className={styles.serviceContent}>
                <h3 id={`service-title-${service.id}`} className={styles.serviceTitle}>
                    {service.name}
                </h3>
                <p id={`service-desc-${service.id}`} className={styles.serviceDescription}>
                    {service.description}
                </p>
            </div>
            <div className={styles.serviceAction}>
                <span>Скористатися послугою</span>
                <ArrowRightCircleIcon className={styles.actionIcon} aria-hidden="true" />
            </div>
        </div>
    );
};

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
        const savedState = localStorage.getItem("sidebarOpen");
        if (savedState !== null) {
            try {
                return JSON.parse(savedState);
            } catch (e) {
                console.error("Error parsing sidebarOpen from localStorage", e);
                return true;
            }
        }
        return true;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);

    useEffect(() => {
        const defineServices = () => {
            try {
                const staticServices = [
                    {
                        id: "accommodation-application-form",
                        name: "1. Форма Заяви на поселення",
                        description: "Заповніть та подайте електронну заяву на отримання місця в гуртожитку.",
                        route: "/services/accommodation-application",
                        icon: ClipboardDocumentCheckIcon,
                    },
                    {
                        id: "settlement-agreement-form",
                        name: "2. Форма Договору на проживання",
                        description: "Заповніть онлайн-форму договору для оформлення проживання.",
                        route: "/services/settlement-agreement",
                        icon: ContractIcon,
                    },
                    {
                        id: "room-reservation-search", // Оновлено ID для унікальності
                        name: "3. Пошук та Бронювання кімнати",
                        description: "Знайдіть вільну кімнату та забронюйте її для поселення.",
                        route: "/services/rooms/search",
                        icon: MagnifyingGlassCircleIcon,
                    },
                    {
                        id: "my-room-reservations",
                        name: "4. Мої бронювання кімнат",
                        description: "Перегляньте та керуйте вашими активними бронюваннями кімнат.",
                        route: "/my-reservations",
                        icon: BookmarkSquareIcon,
                    },
                    {
                        id: "settlement-info",
                        name: "Інформація та Розклад поселення",
                        description: "Актуальні дати, необхідні документи та детальна процедура поселення.",
                        route: "/settlement",
                        icon: InformationCircleIcon,
                    },
                    {
                        id: "view-dormitories",
                        name: "Перегляд гуртожитків",
                        description: "Ознайомтеся зі списком доступних гуртожитків та їх умовами.",
                        route: "/dormitories",
                        icon: HomeModernIcon,
                    },
                    // { // Закоментовано, оскільки функціонал не описаний
                    // id: "generate-pass",
                    // name: "Електронна перепустка",
                    // description: "Сформуйте або перегляньте вашу електронну перепустку для доступу до гуртожитку.",
                    // route: "/services/generate-pass",
                    // icon: IdentificationIcon,
                    // },
                ];
                setServices(staticServices);
            } catch (e) {
                console.error("Помилка налаштування статичних послуг:", e);
                setError("Не вдалося завантажити конфігурацію послуг.");
            } finally {
                setLoading(false);
            }
        };
        defineServices();
    }, []);

    const handleServiceClick = useCallback((route) => {
        navigate(route);
    }, [navigate]);

    const handleToggleSidebar = useCallback((newState) => {
        setIsSidebarExpanded(newState);
    }, []);


    return (
        <div className={styles.servicesLayout}>
            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={handleToggleSidebar}
            />
            <div
                className={`${styles.mainContent} ${
                    !isSidebarExpanded ? styles.sidebarCollapsed : ""
                }`}
            >
                <Navbar
                    isSidebarExpanded={isSidebarExpanded}
                    onMenuToggle={() => handleToggleSidebar(!isSidebarExpanded)}
                />
                <div className={styles.pageContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.pageTitle}>Центр Послуг для Поселення</h1>
                    </div>
                    <p className={styles.introText}>
                        Скористайтеся доступними онлайн-сервісами для спрощення процесу вашого поселення до гуртожитку.
                        Оберіть потрібну послугу зі списку нижче.
                    </p>
                    {loading ? (
                        <p className={styles.loadingMessage}>Завантаження доступних послуг...</p>
                    ) : error ? (
                        <p className={styles.errorMessage}>{error}</p>
                    ) : (
                        <div className={styles.serviceGrid}>
                            {services.map((service, index) => ( // Додав index для нумерації, якщо потрібно
                                <ServiceItem
                                    key={service.id}
                                    service={service}
                                    // index={index + 1} // Розкоментуйте, якщо хочете бачити нумерацію
                                    onClick={() => handleServiceClick(service.route)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;