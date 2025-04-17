import api from "./api";

export const refreshAccessToken = async () => {
    try {
        const response = await api.post("/auth/refresh-token");
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
