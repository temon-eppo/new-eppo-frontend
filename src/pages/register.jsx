// ========== IMPORTS ==========
import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import toast, { Toaster } from "react-hot-toast";

// ========== REGISTER PAGE ==========
export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [obra, setObra] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Cria usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Salva detalhes adicionais no Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nome,
        obra,
        role,
      });

      toast.success("Usuário registrado com sucesso!");

      // Limpa campos
      setEmail("");
      setSenha("");
      setNome("");
      setObra("");
      setRole("");
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display min-h-screen bg-neutral-100 flex flex-col">
      <NavBar />
      <Toaster position="top-center" />

      <div className="flex-1 flex items-center justify-center p-4 mt-20 mb-20">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-6 text-center text-neutral-700">Registrar Usuário</h1>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-center">{error}</div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-neutral-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded-lg border-2 border-neutral-300 focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full p-3 rounded-lg border-2 border-neutral-300 focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full p-3 rounded-lg border-2 border-neutral-300 focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Obra</label>
              <input
                type="text"
                value={obra}
                onChange={(e) => setObra(e.target.value)}
                required
                className="w-full p-3 rounded-lg border-2 border-neutral-300 focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="block text-neutral-600 mb-1">Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full p-3 rounded-lg border-2 border-neutral-300 focus:outline-none focus:border-red-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-400 hover:bg-red-500 text-white p-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </form>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}
