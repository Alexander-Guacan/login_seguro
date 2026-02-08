import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./components/auth/AuthProvider.tsx";
import { SideBarProvider } from "./components/SideBar/SideBarProvider.tsx";
import { AlertProvider } from "./components/Alert/AlertProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SideBarProvider>
          <AlertProvider>
            <App />
          </AlertProvider>
        </SideBarProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
