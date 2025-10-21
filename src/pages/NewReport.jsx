// src/pages/NewReport.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { ModalTools } from "../components/ModalTools";
import { ModalSignature } from "../components/ModalSignature";
import ModalConfirm from "../components/ModalConfirm";
import LoadingOverlay from "../components/LoadingOverlay";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy, limit, runTransaction, doc } from "firebase/firestore";
import { FaPlus, FaPen, FaCheck, FaTrash } from "react-icons/fa";
import { Combobox } from "@headlessui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "https://backend-eppo-obras.onrender.com/api";

// ---------------- Utilitários ----------------
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const prepareFerramentasForSave = (tools) => {
  const nowFormatted = formatDate(new Date());
  return tools.map((tool) => ({
    Patrimonio: tool.Patrimonio || "",
    Serial: tool.Serial || "",
    Codigo: tool.Codigo || "",
    Item: tool.Item || "",
    ObraCOB: tool.ObraCOB || "",
    StatusCOB: tool.StatusCOB || "",
    EstadoFer: "EM CAMPO",
    DataAberturaFer: nowFormatted,
    DataConclusaoFer: "",
    Observacao: "",
    ImagemURL: "",
  }));
};

// ---------------- Tool Card ----------------
function ToolCard({ tool, onRemove }) {
  return (
    <div className="bg-white p-3 rounded-lg shadow hover:shadow-lg transition relative">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-xl text-[#E35A4D] hover:text-[#BA544A]"
        title="Remover ferramenta"
        type="button"
      >
        <FaTrash />
      </button>
      <p className="text-neutral-400 text-[15px]"><b className="text-neutral-600">Patrimônio:</b> {tool.Patrimonio || "—"}</p>
      <p className="text-neutral-400 text-[15px]"><b className="text-neutral-600">Serial:</b> {tool.Serial || "—"}</p>
      <p className="text-neutral-400 text-[15px]"><b className="text-neutral-600">Item:</b> {tool.Item || "—"}</p>
    </div>
  );
}

// ---------------- Componente Principal ----------------
export default function NewReport() {
  const navigate = useNavigate();

  const [obra] = useState(localStorage.getItem("userObra") || "");
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedFuncionario, setSelectedFuncionario] = useState("");
  const [selectedTools, setSelectedTools] = useState([]);

  const [assinaturaAbertura, setAssinaturaAbertura] = useState("");
  const [assinaturaConclusao, setAssinaturaConclusao] = useState("");

  const [newToolsModalOpen, setNewToolsModalOpen] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [isOpeningSignature, setIsOpeningSignature] = useState(true);

  const [confirmModalInfo, setConfirmModalInfo] = useState(null);
  const [nextReportNumber, setNextReportNumber] = useState(null);

  // ---------------- Load Funcionários com cache incremental ----------------
useEffect(() => {
  if (!obra) {
    setLoading(false);
    return;
  }

  const STORAGE_KEY = `funcionarios_${obra}`;
  const CACHE_DURATION = 1000 * 60 * 60 * 2; // 2 horas

  const loadFuncionarios = async () => {
    setLoading(true);

    try {
      // Lê cache
      const cached = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      let cachedData = cached ? JSON.parse(cached) : null;

      // Se cache válido, usa imediatamente
      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        setFuncionarios(cachedData.data);
        setLoading(false); // já marca como carregado
      }

      // Busca API em background
      const res = await fetch(`${API_BASE}/employees?obra=${encodeURIComponent(obra)}`);
      const data = await res.json();
      const filtered = Array.isArray(data) ? data.filter((f) => f.GRUPODEF === obra) : [];

      // Atualiza cache se mudou
      let shouldUpdateCache = !cachedData || filtered.length !== cachedData.data.length;
      if (!shouldUpdateCache && cachedData) {
        shouldUpdateCache = filtered.some(f => !cachedData.data.find(c => c.MATRICULA === f.MATRICULA));
      }

      if (shouldUpdateCache) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now(), data: filtered }));
        setFuncionarios(filtered);
      }

      // Caso não tenha cache, garante loading false
      if (!cachedData) setLoading(false);

    } catch (err) {
      console.error("Erro ao carregar funcionários:", err);
      toast.error("Erro ao carregar funcionários!");
      setLoading(false);
    }
  };

  loadFuncionarios();
}, [obra]);

  // ---------------- Add / Remove Tool ----------------
  const addTool = (tool) => {
    const exists = selectedTools.some(
      (t) => t.Patrimonio === tool.Patrimonio && t.Serial === tool.Serial
    );
    if (exists) {
      toast.info("Essa ferramenta já foi adicionada.");
      return;
    }
    setSelectedTools((prev) => [...prev, tool]);
  };

  const handleRemoveTool = (idx) => {
    setSelectedTools((prev) => prev.filter((_, i) => i !== idx));
    toast.info("Ferramenta removida.");
  };

  // ---------------- Submit ----------------
  const handleConcluirClick = (e) => {
    e.preventDefault();

    if (!selectedFuncionario) return toast.error("Selecione um funcionário.");
    if (!selectedTools.length) return toast.error("Adicione pelo menos uma ferramenta.");
    if (!assinaturaAbertura) return toast.error("É necessário coletar a assinatura de abertura.");

    setConfirmModalInfo({
      title: "Concluir Relatório",
      message: "Confirma a conclusão e o envio deste relatório de ferramentas?",
      onConfirm: () => {
        confirmSubmit();
        setConfirmModalInfo(null);
      },
      onCancel: () => setConfirmModalInfo(null),
    });
  };

  const confirmSubmit = async () => {
    setLoading(true);
    const relRef = collection(db, "relatorios");

    try {
      await runTransaction(db, async (transaction) => {
        const q = query(relRef, where("Obra", "==", obra), orderBy("NumRelatorio", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        const maxNum = !querySnapshot.empty ? querySnapshot.docs[0].data().NumRelatorio : 0;
        const nextNum = maxNum + 1;
        setNextReportNumber(nextNum);

        const ferramentas = prepareFerramentasForSave(selectedTools);
        const nowFormatted = formatDate(new Date());

        const newDocRef = doc(relRef);
        transaction.set(newDocRef, {
          NumRelatorio: nextNum,
          Funcionario: selectedFuncionario,
          Matricula: "",
          Obra: obra,
          EstadoRel: "EM CAMPO",
          DataAberturaRel: nowFormatted,
          DataConclusaoRel: "",
          AssinaturaAbertura: assinaturaAbertura,
          AssinaturaConclusao: "",
          Ferramentas: ferramentas,
        });
      });

      toast.success("Relatório salvo com sucesso!");
      navigate("/");
    } catch (err) {
      console.error("Erro ao salvar relatório:", err);
      toast.error("Erro ao salvar relatório!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display min-h-screen bg-neutral-100 flex flex-col relative">
      <NavBar />
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="flex-1 p-3 pt-3 md:pt-20 pb-32 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-semibold text-neutral-600 mt-5 mb-5 text-center">
          Novo Relatório | {obra}
        </h1>

        <form onSubmit={handleConcluirClick} className="space-y-6">
          {/* Funcionario */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-3">
            <div className="flex-1 md:max-w-md">
              <Combobox value={selectedFuncionario} onChange={setSelectedFuncionario}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full p-3 text-md text-neutral-500 rounded-lg bg-white shadow focus:outline-none focus:ring-2 focus:ring-[#E35A4D]"
                    placeholder="Digite ou selecione um funcionário"
                  />
                  <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                    {funcionarios
                      .filter((f) => f.NOME.toLowerCase().includes((selectedFuncionario || "").toLowerCase()))
                      .map((f) => (
                        <Combobox.Option
                          key={f.MATRICULA}
                          value={f.NOME}
                          className={({ active, selected }) =>
                            `cursor-pointer select-none px-4 py-2 ${active ? "bg-[#E35A4D] text-white" : "text-neutral-700"} ${selected ? "font-semibold" : ""}`
                          }
                        >
                          {f.NOME}
                        </Combobox.Option>
                      ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>

            {/* Botões */}
            <div className="flex text-xl gap-3">
              <button
                type="button"
                onClick={() => setNewToolsModalOpen(true)}
                disabled={!selectedFuncionario}
                className={`w-12 h-12 text-2xl rounded flex items-center justify-center shadow-md transition ${!selectedFuncionario ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-[#E35A4D] text-white hover:bg-[#BA544A]"}`}
                title="Adicionar Ferramenta"
              >
                <FaPlus />
              </button>

              <button
                type="button"
                onClick={() => { setSignatureModalOpen(true); setIsOpeningSignature(true); }}
                disabled={selectedTools.length === 0}
                className={`w-12 h-12 rounded text-xl flex items-center justify-center shadow-md transition ${selectedTools.length === 0 ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-sky-400 text-white hover:bg-sky-500"}`}
                title="Adicionar Assinatura"
              >
                <FaPen />
              </button>

              <button
                type="submit"
                disabled={!assinaturaAbertura || selectedTools.length === 0 || !selectedFuncionario}
                className={`w-12 h-12 rounded text-2xl flex items-center justify-center shadow-md transition ${!assinaturaAbertura || selectedTools.length === 0 || !selectedFuncionario ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-[#7EBA4A] text-white hover:bg-[#709E49]"}`}
                title="Concluir Relatório"
              >
                <FaCheck />
              </button>
            </div>
          </div>

          {/* Lista Ferramentas */}
          {selectedTools.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-4 max-w-md mx-auto">
              {selectedTools.map((tool, idx) => (
                <ToolCard key={idx} tool={tool} onRemove={() => handleRemoveTool(idx)} />
              ))}
            </div>
          )}
        </form>
      </div>

      <BottomBar />
      <LoadingOverlay show={loading} />

      {newToolsModalOpen && <ModalTools selectedTools={selectedTools} onAddFerramenta={addTool} onClose={() => setNewToolsModalOpen(false)} />}
      {signatureModalOpen && (
        <ModalSignature
          onClose={() => setSignatureModalOpen(false)}
          onSave={(dataURL) => {
            if (isOpeningSignature) setAssinaturaAbertura(dataURL);
            else setAssinaturaConclusao(dataURL);
            setSignatureModalOpen(false);
            toast.success("Assinatura salva!");
          }}
          initialValue={isOpeningSignature ? assinaturaAbertura : assinaturaConclusao}
          forceRequired
        />
      )}
      {confirmModalInfo && (
        <ModalConfirm
          title={confirmModalInfo.title}
          message={confirmModalInfo.message}
          onConfirm={confirmModalInfo.onConfirm}
          onCancel={confirmModalInfo.onCancel}
        />
      )}
    </div>
  );
}