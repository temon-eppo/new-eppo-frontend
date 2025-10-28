// ========== IMPORTS ==========
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ========== COMPONENT ==========
export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [obra, setObra] = useState("");
  const [role, setRole] = useState("User"); // começa com User
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();

  // ========== PROTEÇÃO "DEV" ==========
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "Dev") navigate("/");
    else setUserRole(role);
  }, [navigate]);

  // ========== REGISTRAR ==========
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nome,
        obra,
        role,
      });

      toast.success("Usuário registrado com sucesso!");

      // Limpa campos (mantendo Role como "User")
      setEmail("");
      setSenha("");
      setNome("");
      setObra("");
      setRole("User");
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        toast.error("Email já cadastrado!");
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== "Dev") return null;

  return (
    <div className="font-display min-h-screen bg-zinc-100 flex flex-col">
      <NavBar />
      {/* Toaster para react-hot-toast */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <div className="flex-1 flex items-center justify-center p-4 md:mt-20 mb-15">
        <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-5 text-center text-zinc-600">NOVO USUÁRIO</h1>

          <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
            <InputField label="Email" value={email} onChange={setEmail} type="email" required />
            <InputField label="Senha" value={senha} onChange={setSenha} type="password" required />
            <InputField label="Nome" value={nome} onChange={setNome} type="text" required />
            <InputField label="Obra" value={obra} onChange={setObra} type="text" required />
            <InputField label="Role" value={role} onChange={setRole} type="text" required />

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-(--primaryfirst) hover:bg-(--primarysecond) text-white text-lg p-3 mt-5 rounded-md font-bold transition-colors w-1/2 text-center"
              >
                {loading ? "Registrando..." : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}

// ========== COMPONENTE INPUT SIMPLES ==========
function InputField({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-zinc-600 text-sm font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete="off"
        className="w-full p-2 text-zinc-500 rounded-md border-2 border-zinc-200/60 focus:outline-none focus:border-(--primaryfirst)"
      />
    </div>
  );
}