import React from "react";
import Navbar from "../../components/UI/Navbar/Navbar";
import Sidebar from "../../components/UI/Sidebar/Sidebar";
import styles from "./styles/HelpPage.module.css";

const HelpPage = () => {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.mainContent}>
                <Navbar />
                <div className={styles.content}>
                    <h1>Допомога</h1>
                    <p>Тут ви можете знайти корисну інформацію та підтримку.</p>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;