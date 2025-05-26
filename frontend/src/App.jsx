import React from "react";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { FormSyncProvider } from "./contexts/FormSyncContext";
import { UserProvider, useUser } from "./contexts/UserContext";
import LoginPage from "./pages/Auth/LoginPage";
import UnauthorizedPage from "./pages/Error/UnauthorizedPage";
import routesConfig from "./routes/routes";
import NotFoundPage from "./pages/Error/NotFoundPage";
import './styles/variables.css';

export function RootRedirect() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div>Завантаження сесії...</div>;
  }

  return user ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

const router = createBrowserRouter(routesConfig);

function App() {
  return (
    <FormSyncProvider>
      <UserProvider>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-right"
          expand={false}
          closeButton
          richColors
          offset="16px"
        />
      </UserProvider>
    </FormSyncProvider>
  );
}

export default App;