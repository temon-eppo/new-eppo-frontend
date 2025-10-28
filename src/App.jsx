import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Completed from "./pages/Completed";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import ProtectedRoute from "./components/ProtectedRoute";
import NewReport from "./pages/NewReport";
import Import from "./pages/Imports";
import Register from "./pages/register";
import MyTools from "./pages/MyTools"; // <-- Import da nova página
import { useFerramentasCache } from "./hooks/useFerramentasCache";

// Componente que só carrega ferramentas em background
function FerramentasLoader() {
  useFerramentasCache();
  return null;
}

const protectedRoutes = [
  { path: "/", element: <Home /> },
  { path: "new-report", element: <NewReport /> },
  { path: "import", element: <Import />, role: "Dev" }, // só Dev
  { path: "/completed", element: <Completed /> },
  { path: "/my-tools", element: <MyTools /> }, // <-- Nova rota
  { path: "/register", element: <Register />, role: "Dev" }, // só Dev
];

function App() {
  return (
    <BrowserRouter>
      <FerramentasLoader />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* Rotas protegidas */}
        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute requiredRole={route.role}>
                {route.element}
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
