import { NavLink } from "react-router-dom";
import { useUserObra } from "../hooks/useUserObra";

export function NavBar() {
  const { role, loading } = useUserObra();

  // Se ainda estiver carregando, não mostra NavBar
  if (loading) return null;

  // Itens padrão
  const items = [
    { label: "Pendentes", route: "/" },
    { label: "Concluídos", route: "/completed" },
    { label: "Sair", route: "/logout" },
  ];

  // Itens só para Dev ou Admin
  if (role === "Dev" || role === "Admin") {
    items.push({ label: "Importar", route: "/import" });
    items.push({ label: "Registrar", route: "/register" });
  }

  return (
    <nav className="hidden md:flex font-display justify-between items-center px-5 py-2 bg-white shadow fixed top-0 left-0 w-full z-50">
      <div className="font-medium text-2xl text-zinc-700">EPPO Obras v1.1</div>
      <div className="flex space-x-8">
        {items.map((item) => (
          <NavLink
            key={item.route}
            to={item.route}
            className={({ isActive }) =>
              `font-medium text-lg transition ${
                isActive
                  ? "text-(--primaryfirst)"
                  : "text-zinc-400 hover:text-(--primarysecond)"
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
