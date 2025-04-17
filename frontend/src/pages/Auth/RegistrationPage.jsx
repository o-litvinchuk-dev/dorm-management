import React from "react";
import AuthTabs from "../../components/Auth/AuthTabs/AuthTabs.jsx";
import RegistrationForm from "../../components/Auth/RegistrationForm/RegistrationForm";
import authStyles from "../../components/Auth/AuthTabs/AuthLayout.module.css";
import logoImg from "../../images/logo.svg";
import styles from "../../components/Auth/LoginForm/LoginForm.module.css";
import { useNavigate } from "react-router-dom";

const RegistrationPage = () => {
    const navigate = useNavigate();
    const activeTab = "register";

    const handleTabChange = (tab) => {
        if (tab !== activeTab) {
            navigate("/login");
        }
    };

    return (
        <div className={authStyles.authContainer}>
            <div className={authStyles.authWrapper}>
                <div className={authStyles.authCard}>
                    <div className={authStyles.logo}>
                        <img
                            src={logoImg}
                            alt="DORMLIFE Logo"
                            className={authStyles.logoImage}
                        />
                        <h1 className={authStyles.logoText}>DORM LIFE</h1>
                    </div>

                    <AuthTabs
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                    />

                    <h2 className={authStyles.title}>Реєстрація</h2>
                    <p className={authStyles.subtitle}>
                        Введіть свою електронну адресу, пароль та підтвердіть
                        пароль для реєстрації.
                    </p>

                    <RegistrationForm />
                </div>

                <p className={authStyles.termsText}>
                    Підписавшись, ви погоджуєтеся дотримуватися наших
                    <br />
                    <button className={styles.registerLink}>
                        Умов надання послуг
                    </button>{" "}
                    та{" "}
                    <button className={styles.registerLink}>
                        Політики конфіденційності
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegistrationPage;
