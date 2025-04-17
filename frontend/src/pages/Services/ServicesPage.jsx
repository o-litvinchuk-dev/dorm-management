import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import styles from "./styles/ServicesPage.module.css";

const ServiceItem = ({ service, onClick }) => {
    return (
        <div className={styles.serviceItem} onClick={onClick}>
            <h2 className={styles.serviceTitle}>{service.name}</h2>
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
                const { data } = await api.get("/services");
                setServices(data);
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
                    <h1 className={styles.title}>Послуги</h1>
                    {loading ? (
                        <p>Завантаження...</p>
                    ) : error ? (
                        <p className={styles.error}>{error}</p>
                    ) : (
                        <div className={styles.serviceGrid}>
                            {services.map((service) => (
                                <ServiceItem
                                    key={service.id}
                                    service={service}
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