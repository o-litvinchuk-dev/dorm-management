import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import styles from "./styles/ContractApplicationPage.module.css";

const ContractApplicationPage = () => {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Тут можна додати логіку для створення контракту
        console.log("Контракт створено");
        navigate("/services");
    };

    return (
        <div className={styles.layout}>
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
                <div className={styles.container}>
                    <h1>Створення контракту на поселення</h1>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <p>Тут буде форма для створення контракту</p>
                        <button type="submit">Створити контракт</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContractApplicationPage;