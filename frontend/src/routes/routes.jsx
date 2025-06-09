import { Navigate, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { RootRedirect } from "../App";
import AppLayout from "../components/UI/AppLayout";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import RegistrationPage from "../pages/Auth/RegistrationPage.jsx";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage.jsx";
import NewPasswordPage from "../pages/Auth/NewPasswordPage.jsx";
import CompleteProfilePage from "../pages/Auth/CompleteProfilePage.jsx";
import VerifyEmailPage from "../pages/Auth/VerifyEmailPage.jsx";
import TwoFactorAuthPage from "../pages/Auth/TwoFactorAuthPage.jsx";
import PassVerificationPage from "../pages/Public/PassVerificationPage.jsx";
import PublicUserProfilePage from "../pages/Public/PublicUserProfilePage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import ServicesPage from "../pages/Services/ServicesPage.jsx";
import ApplicationsPage from "../pages/Applications/ApplicationsPage.jsx";
import PublicDormitoriesPage from "../pages/Dormitories/DormitoriesPage.jsx";
import SettlementPage from "../pages/Settlement/SettlementPage.jsx";
import UserProfilePage from "../pages/Profile/ProfilePage.jsx";
import SettingsPage from "../pages/Settings/SettingsPage.jsx";
import MyActivitiesPage from "../pages/MyActivities/MyActivitiesPage.jsx";
import ContractApplicationPage from "../pages/Services/ContractApplicationPage/ContractApplicationPage.jsx";
import SettlementAgreementPage from "../pages/Services/Settlement agreement/SettlementAgreementPage.jsx";
import AccommodationApplicationPage from "../pages/Services/AccommodationApplicationPage/AccommodationApplicationPage.jsx";
import SearchRoomsPage from "../pages/Services/RoomReservation/SearchRoomsPage.jsx";
import RoomDetailPage from "../pages/Services/RoomReservation/RoomDetailPage.jsx";
import MyReservationsPage from "../pages/Services/RoomReservation/MyReservationsPage.jsx";
import AdminApplicationsPage from "../pages/AdminApplications/AdminApplicationsPage.jsx";
import AdminAccommodationManagementPage from "../pages/AdminApplications/AdminAccommodationManagementPage.jsx";
import AdminManagementPage from "../pages/AdminManagement/AdminManagementPage.jsx";
import GroupsManagementPage from "../pages/Dean/GroupsPage.jsx";
import ManageApplicationPresetsPage from "../pages/AdminManagement/ManageApplicationPresetsPage.jsx";
import AdminRoomReservationsPage from "../pages/AdminReservations/AdminRoomReservationsPage.jsx";
import ManageRoomsPage from "../pages/DormManager/ManageRoomsPage.jsx";
import ManageSettlementAgreementsPage from "../pages/AdminManagement/ManageSettlementAgreementsPage.jsx";
import StudentCouncilPage from "../pages/Dean/StudentCouncilPage.jsx";
import ManageSettlementSchedulePage from "../pages/AdminManagement/ManageSettlementSchedulePage.jsx";
import DormManagerDashboardPage from "../pages/DormManager/DormManagerDashboardPage.jsx";
import AdminDashboardPage from "../pages/AdminDashboard/AdminDashboardPage.jsx";
import DeanDashboardPage from "../pages/Dean/DeanDashboardPage.jsx";
import NotFoundPage from "../pages/Error/NotFoundPage.jsx";
import UnauthorizedPage from "../pages/Error/UnauthorizedPage.jsx";
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
    return () => { isMounted = false; };
  }, [user, isLoading, navigate, location]);
  if (isLoading || !authCheckComplete) {
    return <div>Перевірка автентифікації...</div>;
  }
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
  { path: "/verify-pass-public/:passIdentifier", element: <PassVerificationPage /> },
  { path: "/public-profile/:userId", element: <PublicUserProfilePage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    element: <AuthRequiredRoute element={<AppLayout />} />,
    children: [
      { path: "/complete-profile", element: <CompleteProfilePage /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/services", element: <ServicesPage /> },
      { path: "/services/accommodation-application", element: <AccommodationApplicationPage /> },
      { path: "/services/settlement-agreement", element: <SettlementAgreementPage /> },
      { path: "/services/contract-creation", element: <ContractApplicationPage /> },
      { path: "/services/rooms/search", element: <SearchRoomsPage /> },
      { path: "/services/rooms/:roomId", element: <RoomDetailPage /> },
      { path: "/my-accommodation-applications", element: <MyActivitiesPage /> },
      { path: "/my-reservations", element: <MyReservationsPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/profile", element: <UserProfilePage /> },
      { path: "/dormitories", element: <PublicDormitoriesPage /> },
      {
        path: "/settlement",
        element: (
          <AdminProtectedRoute
            element={<SettlementPage />}
            allowedRoles={["student", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member", "admin", "superadmin"]}
          />
        ),
      },
      {
        path: "/adminApplications",
        element: (
          <AdminProtectedRoute
            element={<AdminApplicationsPage />}
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"]}
          />
        ),
      },
      {
        path: "/admin/accommodation-applications",
        element: (
          <AdminProtectedRoute
            element={<AdminAccommodationManagementPage />}
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"]}
          />
        ),
      },
      {
        path: "/admin/applications/accommodation",
        element: (
          <AdminProtectedRoute
            element={<AdminAccommodationManagementPage />}
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager", "student_council_head", "student_council_member"]}
          />
        ),
      },
      {
        path: "/admin/management",
        element: (
          <AdminProtectedRoute
            element={<AdminManagementPage />}
            allowedRoles={["superadmin"]}
          />
        ),
      },
      {
        path: "/admin/settlement-agreements",
        element: (
          <AdminProtectedRoute
            element={<ManageSettlementAgreementsPage />}
            allowedRoles={["admin", "superadmin", "dorm_manager"]}
          />
        ),
      },
      {
        path: "/dean/groups",
        element: (
          <AdminProtectedRoute
            element={<GroupsManagementPage />}
            allowedRoles={["faculty_dean_office", "admin", "superadmin"]}
          />
        ),
      },
      {
        path: "/admin/application-presets",
        element: (
          <AdminProtectedRoute
            element={<ManageApplicationPresetsPage />}
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager"]}
          />
        ),
      },
      {
        path: "/admin/room-reservations",
        element: (
          <AdminProtectedRoute
            element={<AdminRoomReservationsPage />}
            allowedRoles={["admin", "superadmin", "dorm_manager"]}
          />
        ),
      },
      {
        path: "/dorm-manager/rooms",
        element: (
          <AdminProtectedRoute
            element={<ManageRoomsPage />}
            allowedRoles={["dorm_manager", "admin", "superadmin"]}
          />
        ),
      },
      {
        path: "/dean/student-council",
        element: (
          <AdminProtectedRoute
            element={<StudentCouncilPage />}
            allowedRoles={["faculty_dean_office", "admin", "superadmin", "dorm_manager"]}
          />
        ),
      },
      {
        path: "/admin/manage-settlement-schedule",
        element: (
          <AdminProtectedRoute
            element={<ManageSettlementSchedulePage />}
            allowedRoles={["admin", "superadmin", "dorm_manager", "faculty_dean_office"]}
          />
        ),
      },
      {
        path: "/dorm-manager/dashboard",
        element: (
          <AdminProtectedRoute
            element={<DormManagerDashboardPage />}
            allowedRoles={["dorm_manager"]}
          />
        ),
      },
      {
        path: "/admin/dashboard",
        element: (
          <AdminProtectedRoute
            element={<AdminDashboardPage />}
            allowedRoles={["admin", "superadmin"]}
          />
        ),
      },
      {
        path: "/dean/dashboard",
        element: (
          <AdminProtectedRoute
            element={<DeanDashboardPage />}
            allowedRoles={["faculty_dean_office"]}
          />
        ),
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
];

export default routesConfig;