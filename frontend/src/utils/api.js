// frontend/src/utils/api.js
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`, // /api/v1 додається тут
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Важливо: config.url тепер має бути відносним, наприклад, 'faculties' або 'groups/1'
    console.debug(
      "[API Request]",
      config.method.toUpperCase(),
      config.baseURL + (config.url.startsWith('/') ? config.url : '/' + config.url), // Повний URL для логування
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.error(
      "[API Response Error]",
      error.response?.status,
      error.response?.data,
      originalRequest?.url // Логуємо відносний URL оригінального запиту
    );

    if (error.response?.status === 429) {
      toast.error("Забагато запитів. Спробуйте через 15 хвилин");
      return Promise.reject(error);
    }
    if (error.response?.status === 500) {
      toast.error("Внутрішня помилка сервера. Спробуйте пізніше");
      return Promise.reject(error);
    }
    if (error.response?.status === 409 && error.response?.data?.code === "ROLE_CONFLICT") {
      toast.error("Цей користувач уже має роль і не може бути призначений повторно");
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
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
          localStorage.removeItem("user");
          toast.error("Сесія закінчилась. Будь ласка, увійдіть знову");
          window.location.href = "/login?session_expired=1";
          return Promise.reject(error);
        }

        // Використовуємо окремий інстанс axios для refresh-token
        const publicApiForRefresh = axios.create({ baseURL: `${API_BASE_URL}/api/v1` });
        const { data } = await publicApiForRefresh.post(
          "/auth/refresh-token", // Шлях відносний
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest); // Повторюємо оригінальний запит з новим токеном
      } catch (refreshError) {
        console.error("[API Refresh Token Error]", refreshError.response?.data || refreshError.message);
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          toast.error("Сесія закінчилась. Будь ласка, увійдіть знову");
          if (window.location.pathname !== '/login') { // Запобігаємо циклічному редиректу
            window.location.href = "/login?session_expired=1";
          }
        } else {
          toast.error("Не вдалося оновити сесію. Спробуйте ще раз");
        }
        return Promise.reject(refreshError);
      }
    }
    
    const errorMessage = error.response?.data?.error || error.message || "Невідома помилка";
    // Показуємо помилку, тільки якщо це не 401 (бо 401 обробляється рефрешем або редиректом)
    // і якщо запит не був _noAuth (для публічних запитів, де помилки обробляються окремо)
    if (!originalRequest._noAuth && error.response?.status !== 401) {
      toast.error("Помилка API", errorMessage);
    }
    return Promise.reject(error);
  }
);

// api.public для запитів, що не потребують автентифікації
api.public = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`, // /api/v1 додається тут
  timeout: 10000,
});

export default api;