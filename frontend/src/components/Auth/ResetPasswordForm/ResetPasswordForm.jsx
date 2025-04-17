import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import styles from "./ResetPasswordForm.module.css";
import { ToastService } from "../../../utils/toastConfig";

const ResetPasswordForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            await api.post("/auth/forgot-password", { email });

            navigate("/login", {
                state: { fromResetPassword: true },
                replace: true,
            });
        } catch (error) {
            if (
                error.response?.status === 403 &&
                error.response.data.code === "GOOGLE_ACCOUNT"
            ) {
                ToastService.existingEmailWithDifferentProvider("Google");
            } else if (error.response?.status === 429) {
                ToastService.tooManyRequests();
            } else {
                ToastService.handleApiError(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Пошта</label>
                <input
                    type="email"
                    name="email"
                    value={email}
                    className={styles.inputField}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    disabled={isSubmitting}
                    required
                    autoComplete="email"
                />
            </div>

            <button
                type="submit"
                className={styles.resetButton}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <div className={styles.spinner}></div>
                ) : (
                    "Скинути"
                )}
            </button>

            <div className={styles.loginRedirect}>
                <button
                    type="button"
                    className={styles.loginLink}
                    onClick={() => navigate("/login")}
                    disabled={isSubmitting}
                >
                    Увійти в акаунт
                </button>
            </div>
        </form>
    );
};

export default ResetPasswordForm;
