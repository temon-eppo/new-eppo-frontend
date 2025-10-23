import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "../firebase";
import { useUserObra } from "../hooks/useUserObra";
import Loading from "../components/Loading";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/logo2.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const { obra, error: obraError, loading: obraLoading } = useUserObra();

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
    <div className="font-display flex items-center justify-center min-h-screen px-5 bg-zinc-800 relative">
      {/* ToastContainer para react-toastify */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Loading recebe os dois estados */}
      <Loading loadings={[carregando, obraLoading]} />

      <div className="relative z-10 flex flex-col items-center w-full mb-20">
        {/* Logo e título */}
        <div className="flex flex-row items-center mb-3">
          <img src={logo} alt="logo EPPO" className="w-30 h-30 spin-logo mr-3" />
          <div>
            <p className="text-5xl font-semibold text-zinc-200">EPPO</p>
            <p className="text-4xl font-medium text-zinc-500">Obras</p>
          </div>
        </div>

        {/* Formulário */}
        <div className="w-full max-w-sm sm:p-6 md:p-8 bg-zinc-700 p-4 rounded-xl shadow-lg">
          <h2 className="text-xl font-medium text-zinc-300 text-center mb-6 mt-2">Login</h2>

          <form onSubmit={handleLogin} className="flex flex-col space-y-2 text-zinc-300 placeholder:text-zinc-500 text-lg">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full p-3 border-2 border-zinc-500 bg-zinc-600 rounded-lg focus:outline-none focus:border-(--primaryfirst)"
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              className="w-full p-3 border-2 border-zinc-500 bg-zinc-600 rounded-lg focus:outline-none focus:border-(--primaryfirst)"
            />

            <button
              type="submit"
              disabled={carregando || obraLoading}
              className={`w-32 mx-auto mt-4 flex py-3 justify-center items-center font-medium rounded-lg transition ${
                carregando || obraLoading
                  ? "bg-zinc-500 text-zinc-400 cursor-not-allowed"
                  : "bg-zinc-400 text-zinc-700 hover:bg-(--primaryfirst) hover:text-zinc-700"
              }`}
            >
              {carregando || obraLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {!obraLoading && obraError && (
            <p className="text-red-400 mt-2 text-center">{obraError}</p>
          )}
        </div>
      </div>
    </div>
  );
}