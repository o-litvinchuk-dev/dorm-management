import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import routes from "./routes/routes";
import { Toaster } from "sonner";
import { FormSyncProvider } from "./contexts/FormSyncContext";
import { UserProvider } from "./contexts/UserContext"; // Додано UserProvider

// Створюємо router на основі routes
const router = createBrowserRouter(routes);

function App() {
    return (
        <FormSyncProvider>
            <UserProvider> {/* Перенесено UserProvider сюди */}
                <RouterProvider router={router} />
                <Toaster
                    position="top-right"
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