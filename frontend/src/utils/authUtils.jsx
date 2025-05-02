import api from "./api";

export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("Відсутній токен оновлення");
    }
    const response = await api.public.post("/auth/refresh-token", { refreshToken });
    localStorage.setItem("accessToken", response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    console.error("Помилка оновлення токену:", error);
    logout();
  }
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
};