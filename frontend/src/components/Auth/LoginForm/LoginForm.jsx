// frontend/src/components/Auth/LoginForm/LoginForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import { ToastService } from "../../../utils/toastConfig.js";
import styles from "./LoginForm.module.css";
import { useUser } from "../../../contexts/UserContext";

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);
    const navigate = useNavigate();
    const { refreshUser } = useUser(); // Змінено з forceRefresh на refreshUser

    const validatePassword = (password) => {
        const isLengthValid = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        return isLengthValid && hasUpperCase && hasNumber;
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value.trim();
        const password = e.target.password.value.trim();

        if (!email || !password) {
            ToastService.validationError("Заповніть обов'язкові поля");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            ToastService.validationError("Невірний формат електронної пошти");
            return;
        }

        if (!validatePassword(password)) {
            ToastService.passwordRequirements();
            return;
        }

        try {
            const response = await api.post(
                "/auth/login",
                { email, password },
                { _noAuth: true }
            );
            localStorage.setItem("accessToken", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);
            
            await refreshUser(); // Змінено з forceRefresh на refreshUser, додано await
            ToastService.success("Вітаємо!", "Ви успішно авторизувалися в системі");
            navigate("/dashboard");
        } catch (error) {
            if (error.response?.data?.code === "INVALID_PASSWORD") {
                ToastService.invalidPassword();
            } else if (error.response?.data?.code === "USER_NOT_FOUND") {
                ToastService.invalidEmail();
            } else if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
                ToastService.accountNotVerified();
            } else if (!error.response) {
                ToastService.networkError();
            } else {
                ToastService.handleApiError(error);
            }
        }
    };

    const handleGoogleSignIn = useCallback(async (response) => {
        if (!response.credential) {
            ToastService.googleError("Не вдалося отримати дані з Google");
            return;
        }

        try {
            const res = await api.post("/auth/google-signin", {
                token: response.credential,
            });

            localStorage.setItem("accessToken", res.data.accessToken);
            localStorage.setItem("refreshToken", res.data.refreshToken);
            
            await refreshUser(); // Змінено з forceRefresh на refreshUser, додано await
            navigate("/dashboard");
            ToastService.success("Вітаємо!", "Ви успішно увійшли через Google");
        } catch (error) {
            console.error("Помилка Google Sign-In:", error);

            if (error.response?.data?.code === "ACCOUNT_CONFLICT") {
                ToastService.existingLocalAccount();
            } else if (error.response?.status === 500) {
                ToastService.serverError(
                    error.response.status,
                    "Технічна помилка сервера. Спробуйте пізніше"
                );
            } else {
                const errorMessage =
                    error.response?.data?.error ||
                    "Невідома помилка входу через Google";
                ToastService.googleError(errorMessage);
            }
        }
    }, [navigate, refreshUser]); // Оновлено залежність

    const initGoogleSignIn = useCallback(() => {
        try {
            if (!window.google?.accounts) {
                console.error("Google API не ініціалізовано");
                throw new Error("GOOGLE_API_NOT_LOADED");
            }

            const container = document.getElementById("google-signin-container") 
                || document.createElement("div");
            
            if (!document.getElementById("google-signin-container")) {
                container.id = "google-signin-container";
                container.style.cssText = "position: absolute; left: -9999px; width: 0; height: 0; overflow: hidden;";
                document.body.appendChild(container);
            }

            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleSignIn,
                ux_mode: "popup",
                login_uri: window.location.origin + "/login",
                auto_select: false
            });

            try {
                window.google.accounts.id.renderButton(container, {
                    type: "icon",
                    theme: "outline",
                    size: "large",
                    shape: "circle",
                    logo_alignment: "center",
                    locale: "uk_UA"
                });
            } catch (renderError) {
                console.error("Помилка рендеру кнопки Google:", renderError);
                throw new Error("GOOGLE_BUTTON_RENDER_ERROR");
            }

            setIsGoogleInitialized(true);

        } catch (error) {
            console.error("Помилка ініціалізації Google Sign-In:", error);
            ToastService.error(
                "Помилка Google Sign-In",
                "Будь ласка, оновіть сторінку або спробуйте інший метод входу"
            );
        }
    }, [handleGoogleSignIn]);

    useEffect(() => {
        if (window.google?.accounts) {
            initGoogleSignIn();
        } else {
            const checkGoogle = setInterval(() => {
                if (window.google?.accounts) {
                    initGoogleSignIn();
                    clearInterval(checkGoogle);
                }
            }, 100);

            return () => clearInterval(checkGoogle);
        }

        return () => {
            const container = document.getElementById("google-signin-container");
            if (container) container.remove();
        };
    }, [initGoogleSignIn]);

    const triggerGoogleSignIn = () => {
        if (!isGoogleInitialized) {
            ToastService.error(
                "Сервіс недоступний",
                "Google Sign-In ще не ініціалізовано"
            );
            return;
        }

        try {
            const container = document.getElementById("google-signin-container");
            const googleButton = container?.querySelector("div[role=button]");
            
            if (googleButton) {
                googleButton.click();
            } else {
                throw new Error("Google button element not found");
            }
        } catch (error) {
            console.error("Помилка запуску Google Sign-In:", error);
            ToastService.error(
                "Помилка входу",
                "Не вдалося ініціювати процес входу через Google"
            );
        }
    };

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Пошта</label>
                <input
                    type="email"
                    name="email"
                    className={styles.inputField}
                    placeholder="name@gmail.com"
                    autoComplete="email"
                />
            </div>

            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Пароль</label>
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={styles.inputField}
                    placeholder="••••••••"
                    autoComplete="current-password"
                />
                <span
                    className={styles.passwordToggle}
                    onClick={togglePasswordVisibility}
                    role="button"
                    aria-label={
                        showPassword ? "Сховати пароль" : "Показати пароль"
                    }
                    tabIndex={0}
                >
                    {showPassword ? (
                        <svg
                            aria-hidden="true"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 9a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3m0-4.5c5 0 9.27 3.11 11 7.5-1.73 4.39-6 7.5-11 7.5S2.73 16.39 1 12c1.73-4.39 6-7.5 11-7.5M3.18 12a9.821 9.821 0 0 0 17.64 0 9.821 9.821 0 0 0-17.64 0z" />
                        </svg>
                    ) : (
                        <svg
                            aria-hidden="true"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        >
                            <path d="M11.83 9L15 12.16V12a3 3 0 0 0-3-3h-.17m-4.3.8l1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22 21 20.73 3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7z" />
                        </svg>
                    )}
                </span>
            </div>
            <button
                type="button"
                className={styles.forgotPassword}
                onClick={() => navigate("/reset-password")}
            >
                Забули пароль?
            </button>
            <button type="submit" className={styles.loginButton}>
                Увійти
            </button>
            <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span className={styles.textLine}>Або</span>
                <div className={styles.dividerLine} />
            </div>
            <button
                type="button"
                className={styles.googleButton}
                onClick={triggerGoogleSignIn}
                aria-label="Увійти за допомогою Google"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={styles.googleIcon}
                    aria-hidden="true"
                >
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Увійдіть за допомогою Google
            </button>
            <div className={styles.registerPrompt}>
                <span className={styles.textLink}>Не зареєстрований?</span>{" "}
                <button
                    type="button"
                    className={styles.registerLink}
                    onClick={() => navigate("/register")}
                >
                    Створити обліковий запис
                </button>
            </div>
        </form>
    );
};

export default LoginForm;