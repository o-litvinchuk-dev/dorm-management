import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { RootRedirect } from "../App"; // Переконайтесь, що імпорт правильний
import LoginPage from "../pages/Auth/LoginPage";
import RegistrationPage from "../pages/Auth/RegistrationPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";
import NewPasswordPage from "../pages/Auth/NewPasswordPage";
import CompleteProfilePage from "../pages/Auth/CompleteProfilePage";
import VerifyEmailPage from "../pages/Auth/VerifyEmailPage";
import TwoFactorAuthPage from "../pages/Auth/TwoFactorAuthPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ServicesPage from "../pages/Services/ServicesPage";
import ApplicationsPage from "../pages/Applications/ApplicationsPage";
import DormitoriesPage from "../pages/Dormitories/DormitoriesPage";
import SettlementPage from "../pages/Settlement/SettlementPage";
import UserProfilePage from "../pages/Profile/ProfilePage";
import SettingsPage from "../pages/Settings/SettingsPage";
import ContractApplicationPage from "../pages/Services/ContractApplicationPage/ContractApplicationPage";
import SettlementAgreementPage from "../pages/Services/Settlement agreement/SettlementAgreementPage";
import AccommodationApplicationPage from "../pages/Services/AccommodationApplicationPage/AccommodationApplicationPage";
import SearchRoomsPage from "../pages/Services/RoomReservation/SearchRoomsPage";
import RoomDetailPage from "../pages/Services/RoomReservation/RoomDetailPage";
import MyReservationsPage from "../pages/Services/RoomReservation/MyReservationsPage";
import AdminApplicationsPage from "../pages/AdminApplications/AdminApplicationsPage";
import AdminAccommodationManagementPage from "../pages/AdminApplications/AdminAccommodationManagementPage";
import AdminManagementPage from "../pages/AdminManagement/AdminManagementPage";
import GroupsManagementPage from "../pages/Dean/GroupsPage";
import ManageApplicationPresetsPage from "../pages/AdminManagement/ManageApplicationPresetsPage";
import AdminRoomReservationsPage from "../pages/AdminReservations/AdminRoomReservationsPage";
import ManageRoomsPage from "../pages/DormManager/ManageRoomsPage";
import NotFoundPage from "../pages/Error/NotFoundPage";
import UnauthorizedPage from "../pages/Error/UnauthorizedPage";
import AdminProtectedRoute from "../components/AdminProtectedRoute";
import MyActivitiesPage from "../pages/MyActivities/MyActivitiesPage"; // Новий імпорт

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
        // Still waiting for user context to load
        return;
      }

      // User context has loaded
      if (!user) { // If user is null after loading, means token was invalid or session expired
        if (isMounted) {
          navigate("/login", { state: { from: location }, replace: true });
          setAuthCheckComplete(true);
        }
        return;
      }

      // If user exists but profile is not complete (and not already on complete-profile page)
      if (user && !user.is_profile_complete && location.pathname !== "/complete-profile") {
        if (isMounted) {
          navigate("/complete-profile", { state: { from: location }, replace: true });
          // setAuthCheckComplete will be handled when this navigation occurs and this effect reruns or by the target page
        }
        // No need to setAuthCheckComplete here, as navigation will cause a re-evaluation
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

  // If authCheck is complete but there's still no user, redirect (double check)
  if (!user && authCheckComplete) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If user is loaded, profile is complete (or on complete-profile page), render the element
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
  { path: "/applications", element: <AuthRequiredRoute element={<ApplicationsPage />} /> },
  { path: "/dormitories", element: <AuthRequiredRoute element={<DormitoriesPage />} /> },
  { path: "/settlement", element: <AuthRequiredRoute element={<SettlementPage />} /> },
  
  // Admin Routes
  {
    path: "/adminApplications", // Consider renaming to be more specific or integrating
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
    path: "/admin/accommodation-applications", // Main route for new applications
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
  // This might be redundant if AdminApplicationsPage is a general hub
  {
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
            allowedRoles={["admin", "superadmin", "faculty_dean_office", "dorm_manager"]} // <-- ДОДАНО DORM_MANAGER
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
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> },
];

export default routesConfig;