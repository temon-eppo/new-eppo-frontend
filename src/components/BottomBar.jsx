import { IoPlanet, IoFolderOpen, IoArrowRedoSharp } from "react-icons/io5";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";

export function BottomBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const items = [
    { icon: <IoPlanet />, label: "Pendentes", route: "/" },
    { icon: <IoFolderOpen />, label: "Concluídos", route: "/completed" },
    { icon: <IoArrowRedoSharp />, label: "Sair", route: "/logout" }, // botão de logout
  ];

  // Se não estiver logado, não mostra BottomBar
  if (!user) return null;

  return (
    <div className="md:hidden font-display fixed bottom-0 left-0 w-full bg-white shadow flex justify-around py-2 z-50">
      {items.map((item) => (
        <NavLink
          key={item.route}
          to={item.route}
          className={({ isActive }) =>
            `flex flex-col items-center text-2xl transition duration-200 ${
              isActive ? "text-[#E35A4D]" : "text-neutral-400"
            }`
          }
          end={item.route === "/"}
        >
          {item.icon}
          <span className="text-[13px] mt-1">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
