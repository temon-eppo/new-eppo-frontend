import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import Loading from "../components/Loading";
import { FaUser } from "react-icons/fa";
import { useUserObra } from "../hooks/useUserObra";

export default function Logout() {
  const navigate = useNavigate();
  const { user, loading } = useUserObra();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(user?.auth || undefined);
      localStorage.clear();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="font-display min-h-screen bg-(--backgroundfirst) flex flex-col relative">
      <NavBar />
      <Loading loadings={[loading, loggingOut]} />

      <div className="flex-1 flex flex-col pb-30 items-center justify-center z-10 px-5">
        <div className="text-6xl text-(--primaryfirst) mb-4">
          <FaUser />
        </div>

        <h1 className="text-2xl font-semibold text-zinc-700 mb-4">Perfil do Usuário</h1>

        {user ? (
          <div className="mb-6 text-center">
            <p className="text-zinc-700 font-semibold">
              Email: <span className="text-zinc-500/90 font-normal">{user.email}</span>
            </p>
          </div>
        ) : (
          <p className="text-zinc-700 mb-6 text-center">Nenhum usuário logado.</p>
        )}

        <button
          onClick={handleLogout}
          disabled={loggingOut || loading}
          className={`px-5 py-2 text-lg font-semibold rounded-lg shadow-md transition ${
            loggingOut || loading
              ? "bg-zinc-400 text-zinc-200 cursor-not-allowed"
              : "bg-(--primaryfirst) text-white hover:bg-(--primarysecond)"
          }`}
        >
          {loggingOut ? "Saindo..." : "Logout"}
        </button>
      </div>

      <BottomBar />
    </div>
  );
}