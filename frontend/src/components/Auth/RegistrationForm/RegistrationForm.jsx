// frontend/src/components/Auth/RegistrationForm/RegistrationForm.jsx
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as Yup from "yup";
import { ToastService } from "../../../utils/toastConfig.js";
import styles from "./RegistrationForm.module.css";
import zxcvbn from "zxcvbn";

const API_BASE_URL = "http://localhost:5000";

const RegistrationForm = () => {
    const navigate = useNavigate();
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const validationSchema = Yup.object({
        email: Yup.string()
            .email("Невірний формат email")
            .required("Обов'язкове поле"),
        password: Yup.string()
            .required("Обов'язкове поле")
            .test("password-strength", "Помилка пароля", () => true),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref("password"), null], "Паролі повинні співпадати")
            .required("Обов'язкове поле"),
    });

    const validatePassword = (password) => {
        if (!password) return false;

        const errors = [];
        if (password.length < 8) errors.push("мінімум 8 символів");
        if (!/[A-Z]/.test(password)) errors.push("велику літеру");
        if (!/[0-9]/.test(password)) errors.push("цифру");
        const result = zxcvbn(password);
        if (result.score < 2) errors.push("надто слабкий пароль");

        if (errors.length > 0) {
            ToastService.passwordValidationError(errors);
            return false;
        }
        return true;
    };

    const handleSubmit = async (values, { setSubmitting, setTouched }) => {
        setIsLoading(true);
        try {
            const { confirmPassword, ...submitData } = values;

            // Перевірка обов'язкових полів через Yup
            await validationSchema.validate(values, { abortEarly: false });

            // Додаткова валідація пароля
            if (!validatePassword(values.password)) return;

            await axios.post(
                `${API_BASE_URL}/api/v1/auth/register`,
                submitData
            );

            navigate("/login?registered=success");
        } catch (error) {
            console.error("Registration error:", error);

            if (error.inner) {
                const touchedFields = error.inner.reduce((acc, curr) => {
                    acc[curr.path] = true;
                    return acc;
                }, {});
                setTouched(touchedFields);

                const errorMessages = error.inner.map((e) => e.message);
                ToastService.validationError(errorMessages);
            }

            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data?.error;

                switch (status) {
                    case 400:
                        ToastService.validationError(
                            errorData?.message || "Невірні дані"
                        );
                        break;
                    case 409:
                        ToastService.emailConflict();
                        break;
                    case 429:
                        ToastService.tooManyRequests();
                        break;
                    case 500:
                        ToastService.serverConfigurationError();
                        break;
                    default:
                        ToastService.handleApiError(error);
                }
            } else if (error.request) {
                ToastService.networkError();
            } else {
                ToastService.error(
                    "Помилка запиту",
                    error.message || "Невідома помилка"
                );
            }
        } finally {
            setIsLoading(false);
            setSubmitting(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true, // Увімкнути валідацію при зміні
        validateOnBlur: true, // Увімкнути валідацію при блурі
    });

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (formik.values.password) {
                const result = zxcvbn(formik.values.password);
                setPasswordStrength(result.score);
            } else {
                setPasswordStrength(0);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formik.values.password]);

    const getPasswordStrengthColor = () => {
        const colors = [
            styles.veryWeak,
            styles.weak,
            styles.medium,
            styles.strong,
            styles.veryStrong,
        ];
        return colors[passwordStrength] || "";
    };

    return (
        <form className={styles.formContainer} onSubmit={formik.handleSubmit}>
            <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.inputLabel}>
                    Пошта
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    className={`${styles.inputField} ${
                        formik.touched.email && formik.errors.email
                            ? styles.errorInput
                            : ""
                    }`}
                    placeholder="name@gmail.com"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                />
                {formik.touched.email && formik.errors.email && (
                    <div className={styles.error}>{formik.errors.email}</div>
                )}
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.inputLabel}>
                    Пароль
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    className={`${styles.inputField} ${
                        formik.touched.password && formik.errors.password
                            ? styles.errorInput
                            : ""
                    }`}
                    placeholder="Тільки англійські літери, цифри та !@#$%^&*"
                    onChange={(e) => {
                        const filteredValue = e.target.value.replace(
                            /[^A-Za-z0-9!@#$%^&*]/g,
                            ""
                        );
                        formik.setFieldValue("password", filteredValue);
                    }}
                    value={formik.values.password}
                />
                <div className={styles.passwordStrengthWrapper}>
                    <div className={styles.passwordStrength}>
                        {[...Array(4)].map((_, index) => (
                            <div
                                key={index}
                                className={`${styles.strengthBar} ${
                                    index < passwordStrength
                                        ? getPasswordStrengthColor()
                                        : ""
                                }`}
                            />
                        ))}
                    </div>
                    {formik.values.password && (
                        <span
                            className={`${styles.strengthText} ${getPasswordStrengthColor()}`}
                        >
                            {[
                                "Дуже слабкий",
                                "Слабкий",
                                "Середній",
                                "Сильний",
                                "Дуже сильний",
                            ][passwordStrength] || ""}
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.inputLabel}>
                    Повторіть пароль
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`${styles.inputField} ${
                        formik.touched.confirmPassword &&
                        formik.errors.confirmPassword
                            ? styles.errorInput
                            : ""
                    }`}
                    placeholder="••••••••"
                    onChange={formik.handleChange}
                    value={formik.values.confirmPassword}
                />
                {formik.touched.confirmPassword &&
                    formik.errors.confirmPassword && (
                        <div className={styles.error}>
                            {formik.errors.confirmPassword}
                        </div>
                    )}
            </div>

            <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading || formik.isSubmitting} // Блокуємо кнопку
            >
                {isLoading ? (
                    <div className={styles.spinner}></div>
                ) : (
                    "Зареєструватися"
                )}
            </button>

            <div className={styles.registerPrompt}>
                <span className={styles.textLink}>У вас уже є акаунт?</span>{" "}
                <button
                    type="button"
                    className={styles.registerLink}
                    onClick={() => navigate("/login")}
                >
                    Увійти
                </button>
            </div>
        </form>
    );
};

export default RegistrationForm;