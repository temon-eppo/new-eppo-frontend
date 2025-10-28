import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { FaUser } from "react-icons/fa";

export default function Logout() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [totalFerramentas, setTotalFerramentas] = useState(null);

  const API_BASE = "https://backend-eppo-obras--eppo-obras-aef61.us-east4.hosted.app";

  // Pega o email e o nome do localStorage
  const userEmail = localStorage.getItem("userEmail") || "";
  const userNome = localStorage.getItem("userNome") || "";

  // -------------------
  // Logout
  // -------------------
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const auth = getAuth();
      await signOut(auth);
      localStorage.clear();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  // -------------------
  // Buscar total de ferramentas
  // -------------------
  useEffect(() => {
    const fetchFerramentas = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ferramentas`);
        if (!res.ok) throw new Error("Erro ao buscar ferramentas");
        const data = await res.json();
        setTotalFerramentas(data.length);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFerramentas();
  }, []);

  return (
    <div className="font-display min-h-screen bg-(--backgroundfirst) flex flex-col relative">
      <NavBar />

      <div className="flex-1 flex flex-col pb-30 items-center justify-center z-10 px-5">
        <div className="text-6xl text-(--primaryfirst) mb-4">
          <FaUser />
        </div>

        <h1 className="text-2xl font-semibold text-zinc-700 mb-4">
          {userNome || "Usuário"}
        </h1>

        {userEmail ? (
          <div className="mb-6 text-center">
            <p className="text-zinc-700 font-semibold">
              Email: <span className="text-zinc-500/90 font-normal">{userEmail}</span>
            </p>
          </div>
        ) : (
          <p className="text-zinc-700 mb-6 text-center">Nenhum usuário logado.</p>
        )}

        {/* Total de ferramentas */}
        {totalFerramentas !== null && (
          <p className="text-zinc-700 mb-6 text-center">
            Total de ferramentas: <span className="font-semibold">{totalFerramentas}</span>
          </p>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`px-5 py-3 text-lg font-semibold rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:scale-95 ${
              loggingOut
                ? "bg-zinc-400 text-zinc-200 cursor-not-allowed"
                : "bg-(--primaryfirst) text-white hover:bg-(--primarysecond)"
            }`}
          >
            {loggingOut ? "Saindo..." : "Logout"}
          </button>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}
