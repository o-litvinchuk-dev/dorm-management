import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
    baseURL: "http://localhost:5000/api/v1",
    withCredentials: true,
    timeout: 10000,
});

// Request interceptor: додаємо токен до заголовків
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor для обробки помилок
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 429) {
            toast.error("Забагато запитів. Спробуйте через 15 хвилин");
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Якщо прапорець _noAuth встановлено, просто відхиляємо запит
            if (originalRequest._noAuth) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) throw new Error("Відсутній токен оновлення");

                const { data } = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh-token`,
                    { refreshToken },
                    { _noAuth: true }
                );

                localStorage.setItem("accessToken", data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                toast.error("Сесія закінчилась. Будь ласка, увійдіть знову");
                window.location.href = "/login?session_expired=1";
                return Promise.reject(refreshError);
            }
        }

        const errorMessage = error.response?.data?.error || error.message || "Невідома помилка";
        if (!originalRequest._noAuth) {
            toast.error(errorMessage);
        }
        return Promise.reject(error);
    }
);

// Додатковий екземпляр для публічних запитів (без токенів)
api.public = axios.create({
    baseURL: "http://localhost:5000/api/v1",
    timeout: 10000,
});

export default api;
