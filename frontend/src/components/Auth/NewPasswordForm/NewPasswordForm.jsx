// frontend/src/components/Auth/NewPasswordForm/NewPasswordForm.jsx
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { useSearchParams, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { ToastService } from "../../../utils/toastConfig.js";
import api from "../../../utils/api";
import styles from "./NewPasswordForm.module.css";
import zxcvbn from "zxcvbn";

const API_BASE_URL = "http://localhost:5000";

const NewPasswordForm = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const validationSchema = Yup.object({
        password: Yup.string()
            .required("Обов'язкове поле")
            .test("password-strength", "Надто слабкий пароль", (value) => {
                if (!value) return false;
                const result = zxcvbn(value);
                return result.score >= 2;
            }),
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

            // Виконуємо перевірку за схемою Yup
            await validationSchema.validate(values, { abortEarly: false });

            // Додаткова валідація пароля
            if (!validatePassword(values.password)) return;

            const response = await api.post(
                `/auth/reset-password?token=${token}`,
                submitData
            );

            if (response.data.success) {
                ToastService.resetPasswordSuccess();
                setTimeout(() => navigate("/login"), 3000);
            }
        } catch (error) {
            console.error("Password reset error:", error);

            if (error.inner) {
                const touchedFields = error.inner.reduce((acc, curr) => {
                    acc[curr.path] = true;
                    return acc;
                }, {});
                setTouched(touchedFields);
                const errorMessages = error.inner.map((e) => e.message);
                ToastService.validationError(errorMessages);
            } else if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data?.error;
                switch (status) {
                    case 400:
                        ToastService.validationError(
                            errorData?.message || "Невірні дані"
                        );
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
            password: "",
            confirmPassword: "",
        },
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
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
                <label htmlFor="password" className={styles.inputLabel}>
                    Новий пароль
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
                    placeholder="8+ символів, 1 велика літера, лише англійські"
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
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <div className={styles.error}>{formik.errors.confirmPassword}</div>
                )}
            </div>

            <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading || formik.isSubmitting}
            >
                {isLoading ? (
                    <div className={styles.spinner}></div>
                ) : (
                    "ПРОДОВЖИТИ"
                )}
            </button>

            <div className={styles.loginRedirect}>
                <button
                    type="button"
                    className={styles.loginLink}
                    onClick={() => navigate("/login")}
                >
                    Увійти в акаунт
                </button>
            </div>
        </form>
    );
};

export default NewPasswordForm;