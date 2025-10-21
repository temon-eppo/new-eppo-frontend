// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";

import { auth } from "../firebase";
import { useUserObra } from "../hooks/useUserObra";
import { useLoading } from "../hooks/useLoading";

import LoadingOverlay from "../components/LoadingOverlay";
import logo from "../assets/logo2.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();
  const { obra, error: obraError, loading: obraLoading } = useUserObra();
  const globalLoading = useLoading([carregando, obraLoading]);

  // Redireciona se já houver obra vinculada ao usuário
  useEffect(() => {
    if (obra) {
      navigate("/", { replace: true });
    }
  }, [obra, navigate]);

  // Handler de login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error("Preencha email e senha corretamente.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Digite um email válido.");
      return;
    }

    setCarregando(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, senha);
      toast.success("Login realizado com sucesso!");
    } catch (err) {
      console.error("Login error:", err);
      switch (err.code) {
        case "auth/invalid-email":
          toast.error("Email inválido.");
          break;
        case "auth/user-not-found":
          toast.error("Usuário não encontrado.");
          break;
        case "auth/wrong-password":
          toast.error("Senha incorreta.");
          break;
        case "auth/too-many-requests":
          toast.error("Muitas tentativas. Tente novamente mais tarde.");
          break;
        default:
          toast.error("Erro ao realizar login.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="font-display flex items-center justify-center min-h-screen px-5 bg-neutral-800/95 relative">
      <Toaster position="top-center" reverseOrder={false} />
      <LoadingOverlay show={globalLoading} />

      <div className="relative z-10 flex flex-col items-center w-full mb-20">
        {/* Logo e título */}
        <div className="flex flex-row items-center mb-3">
          <img
            src={logo}
            alt="logo EPPO"
            className="w-30 h-30 spin-logo mr-3"
          />
          <div>
            <p className="text-5xl font-semibold text-neutral-300">EPPO</p>
            <p className="text-4xl font-medium text-neutral-500">Obras</p>
          </div>
        </div>

        {/* Formulário */}
        <div className="w-full mt-4 max-w-sm bg-neutral-700/95 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-medium text-neutral-400 text-center mb-4">
            Login
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full p-3 border-2 border-neutral-400/60 bg-neutral-600/95 rounded-xl text-neutral-200 placeholder:text-neutral-400/60 text-lg focus:outline-none focus:border-[#E35A4D]"
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
              autoComplete="current-password"
              className="w-full p-3 border-2 border-neutral-400/60 bg-neutral-600/95 placeholder:text-neutral-400/60 rounded-xl text-neutral-200 text-lg focus:outline-none focus:border-[#E35A4D]"
            />

            <button
              type="submit"
              className="w-30 mx-auto mt-3 flex py-3 justify-center items-center bg-neutral-400 font-medium text-neutral-700 rounded-xl hover:bg-[#E35A4D] hover:text-neutral-200 transition"
            >
              Entrar
            </button>
          </form>

          {/* Exibe erro apenas quando não está carregando */}
          {!obraLoading && obraError && (
            <p className="text-[#BA544A] mt-2 text-center">{obraError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
