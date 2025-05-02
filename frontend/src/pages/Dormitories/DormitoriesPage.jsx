import React, { useState, useEffect } from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import api from "../../utils/api";
import styles from "./styles/DormitoriesPage.module.css";

const DormitoriesPage = () => {
  const [dormitories, setDormitories] = useState([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  useEffect(() => {
    const fetchDormitories = async () => {
      try {
        const response = await api.get("/dormitories");
        setDormitories(response.data);
      } catch (error) {
        console.error("Помилка отримання гуртожитків:", error);
      }
    };
    fetchDormitories();
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
          <h2>Гуртожитки</h2>
          {dormitories.length > 0 ? (
            <ul>
              {dormitories.map((dorm) => (
                <li key={dorm.id}>
                  {dorm.name} - {dorm.address}
                </li>
              ))}
            </ul>
          ) : (
            <p>Гуртожитки відсутні</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DormitoriesPage;