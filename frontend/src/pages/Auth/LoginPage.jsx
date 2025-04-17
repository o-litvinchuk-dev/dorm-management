import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthTabs from "../../components/Auth/AuthTabs/AuthTabs";
import LoginForm from "../../components/Auth/LoginForm/LoginForm";
import authStyles from "../../components/Auth/AuthTabs/AuthLayout.module.css";
import logoImg from "../../images/logo.svg";
import styles from "../../components/Auth/LoginForm/LoginForm.module.css";
import { ToastService } from "../../utils/toastConfig";

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const activeTab = "login";
    const toastShownRef = useRef(false); // Використовуємо ref замість стану

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const verifiedStatus = searchParams.get("verified");
        const registered = searchParams.get("registered");

        const cleanUrl = () => navigate(location.pathname, { replace: true });

        if (location.state?.fromResetPassword && !toastShownRef.current) {
            ToastService.success(
                "Лист з інструкціями відправлено",
                "Перевірте вхідні та папку «Спам»"
            );
            toastShownRef.current = true;
            navigate(location.pathname, { replace: true, state: {} });
        } else if (registered === "success" && !toastShownRef.current) {
            ToastService.success(
                "Лист з підтвердженням надіслано",
                "Інструкції для підтвердження відправлено на вашу пошту. Перевірте вхідні та папку «Спам»."
            );
            toastShownRef.current = true;
            cleanUrl();
        } else if (verifiedStatus === "success" && !toastShownRef.current) {
            ToastService.success(
                "Електронну адресу підтверджено!",
                "Тепер ви можете увійти"
            );
            toastShownRef.current = true;
            cleanUrl();
        } else if (verifiedStatus === "error" && !toastShownRef.current) {
            const errorMessage = searchParams.get("message")
                ? decodeURIComponent(searchParams.get("message"))
                : "Сталася невідома помилка підтвердження";
            ToastService.error("Помилка підтвердження", errorMessage);
            toastShownRef.current = true;
            cleanUrl();
        }
    }, [location, navigate]); // toastShownRef не входить у залежності

    const handleTabChange = (tab) => {
        if (tab !== activeTab) navigate("/register");
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

                    <h2 className={authStyles.title}>Авторизація</h2>
                    <p className={authStyles.subtitle}>
                        Введіть свою електронну адресу та пароль для входу.
                    </p>

                    <LoginForm />
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

export default LoginPage;