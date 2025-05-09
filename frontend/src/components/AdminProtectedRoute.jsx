import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../utils/api";

const AdminProtectedRoute = ({ element }) => {
  const [isValid, setIsValid] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        const response = await api.get("/auth/validate-token");
        const userRole = response.data.user.role;
        const allowedRoles = ["admin", "dorm_admin"];
        setIsValid(true);
        setIsAuthorized(allowedRoles.includes(userRole));
      } catch (error) {
        setIsValid(false);
      }
    };

    validateToken();
  }, []);

  if (isValid === null || isAuthorized === null) {
    return <div>Перевірка авторизації...</div>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
};

export default AdminProtectedRoute;