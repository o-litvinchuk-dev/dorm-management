import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <div>Завантаження...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "superadmin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;