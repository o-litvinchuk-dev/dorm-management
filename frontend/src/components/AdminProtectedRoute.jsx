import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const AdminProtectedRoute = ({ element, allowedRoles }) => {
  const { user } = useUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
};

export default AdminProtectedRoute;