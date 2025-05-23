// frontend/src/App.jsx
import React from "react";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { FormSyncProvider } from "./contexts/FormSyncContext";
import { UserProvider, useUser } from "./contexts/UserContext"; // useUser тепер імпортовано
// ProtectedRoute та AdminManagementPage звідси видалені, так як логіка маршрутів централізована
import LoginPage from "./pages/Auth/LoginPage";
import UnauthorizedPage from "./pages/Error/UnauthorizedPage";
import NotFoundPage from "./pages/Error/NotFoundPage";
import routesConfig from "./routes/routes"; // Імпортуємо конфігурацію маршрутів

// Ця функція буде використовуватися як елемент для шляху "/" в routesConfig
// Вона визначає, куди перенаправити користувача на основі його стану аутентифікації.
export function RootRedirect() { // Експортуємо, щоб можна було використати в routesConfig
  const { user, isLoading } = useUser();

  if (isLoading) {
    // Показати індикатор завантаження, поки перевіряється стан користувача
    return <div>Завантаження сесії...</div>;
  }

  // Якщо користувач авторизований, перенаправляємо на /dashboard.
  // Подальший контроль доступу (наприклад, для адмін-сторінок) буде оброблятися
  // відповідними ProtectedRoute/AdminProtectedRoute на цих маршрутах.
  // Перевірка is_profile_complete також буде там.
  return user ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

// createBrowserRouter тепер приймає routesConfig
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