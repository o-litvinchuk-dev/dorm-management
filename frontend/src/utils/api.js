import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.debug("[API Request]", config.method.toUpperCase(), config.url, config.params, config.data);
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
    console.error("[API Response Error]", error.response?.status, error.response?.data, originalRequest);

    if (error.response?.status === 429) {
      toast.error("Забагато запитів. Спробуйте через 15 хвилин");
      return Promise.reject(error);
    }

    if (error.response?.status === 500) {
      toast.error("Внутрішня помилка сервера. Спробуйте пізніше");
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
          throw new Error("Відсутній токен оновлення");
        }

        const { data } = await api.public.post(
          "/auth/refresh-token",
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        localStorage.setItem("accessToken", data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("[API Refresh Token Error]", refreshError);
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

api.public = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  timeout: 10000,
});

export default api;