// src/utils/api.js
import axios from "axios";
import { toast } from "sonner";
import { ToastService } from "./toastConfig";

// ВИЗНАЧТЕ ВАШ БАЗОВИЙ URL ПРАВИЛЬНО. ВІН ПОВИНЕН БУТИ http://localhost:5000/api/v1
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    const sessionId = localStorage.getItem("sessionId");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId;
    }

    // *** КЛЮЧОВЕ ВИПРАВЛЕННЯ: Уникаємо подвоєння /api/v1 ***
    if (config.url.startsWith('/api/v1/')) {
      console.warn(`[API Interceptor] Видалення дублікату '/api/v1' з URL: ${config.url}`);
      config.url = config.url.substring('/api/v1'.length);
    }
    
    console.debug(
      "[API Request]",
      config.method.toUpperCase(),
      `${config.baseURL}${config.url}`, // Correct logging of full URL
      config.params,
      config.data
    );
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Інша частина файлу залишається без змін...
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // ... (вся логіка обробки помилок залишається тут)
        const originalRequest = error.config;
        console.error(
            "[API Response Error]",
            error.response?.status,
            error.response?.data,
            originalRequest?.url
        );
        const statusCode = error.response?.status;
        const errorCode = error.response?.data?.code;
        const errorMessage = error.response?.data?.error || error.message || "Невідома помилка";

        if (statusCode === 429) {
            ToastService.tooManyRequests();
            return Promise.reject(error);
        }

        if (statusCode === 500) {
            ToastService.serverError(statusCode, errorMessage);
            return Promise.reject(error);
        }

        if (statusCode === 409 && errorCode === "ROLE_CONFLICT") {
            ToastService.conflictError(errorMessage);
            return Promise.reject(error);
        }

        if ((statusCode === 401 || statusCode === 403) && !originalRequest._retry) {
            if (originalRequest._noAuth) {
                return Promise.reject(error);
            }
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) {
                    console.warn("[API] No refresh token available, session may have ended");
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("sessionId");
                    localStorage.removeItem("user");
                    ToastService.sessionExpired();
                    if (window.location.pathname !== '/login') {
                        window.location.href = "/login?session_expired=1";
                    }
                    return Promise.reject(error);
                }

                const publicApiForRefresh = axios.create({ baseURL: API_BASE_URL.replace('/api/v1', '') });
                const { data } = await publicApiForRefresh.post(
                    "/api/v1/auth/refresh-token",
                    { refreshToken },
                    { headers: { "Content-Type": "application/json", "X-Session-Id": localStorage.getItem("sessionId") || "" } }
                );

                localStorage.setItem("accessToken", data.accessToken);
                if (data.refreshToken) {
                    localStorage.setItem("refreshToken", data.refreshToken);
                }

                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error("[API Refresh Token Error]", refreshError.response?.data || refreshError.message);
                const refreshStatusCode = refreshError.response?.status;
                const refreshErrorCode = refreshError.response?.data?.code;

                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("sessionId");
                localStorage.removeItem("user");

                if (refreshStatusCode === 401 || refreshStatusCode === 403) {
                    if (refreshErrorCode === "REFRESH_TOKEN_EXPIRED" || refreshErrorCode === "INVALID_REFRESH_TOKEN" || refreshErrorCode === "REFRESH_TOKEN_USED_OR_INVALID" || refreshErrorCode === "TOKEN_VERSION_MISMATCH") {
                        ToastService.sessionExpired("Ваша сесія завершилась. Будь ласка, увійдіть знову.");
                    } else {
                        ToastService.authFailed("Помилка авторизації. Будь ласка, увійдіть знову.");
                    }
                } else {
                    ToastService.error("Не вдалося оновити сесію. Спробуйте ще раз");
                }
                if (window.location.pathname !== '/login') {
                    window.location.href = "/login?session_expired=1";
                }
                return Promise.reject(refreshError);
            }
        }

        if (!originalRequest._noAuth && statusCode !== 401 && statusCode !== 403) {
            ToastService.error("Помилка API", errorMessage);
        }

        return Promise.reject(error);
    }
);


api.public = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export default api;