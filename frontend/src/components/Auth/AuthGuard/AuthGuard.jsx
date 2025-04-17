import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../../../utils/api";

const AuthGuard = () => {
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const refreshAccessToken = async () => {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) return;

            try {
                const response = await api.post("/auth/refresh-token", {
                    refreshToken,
                });

                if (response.data.accessToken) {
                    localStorage.setItem(
                        "accessToken",
                        response.data.accessToken
                    );
                }
            } catch (error) {
                console.error("Помилка оновлення токена:", error);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
            }
        };

        refreshAccessToken();
    }, []);

    if (isLoading) {
        return <div>Перевірка сесії...</div>;
    }

    return isValid ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AuthGuard;
