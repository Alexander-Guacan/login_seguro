import "./App.css";
import { Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { PublicLayout } from "./layouts/PublicLayout";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
