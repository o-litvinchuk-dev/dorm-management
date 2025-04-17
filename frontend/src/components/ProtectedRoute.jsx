import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/authUtils";

const ProtectedRoute = ({ children }) => {
    const location = useLocation();

    if (!isAuthenticated()) {
        // Redirect to login if not authenticated, saving the intended destination
        return (
            <Navigate to="/login" state={{ from: location.pathname }} replace />
        );
    }

    // If authenticated, render the protected component
    return children;
};

export default ProtectedRoute;
