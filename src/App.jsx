import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Completed from "./pages/Completed";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import ProtectedRoute from "./components/ProtectedRoute";
import NewReport from "./pages/NewReport";
import Import from "./pages/Imports";
import Register from "./pages/register";

const protectedRoutes = [
  { path: "/", element: <Home /> },
  { path: "new-report", element: <NewReport /> },
  { path: "import", element: <Import />, role: "Dev" }, // só Dev
  { path: "/completed", element: <Completed /> },
  { path: "/register", element: <Register />, role: "Dev" }, // só Dev
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
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
