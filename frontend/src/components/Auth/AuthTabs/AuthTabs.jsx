import React from "react";
import styles from "./AuthLayout.module.css";

const AuthTabs = ({ activeTab, onTabChange }) => {
    return (
        <div className={styles.tabContainer}>
            <div className={styles.tabBackground}>
                <button
                    className={
                        activeTab === "login"
                            ? styles.activeTab
                            : styles.inactiveTab
                    }
                    onClick={() => onTabChange("login")}
                >
                    Авторизація
                </button>
                <button
                    className={
                        activeTab === "register"
                            ? styles.activeTab
                            : styles.inactiveTab
                    }
                    onClick={() => onTabChange("register")}
                >
                    Реєстрація
                </button>
            </div>
        </div>
    );
};

export default AuthTabs;
