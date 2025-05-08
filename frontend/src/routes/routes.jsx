import { Navigate } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage";
import RegistrationPage from "../pages/Auth/RegistrationPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import NewPasswordPage from "../pages/Auth/NewPasswordPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ServicesPage from "../pages/Services/ServicesPage";
import ContractApplicationPage from "../pages/Services/ContractApplicationPage/ContractApplicationPage";
import SettlementApplicationPage from "../pages/Services/Settlement agreement/SettlementApplicationPage"; // Виправлено шлях імпорту
import AccommodationApplicationPage from "../pages/Services/AccommodationApplicationPage/AccommodationApplicationPage"; // Виправлено шлях імпорту
import ProfilePage from "../pages/Profile/ProfilePage";
import SettingsPage from "../pages/Settings/SettingsPage";
import ErrorPage from "../pages/Shared/ErrorPage";
import AdminApplicationsPage from "../pages/AdminApplications/AdminApplicationsPage";
import ApplicationsPage from "../pages/Applications/ApplicationsPage";
import DormitoriesPage from "../pages/Dormitories/DormitoriesPage";
import SettlementPage from "../pages/Settlement/SettlementPage";
import api from "../utils/api";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ element }) => {
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        await api.get("/auth/validate-token");
        setIsValid(true);
      } catch (error) {
        setIsValid(false);
      }
    };

    validateToken();
  }, []);

  if (isValid === null) {
    return <div>Перевірка автентифікації...</div>;
  }

  return isValid ? element : <Navigate to="/login" replace />;
};

const AdminProtectedRoute = ({ element }) => {
  const [isValid, setIsValid] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = ["admin", "superadmin", "dorm_admin"].includes(user.role);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        await api.get("/auth/validate-token");
        setIsValid(true);
      } catch (error) {
        setIsValid(false);
      }
    };

    validateToken();
  }, []);

  if (isValid === null) {
    return <div>Перевірка автентифікації...</div>;
  }

  return isValid && isAdmin ? element : <Navigate to="/dashboard" replace />;
};

const routes = [
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/new-password", element: <NewPasswordPage /> },
  { path: "/register", element: <RegistrationPage /> },
  { path: "/dashboard", element: <ProtectedRoute element={<DashboardPage />} /> },
  { path: "/services", element: <ProtectedRoute element={<ServicesPage />} /> },
  { path: "/services/accommodation-application", element: <ProtectedRoute element={<AccommodationApplicationPage />} /> }, // Узгоджено маршрут
  { path: "/services/dormitory-settlement", element: <ProtectedRoute element={<SettlementApplicationPage />} /> }, // Узгоджено маршрут
  { path: "/services/contract-creation", element: <ProtectedRoute element={<ContractApplicationPage />} /> }, // Узгоджено маршрут
  { path: "/settings", element: <ProtectedRoute element={<SettingsPage />} /> },
  { path: "/profile", element: <ProtectedRoute element={<ProfilePage />} /> },
  { path: "/applications", element: <ProtectedRoute element={<ApplicationsPage />} /> },
  { path: "/dormitories", element: <ProtectedRoute element={<DormitoriesPage />} /> },
  { path: "/settlement", element: <ProtectedRoute element={<SettlementPage />} /> },
  { path: "/adminApplications", element: <AdminProtectedRoute element={<AdminApplicationsPage />} /> },
  { path: "*", element: <ErrorPage /> },
];

export default routes;