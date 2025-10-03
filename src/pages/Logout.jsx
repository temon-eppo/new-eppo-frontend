// src/pages/Logout.jsx
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import LoadingOverlay from "../components/LoadingOverlay";
import { useLoading } from "../hooks/useLoading";

export default function Logout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Loading global unificado
  const globalLoading = useLoading([loadingUser, loggingOut]);

  // Verifica usuário logado
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) setUser(currentUser);
    setLoadingUser(false);
  }, []);

  // Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      localStorage.clear(); // limpa todo o localStorage
      toast.success("Logout realizado com sucesso!");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Erro ao deslogar:", err);
      toast.error("Erro ao realizar logout.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="font-display min-h-screen bg-neutral-100 flex flex-col relative">
      <NavBar />
      <LoadingOverlay show={globalLoading} />

      <div className="flex-1 flex flex-col items-center mt-25 z-10">
        <Toaster position="top-center" reverseOrder={false} />
        <h1 className="text-2xl font-semibold text-neutral-600 mb-2">Perfil do Usuário</h1>

        {user ? (
          <div className="mb-10 text-center">
            <p className="text-stone-600 font-semibold">Email: <b className="text-stone-500 font-normal">{user.email}</b></p>
          </div>
        ) : (
          <p className="text-stone-600 mb-6">Nenhum usuário logado.</p>
        )}

        <button
          onClick={handleLogout}
          className="px-5 py-3 bg-red-400 text-neutral-50 font-semibold shadow-md rounded-lg hover:bg-red-500 transition"
        >
          Logout
        </button>
      </div>

      <BottomBar />
    </div>
  );
}
