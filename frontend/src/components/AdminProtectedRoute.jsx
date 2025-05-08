// frontend/src/components/AdminProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const AdminProtectedRoute = ({ element }) => { // Змінено 'children' на 'element'
  const { user, loading } = useUser();
  const adminRoles = import.meta.env.VITE_ADMIN_ROLES.split(",");

  if (loading) {
    return <div>Перевірка прав доступу...</div>;
  }

  if (!user || !adminRoles.includes(user.role)) {
    console.warn(
      `[AdminProtectedRoute] Доступ заборонено. Роль користувача: ${
        user?.role
      }. Дозволені ролі: ${adminRoles.join(", ")}`
    );
    return <Navigate to="/dashboard" replace />;
  }

  return element; // Змінено 'children' на 'element'
};

export default AdminProtectedRoute;