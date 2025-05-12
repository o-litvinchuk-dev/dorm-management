import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import LoginPage from "../pages/Auth/LoginPage";
import RegistrationPage from "../pages/Auth/RegistrationPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import NewPasswordPage from "../pages/Auth/NewPasswordPage";
import CompleteProfilePage from "../pages/Auth/CompleteProfilePage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ServicesPage from "../pages/Services/ServicesPage";
import ContractApplicationPage from "../pages/Services/ContractApplicationPage/ContractApplicationPage";
import SettlementApplicationPage from "../pages/Services/Settlement agreement/SettlementApplicationPage";
import AccommodationApplicationPage from "../pages/Services/AccommodationApplicationPage/AccommodationApplicationPage";
import UserProfile from "../pages/Profile/ProfilePage";
import SettingsPage from "../pages/Settings/SettingsPage";
import ErrorPage from "../pages/Shared/ErrorPage";
import AdminApplicationsPage from "../pages/AdminApplications/AdminApplicationsPage";
import ApplicationsPage from "../pages/Applications/ApplicationsPage";
import DormitoriesPage from "../pages/Dormitories/DormitoriesPage";
import SettlementPage from "../pages/Settlement/SettlementPage";
import AdminAccommodationManagementPage from "../pages/AdminApplications/AdminAccommodationManagementPage";
import AdminManagementPage from "../pages/AdminManagement/AdminManagementPage";
import AdminProtectedRoute from "../components/AdminProtectedRoute";
import api from "../utils/api";

const ProtectedRoute = ({ element }) => {
  const { user, isLoading, refreshUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
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
        await refreshUser();
        setIsValid(true);
      } catch (error) {
        console.error("Помилка валідації токена:", error);
        setIsValid(false);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        navigate("/login?session_expired=1", { replace: true });
      }
    };

    validateToken();
  }, [navigate, refreshUser]);

  if (isLoading || isValid === null) {
    return <div>Перевірка автентифікації...</div>;
  }

  if (!isValid || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    user &&
    !user.is_profile_complete &&
    !["/complete-profile", "/login", "/logout"].includes(location.pathname)
  ) {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  return element;
};

const routes = [
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/new-password", element: <NewPasswordPage /> },
  { path: "/register", element: <RegistrationPage /> },
  { path: "/complete-profile", element: <ProtectedRoute element={<CompleteProfilePage />} /> },
  { path: "/dashboard", element: <ProtectedRoute element={<DashboardPage />} /> },
  { path: "/services", element: <ProtectedRoute element={<ServicesPage />} /> },
  {
    path: "/services/accommodation-application",
    element: <ProtectedRoute element={<AccommodationApplicationPage />} />,
  },
  {
    path: "/services/dormitory-settlement",
    element: <ProtectedRoute element={<SettlementApplicationPage />} />,
  },
  {
    path: "/services/contract-creation",
    element: <ProtectedRoute element={<ContractApplicationPage />} />,
  },
  { path: "/settings", element: <ProtectedRoute element={<SettingsPage />} /> },
  { path: "/profile", element: <ProtectedRoute element={<UserProfile />} /> },
  { path: "/applications", element: <ProtectedRoute element={<ApplicationsPage />} /> },
  { path: "/dormitories", element: <ProtectedRoute element={<DormitoriesPage />} /> },
  { path: "/settlement", element: <ProtectedRoute element={<SettlementPage />} /> },
  {
    path: "/adminApplications",
    element: <AdminProtectedRoute allowedRoles={["admin", "superadmin"]} element={<AdminApplicationsPage />} />,
  },
  {
    path: "/admin/accommodation-applications",
    element: <AdminProtectedRoute allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"]} element={<AdminAccommodationManagementPage />} />,
  },
  {
    path: "/admin/applications/accommodation",
    element: <AdminProtectedRoute allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"]} element={<AdminAccommodationManagementPage />} />,
  },
  {
    path: "/admin/management",
    element: <AdminProtectedRoute allowedRoles={["superadmin"]} element={<AdminManagementPage />} />,
  },
  { path: "*", element: <ErrorPage /> },
];

export default routes;