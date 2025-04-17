import { Navigate } from "react-router-dom";
// Імпорти з Auth
import LoginPage from "../pages/Auth/LoginPage";
import RegistrationPage from "../pages/Auth/RegistrationPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import NewPasswordPage from "../pages/Auth/NewPasswordPage";
// Імпорти з Dashboard
import DashboardPage from "../pages/Dashboard/DashboardPage";
// Імпорти з Services
import ServicesPage from "../pages/Services/ServicesPage";
import ContractApplicationPage from "../pages/Services/ContractApplicationPage";
import SettlementApplicationPage from "../pages/Services/SettlementApplicationPage";
// Імпорти з Profile
import ProfilePage from "../pages/Profile/ProfilePage";
// Імпорти з Settings
import SettingsPage from "../pages/Settings/SettingsPage";
// Імпорти з Shared
import ErrorPage from "../pages/Shared/ErrorPage";

const routes = [
    { path: "/", element: <Navigate to="/login" replace /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> },
    { path: "/new-password", element: <NewPasswordPage /> },
    { path: "/register", element: <RegistrationPage /> },
    { path: "/dashboard", element: <DashboardPage /> },
    { path: "/services", element: <ServicesPage /> },
    { path: "/services/settlement", element: <SettlementApplicationPage /> },
    { path: "/services/contract", element: <ContractApplicationPage /> },
    { path: "/audience", element: <DashboardPage /> }, // Тимчасово DashboardPage
    { path: "/posts", element: <DashboardPage /> }, // Тимчасово DashboardPage
    { path: "/schedules", element: <DashboardPage /> }, // Тимчасово DashboardPage
    { path: "/settings", element: <SettingsPage /> },
    { path: "/profile", element: <ProfilePage /> },
    { path: "/help", element: <DashboardPage /> }, // Тимчасово DashboardPage
    { path: "*", element: <ErrorPage /> },
];

export default routes;