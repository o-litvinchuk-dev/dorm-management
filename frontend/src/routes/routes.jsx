import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { RootRedirect } from "../App";

import LoginPage from "../pages/Auth/LoginPage";
import RegistrationPage from "../pages/Auth/RegistrationPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import NewPasswordPage from "../pages/Auth/NewPasswordPage";
import CompleteProfilePage from "../pages/Auth/CompleteProfilePage";
import VerifyEmailPage from "../pages/Auth/VerifyEmailPage";
import TwoFactorAuthPage from "../pages/Auth/TwoFactorAuthPage";

// Публічні сторінки
import PassVerificationPage from "../pages/Public/PassVerificationPage";
import PublicUserProfilePage from "../pages/Public/PublicUserProfilePage"; // NEW IMPORT

import DashboardPage from "../pages/Dashboard/DashboardPage";
import ServicesPage from "../pages/Services/ServicesPage";
import ApplicationsPage from "../pages/Applications/ApplicationsPage"; // Ця сторінка не використовується наразі, але залишається для потенційного використання
import PublicDormitoriesPage from "../pages/Dormitories/DormitoriesPage";
import SettlementPage from "../pages/Settlement/SettlementPage";
import UserProfilePage from "../pages/Profile/ProfilePage";
import SettingsPage from "../pages/Settings/SettingsPage";
import MyActivitiesPage from "../pages/MyActivities/MyActivitiesPage";

import ContractApplicationPage from "../pages/Services/ContractApplicationPage/ContractApplicationPage"; // Ця сторінка не використовується наразі, але залишається для потенційного використання
import SettlementAgreementPage from "../pages/Services/Settlement agreement/SettlementAgreementPage";
import AccommodationApplicationPage from "../pages/Services/AccommodationApplicationPage/AccommodationApplicationPage";
import SearchRoomsPage from "../pages/Services/RoomReservation/SearchRoomsPage";
import RoomDetailPage from "../pages/Services/RoomReservation/RoomDetailPage";
import MyReservationsPage from "../pages/Services/RoomReservation/MyReservationsPage";

import AdminApplicationsPage from "../pages/AdminApplications/AdminApplicationsPage"; // Ця сторінка не використовується наразі, але залишається для потенційного використання
import AdminAccommodationManagementPage from "../pages/AdminApplications/AdminAccommodationManagementPage";
import AdminManagementPage from "../pages/AdminManagement/AdminManagementPage"; // Ця сторінка не використовується наразі, замінена на окремі блоки в адмін панелі
import GroupsManagementPage from "../pages/Dean/GroupsPage";
import ManageApplicationPresetsPage from "../pages/AdminManagement/ManageApplicationPresetsPage";
import AdminRoomReservationsPage from "../pages/AdminReservations/AdminRoomReservationsPage";
import ManageRoomsPage from "../pages/DormManager/ManageRoomsPage";
import ManageSettlementAgreementsPage from "../pages/AdminManagement/ManageSettlementAgreementsPage";
import StudentCouncilPage from "../pages/Dean/StudentCouncilPage";
import ManageSettlementSchedulePage from "../pages/AdminManagement/ManageSettlementSchedulePage";

import DormManagerDashboardPage from "../pages/DormManager/DormManagerDashboardPage";
import AdminDashboardPage from "../pages/AdminDashboard/AdminDashboardPage";
import DeanDashboardPage from "../pages/Dean/DeanDashboardPage";

import NotFoundPage from "../pages/Error/NotFoundPage";
import UnauthorizedPage from "../pages/Error/UnauthorizedPage";

import AdminProtectedRoute from "../components/AdminProtectedRoute";


const AuthRequiredRoute = ({ element }) => {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      if (!localStorage.getItem("accessToken")) {
        if (isMounted) {
          navigate("/login", { state: { from: location }, replace: true });
          setAuthCheckComplete(true);
        }
        return;
      }

      if (isLoading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          navigate("/login", { state: { from: location }, replace: true });
          setAuthCheckComplete(true);
        }
        return;
      }

      // Якщо користувач не заповнив профіль, але намагається перейти на будь-яку сторінку, крім "/complete-profile"
      if (user && !user.is_profile_complete && location.pathname !== "/complete-profile") {
        if (isMounted) {
          navigate("/complete-profile", { state: { from: location }, replace: true });
        }
        return;
      }

      if (isMounted) {
        setAuthCheckComplete(true);
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [user, isLoading, navigate, location]);

  if (isLoading || !authCheckComplete) {
    return <div>Перевірка автентифікації...</div>;
  }

  // Якщо користувач не автентифікований після перевірки, перенаправити на логін
  if (!user && authCheckComplete) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return element;
};

