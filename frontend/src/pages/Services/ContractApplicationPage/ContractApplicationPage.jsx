import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../contexts/UserContext";
import api from "../../../utils/api";
import Navbar from "../../../components/UI/Navbar/Navbar";
import Sidebar from "../../../components/UI/Sidebar/Sidebar";
import styles from "./styles/ContractApplicationPage.module.css";

const ContractApplicationPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [message, setMessage] = useState(null); // State for message
  const navigate = useNavigate();
  const { user } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null); // Clear previous message
    try {
      console.log("Контракт створено");

      await api.post("/secure/notifications", {
        user_id: user.id,
        title: "Заявка подана",
        description: "Ваша заявка на поселення успішно подана.",
      });

      // Set success message
      setMessage({ type: "success", text: "Заявка на контракт успішно подана!" });

      // Navigate after a short delay to let the user see the message
      setTimeout(() => {
        navigate("/services");
      }, 2000);
    } catch (error) {
      console.error("Помилка при створенні сповіщення:", error);
      // Set error message
      setMessage({ type: "error", text: "Помилка при поданні заявки. Спробуйте ще раз." });
    }
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
          {message && (
            <div
              className={`${styles.message} ${
                message.type === "success" ? styles.success : styles.error
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractApplicationPage;