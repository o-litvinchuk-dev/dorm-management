// frontend/src/pages/Applications/ApplicationsPage.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import styles from "./styles/ApplicationsPage.module.css";
import { ToastService } from "../../utils/toastConfig";

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get("/applications");
        setApplications(response.data || []);
      } catch (error) {
        console.error("Помилка отримання заявок:", error);
        ToastService.error("Не вдалося завантажити заявки");
      }
    };
    fetchApplications();
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
          <h2>Мої заявки</h2>
          {applications.length > 0 ? (
            <ul>
              {applications.map((app) => (
                <li key={app.id}>
                  {app.name || "Заявка"} - {app.status || "Невідомий статус"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Заявки відсутні</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;