const routesConfig = [
  { path: "/", element: <RootRedirect /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/new-password", element: <NewPasswordPage /> },
  { path: "/register", element: <RegistrationPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/verify-2fa", element: <TwoFactorAuthPage /> },

  // Публічні маршрути, доступні без авторизації
  { path: "/verify-pass-public/:passIdentifier", element: <PassVerificationPage /> },
  { path: "/public-profile/:userId", element: <PublicUserProfilePage /> }, // НОВИЙ ПУБЛІЧНИЙ МАРШРУТ ПРОФІЛЮ

  // Маршрути, що вимагають авторизації
  { path: "/complete-profile", element: <AuthRequiredRoute element={<CompleteProfilePage />} /> },
  { path: "/dashboard", element: <AuthRequiredRoute element={<DashboardPage />} /> },
  { path: "/services", element: <AuthRequiredRoute element={<ServicesPage />} /> },
  {
    path: "/services/accommodation-application",
    element: <AuthRequiredRoute element={<AccommodationApplicationPage />} />,
  },
  {
    path: "/services/settlement-agreement",
    element: <AuthRequiredRoute element={<SettlementAgreementPage />} />,
  },
  {
    // Цей маршрут, імовірно, застарів і може бути видалений або перероблений
    path: "/services/contract-creation",
    element: <AuthRequiredRoute element={<ContractApplicationPage />} />,
  },
  {
    path: "/services/rooms/search",
    element: <AuthRequiredRoute element={<SearchRoomsPage />} />,
  },
  {
    path: "/services/rooms/:roomId",
    element: <AuthRequiredRoute element={<RoomDetailPage />} />,
  },
  { path: "/my-accommodation-applications", element: <AuthRequiredRoute element={<MyActivitiesPage />} /> },
  {
    path: "/my-reservations",
    element: <AuthRequiredRoute element={<MyReservationsPage />} />,
  },
  { path: "/settings", element: <AuthRequiredRoute element={<SettingsPage />} /> },
  { path: "/profile", element: <AuthRequiredRoute element={<UserProfilePage />} /> },
  { path: "/dormitories", element: <AuthRequiredRoute element={<PublicDormitoriesPage />} /> }, // Публічні гуртожитки, але доступні і для авторизованих
  {
    path: "/settlement", // Розклад поселення, доступний багатьом ролям
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<SettlementPage />}
            allowedRoles={["student", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member", "admin", "superadmin"]}
          />
        }
      />
    ),
  },

  // Адмін-маршрути (захищені за ролями)
  {
    // Цей маршрут, імовірно, застарів і може бути видалений або перероблений, оскільки є /admin/accommodation-applications
    path: "/adminApplications",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<AdminApplicationsPage />}
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"]}
          />
        }
      />
    ),
  },
  {
    path: "/admin/accommodation-applications",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<AdminAccommodationManagementPage />}
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"]}
          />
        }
      />
    ),
  },
  {
    // Цей маршрут, імовірно, застарів і може бути видалений або перероблений, оскільки дублює /admin/accommodation-applications
    path: "/admin/applications/accommodation",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<AdminAccommodationManagementPage />}
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"]}
          />
        }
      />
    ),
  },
  {
    // Цей маршрут, імовірно, застарів і може бути видалений, оскільки його функціонал перенесено в Dashboards
    path: "/admin/management",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<AdminManagementPage />}
            allowedRoles={["superadmin"]}
          />
        }
      />
    ),
  },
  {
    path: "/admin/settlement-agreements",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<ManageSettlementAgreementsPage />}
            allowedRoles={["admin", "superadmin", "dorm_manager"]}
          />
        }
      />
    ),
  },
  {
    path: "/dean/groups",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<GroupsManagementPage />}
            allowedRoles={["faculty_dean_office", "admin", "superadmin"]}
          />
        }
      />
    ),
  },
  {
    path: "/admin/application-presets",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<ManageApplicationPresetsPage />}
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager"]}
          />
        }
      />
    ),
  },
  {
    path: "/admin/room-reservations",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<AdminRoomReservationsPage />}
            allowedRoles={["admin", "superadmin", "dorm_manager"]}
          />
        }
      />
    ),
  },
  {
    path: "/dorm-manager/rooms",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<ManageRoomsPage />}
            allowedRoles={["dorm_manager", "admin", "superadmin"]}
          />
        }
      />
    ),
  },
  {
    path: "/dean/student-council",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<StudentCouncilPage />}
            allowedRoles={["faculty_dean_office", "admin", "superadmin"]}
          />
        }
      />
    ),
  },
  {
    path: "/admin/manage-settlement-schedule",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<ManageSettlementSchedulePage />}
            allowedRoles={["admin", "superadmin", "dorm_manager", "faculty_dean_office"]}
          />
        }
      />
    ),
  },

  // Спеціалізовані панелі дашбордів
  {
    path: "/dorm-manager/dashboard",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<DormManagerDashboardPage />}
            allowedRoles={["dorm_manager"]}
          />
        }
      />
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<AdminDashboardPage />}
            allowedRoles={["admin", "superadmin"]}
          />
        }
      />
    ),
  },
  {
    path: "/dean/dashboard",
    element: (
      <AuthRequiredRoute
        element={
          <AdminProtectedRoute
            element={<DeanDashboardPage />}
            allowedRoles={["faculty_dean_office"]}
          />
        }
      />
    ),
  },

  // Сторінки помилок
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> },
];

export default routesConfig;