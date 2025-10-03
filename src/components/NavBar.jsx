import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";

export function NavBar() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      // Pega o role do localStorage
      const role = localStorage.getItem("userRole") || "";
      setUserRole(role);
    });
    return () => unsubscribe();
  }, []);

  // Itens padrão visíveis a todos os usuários logados
  const items = [
    { label: "Pendentes", route: "/" },
    { label: "Concluídos", route: "/completed" },
    { label: "Sair", route: "/logout" },
  ];

  // Adiciona itens só para Dev
  if (userRole === "Dev") {
    items.push({ label: "Importar", route: "/import" });
    items.push({ label: "Registrar", route: "/register" });
  }

  // Se não estiver logado, não mostra NavBar
  if (!user) return null;

  return (
    <nav className="hidden md:flex font-display justify-between items-center px-6 py-3 bg-white shadow fixed top-0 left-0 w-full z-50">
      <div className="font-semibold text-2xl text-neutral-500">EPPO Obras v1.0</div>
      <div className="flex space-x-7">
        {items.map((item) => (
          <NavLink
            key={item.route}
            to={item.route}
            className={({ isActive }) =>
              `font-semibold text-xl transition ${
                isActive
                  ? "text-[#E35A4D]"
                  : "text-neutral-500 hover:text-[#E35A4D]"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
