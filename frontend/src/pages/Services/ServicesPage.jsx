import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import styles from "./styles/ServicesPage.module.css";

const ServiceItem = ({ service, index, onClick }) => {
    return (
        <div className={styles.serviceItem} onClick={onClick}>
            <h2 className={styles.serviceTitle}>
                {index}. {service.name}
            </h2>
            <p className={styles.serviceDescription}>{service.description}</p>
        </div>
    );
};

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const staticServices = [
                    {
                        id: "accommodation-application",
                        name: "Заява на поселення",
                        description: "Подайте заяву на поселення в гуртожиток",
                        route: "/services/accommodation-application", // Узгоджено маршрут
                    },
                    {
                        id: "dormitory-settlement",
                        name: "Поселення в гуртожиток",
                        description: "Отримайте інформацію про поселення",
                        route: "/services/dormitory-settlement", // Узгоджено маршрут
                    },
                    {
                        id: "contract-creation",
                        name: "Створення контракту на поселення",
                        description: "Створіть контракт для поселення",
                        route: "/services/contract-creation", // Узгоджено маршрут
                    },
                ];
                setServices(staticServices);
            } catch (error) {
                console.error("Помилка отримання послуг:", error);
                setError("Не вдалося завантажити послуги. Спробуйте пізніше.");
                if (error.response?.status === 401) {
                    localStorage.removeItem("accessToken");
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [navigate]);

    const handleServiceClick = (route) => {
        navigate(route);
    };

    return (
        <div className={styles.servicesLayout}>
            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={setIsSidebarExpanded}
            />
            <div
                className={`${styles.mainContent} ${
                    !isSidebarExpanded ? styles.sidebarCollapsed : ""
                }`}
            >
                <Navbar
                    isSidebarExpanded={isSidebarExpanded}
                    onMenuToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
                />
                <div className={styles.servicesContainer}>
                    <h1 className={styles.title}>Поселення в гуртожиток</h1>
                    {loading ? (
                        <p>Завантаження...</p>
                    ) : error ? (
                        <p className={styles.error}>{error}</p>
                    ) : (
                        <div className={styles.serviceGrid}>
                            {services.map((service, index) => (
                                <ServiceItem
                                    key={service.id}
                                    service={service}
                                    index={index + 1}
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