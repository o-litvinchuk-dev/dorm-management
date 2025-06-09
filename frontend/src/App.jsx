import React from "react";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { FormSyncProvider } from "./contexts/FormSyncContext";
import { UserProvider, useUser } from "./contexts/UserContext";
import { CommandPaletteProvider } from "./contexts/CommandPaletteContext";
// CommandPalette тепер рендериться всередині AppLayout, тому його тут не потрібно імпортувати
import LoginPage from "./pages/Auth/LoginPage";
import routesConfig from "./routes/routes";
import './styles/variables.css';
import 'leaflet/dist/leaflet.css';

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
        <CommandPaletteProvider>
          <RouterProvider router={router} />
          <Toaster
            position="bottom-right"
            expand={false}
            closeButton
            richColors
            offset="16px"
          />
        </CommandPaletteProvider>
      </UserProvider>
    </FormSyncProvider>
  );
}

export default App;