// frontend/src/pages/Settlement/SettlementPage.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import styles from "./styles/SettlementPage.module.css";
import { ToastService } from "../../utils/toastConfig";

const SettlementPage = () => {
  const [settlements, setSettlements] = useState([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const response = await api.get("/settlement");
        setSettlements(response.data || []);
      } catch (error) {
        console.error("Помилка отримання розкладу поселення:", error);
        ToastService.error("Не вдалося завантажити розклад поселення");
      }
    };
    fetchSettlements();
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar isExpanded={isSidebarExpanded} onToggle={setIsSidebarExpanded} />
      <div className={`${styles.mainContent} ${!isSidebarExpanded ? styles.sidebarCollapsed : ""}`}>
        <Navbar
          isSidebarExpanded={isSidebarExpanded}
          onMenuToggle={() => setIsSidebarExpanded((prev) => !prev)}
        />
        <div className={styles.container}>
          <h2>Розклад поселення</h2>
          {settlements.length > 0 ? (
            <ul>
              {settlements.map((settlement) => (
                <li key={settlement.id}>
                  {settlement.date || "Дата не вказана"} - {settlement.description || "Опис відсутній"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Розклад поселення відсутній</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettlementPage;