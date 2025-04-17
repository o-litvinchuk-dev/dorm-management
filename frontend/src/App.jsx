import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import routes from "./routes/routes";
import { Toaster } from "sonner";

// Створюємо router на основі routes
const router = createBrowserRouter(routes);

function App() {
    return (
        <> 
            <RouterProvider router={router} />
            <Toaster
                position="top-right"
                expand={false}
                closeButton
                richColors
                offset="16px"
            />
            
        </>
    );
}

export default App;
