import React from "react";
import authStyles from "../../components/Auth/AuthTabs/AuthLayout.module.css";
import ResetPasswordForm from "../../components/Auth/ResetPasswordForm/ResetPasswordForm";
import styles from "../../components/Auth/LoginForm/LoginForm.module.css";
import logoImg from "../../images/logo.svg";

const ResetPasswordPage = () => {
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

                    <h2 className={authStyles.title}>Скинути пароль</h2>
                    <p className={authStyles.subtitle}>
                        Введіть свою електронну адресу, щоб скинути пароль.
                    </p>

                    <ResetPasswordForm />
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

export default ResetPasswordPage;
