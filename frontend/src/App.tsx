import "./App.css";
import { Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { PublicLayout } from "./layouts/PublicLayout";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { PrivateLayout } from "./layouts/PrivateLayout";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { PublicRoute } from "./components/auth/PublicRoute";

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
