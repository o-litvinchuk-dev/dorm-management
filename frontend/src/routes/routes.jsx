import { Navigate } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage";
import RegistrationPage from "../pages/Auth/RegistrationPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import NewPasswordPage from "../pages/Auth/NewPasswordPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ServicesPage from "../pages/Services/ServicesPage";
import ContractApplicationPage from "../pages/Services/ContractApplicationPage/ContractApplicationPage";
import SettlementApplicationPage from "../pages/Services/Settlement agreement/SettlementApplicationPage";
import AccommodationApplicationPage from "../pages/Services/AccommodationApplicationPage/AccommodationApplicationPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import SettingsPage from "../pages/Settings/SettingsPage";
import ErrorPage from "../pages/Shared/ErrorPage";
import AdminApplicationsPage from "../pages/AdminApplications/AdminApplicationsPage";
import ApplicationsPage from "../pages/Applications/ApplicationsPage";
import DormitoriesPage from "../pages/Dormitories/DormitoriesPage";
import SettlementPage from "../pages/Settlement/SettlementPage";
import api from "../utils/api";
import { useEffect, useState } from "react";
import AdminAccommodationManagementPage from "../pages/AdminApplications/AdminAccommodationManagementPage";
import AdminProtectedRoute from "../components/AdminProtectedRoute";

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

const routes = [
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/new-password", element: <NewPasswordPage /> },
  { path: "/register", element: <RegistrationPage /> },
  { path: "/dashboard", element: <ProtectedRoute element={<DashboardPage />} /> },
  { path: "/services", element: <ProtectedRoute element={<ServicesPage />} /> },
  { path: "/services/accommodation-application", element: <ProtectedRoute element={<AccommodationApplicationPage />} /> },
  { path: "/services/dormitory-settlement", element: <ProtectedRoute element={<SettlementApplicationPage />} /> },
  { path: "/services/contract-creation", element: <ProtectedRoute element={<ContractApplicationPage />} /> },
  { path: "/settings", element: <ProtectedRoute element={<SettingsPage />} /> },
  { path: "/profile", element: <ProtectedRoute element={<ProfilePage />} /> },
  { path: "/applications", element: <ProtectedRoute element={<ApplicationsPage />} /> },
  { path: "/dormitories", element: <ProtectedRoute element={<DormitoriesPage />} /> },
  { path: "/settlement", element: <ProtectedRoute element={<SettlementPage />} /> },
  { path: "/adminApplications", element: <AdminProtectedRoute element={<AdminApplicationsPage />} /> },
  { path: "/admin/accommodation-applications", element: <AdminProtectedRoute element={<AdminAccommodationManagementPage />} /> },
  { path: "/admin/applications/accommodation", element: <AdminProtectedRoute element={<AdminAccommodationManagementPage />} /> }, // Новий маршрут
  { path: "*", element: <ErrorPage /> },
];

export default routes;