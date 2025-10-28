import { IoPlanet, IoFolderOpen, IoArrowRedoSharp, IoHammer } from "react-icons/io5";
import { NavLink } from "react-router-dom";
import { useUserObra } from "../hooks/useUserObra";

export function BottomBar() {
  const { obra, loading } = useUserObra();

  if (loading || !obra) return null;

  const items = [
    { icon: <IoPlanet />, label: "Pendentes", route: "/" },
    { icon: <IoFolderOpen />, label: "Concluídos", route: "/completed" },
    { icon: <IoHammer />, label: "Ferramentas", route: "/my-tools" }, // nova rota
    { icon: <IoArrowRedoSharp />, label: "Sair", route: "/logout" },
  ];

  return (
    <div className="md:hidden font-display fixed bottom-0 left-0 w-full bg-white flex justify-around py-2 z-50">
      {items.map((item) => (
        <NavLink
          key={item.route}
          to={item.route}
          className={({ isActive }) =>
            `flex flex-col items-center text-2xl transition duration-200 ${
              isActive ? "text-(--primaryfirst)" : "text-zinc-400"
            }`
          }
          end={item.route === "/"}
        >
          {item.icon}
          <span className="text-[13px] mt-0.5">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
