import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { ModalTools } from "../components/ModalTools";
import { ModalSignature } from "../components/ModalSignature";
import ModalConfirm from "../components/ModalConfirm"; // Importado
import LoadingOverlay from "../components/LoadingOverlay";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy, limit, runTransaction, doc } from "firebase/firestore";
import { FaPlus, FaPen, FaCheck, FaTrash } from "react-icons/fa";
import { Combobox } from "@headlessui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "https://backend-eppo-obras.onrender.com/api";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function NewReport() {
  const navigate = useNavigate();

  // ================= STATES =================
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
  
  // Estado para o Modal de Confirmação
  const [confirmModalInfo, setConfirmModalInfo] = useState(null); 
  const [nextReportNumber, setNextReportNumber] = useState(null);

  // ================= LOAD FUNCIONÁRIOS =================
  useEffect(() => {
    if (!obra) {
      setLoading(false);
      return;
    }

    const fetchFuncionarios = async () => {
      try {
        const res = await fetch(`${API_BASE}/employees?obra=${encodeURIComponent(obra)}`);
        const data = await res.json();
        const filtered = Array.isArray(data) ? data.filter((f) => f.GRUPODEF === obra) : [];
        setFuncionarios(filtered);
      } catch (err) {
        console.error("Erro ao carregar funcionários:", err);
        toast.error("Erro ao carregar funcionários!");
      } finally {
        setLoading(false);
      }
    };

    fetchFuncionarios();
  }, [obra]);

  // ================= HANDLE ADD & REMOVE TOOL =================
  const addTool = (tool) => {
    setSelectedTools((prev) => [...prev, tool]);
  };

  // Mantido simples: remove a ferramenta diretamente, sem modal
  const handleRemoveTool = (idx) => {
    setSelectedTools((prev) => prev.filter((_, i) => i !== idx));
    toast.info("Ferramenta removida.");
  };

  // ================= HANDLE CONCLUIR CLICK (NOVA LÓGICA) =================
  const handleConcluirClick = (e) => {
      e.preventDefault(); // Impede o submit padrão do formulário

      // Validação rápida antes de abrir a modal
      if (!selectedTools.length) {
          toast.error("Adicione pelo menos uma ferramenta.");
          return;
      }
      if (!assinaturaAbertura) {
          toast.error("É necessário coletar a assinatura de abertura.");
          return;
      }
      if (!selectedFuncionario) {
          toast.error("Selecione um funcionário.");
          return;
      }

      setConfirmModalInfo({
          title: "Concluir Relatório",
          message: "Confirma a conclusão e o envio deste relatório de ferramentas para o Firebase?",
          onConfirm: () => {
              // Chama a lógica de submissão
              confirmSubmit(e);
              setConfirmModalInfo(null); // Fecha a modal
          },
          onCancel: () => setConfirmModalInfo(null), // Fecha a modal
      });
  };

  // ================= CONFIRM SUBMIT (LÓGICA PRINCIPAL DE SALVAMENTO) =================
  // Lógica anterior de handleSubmit, agora chamada após a confirmação
  const confirmSubmit = async (e) => {
    // A validação de e.preventDefault() já foi feita no handleConcluirClick
    // Aqui garantimos que todos os dados essenciais estão presentes antes de transacionar.
    if (!selectedTools.length || !assinaturaAbertura || !obra || !selectedFuncionario) return; 

    setLoading(true);
    const relRef = collection(db, "relatorios");

    try {
      await runTransaction(db, async (transaction) => {
        const q = query(relRef, where("Obra", "==", obra), orderBy("NumRelatorio", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        const maxNum = !querySnapshot.empty ? querySnapshot.docs[0].data().NumRelatorio : 0;
        const nextNum = maxNum + 1;
        const nowFormatted = formatDate(new Date());

        const ferramentas = selectedTools.map((tool) => ({
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

        const newDocRef = doc(relRef);
        transaction.set(newDocRef, {
          NumRelatorio: nextNum,
          Funcionario: selectedFuncionario || "",
          Matricula: "",
          Obra: obra,
          EstadoRel: "EM CAMPO",
          DataAberturaRel: nowFormatted,
          DataConclusaoRel: "",
          AssinaturaAbertura: assinaturaAbertura,
          AssinaturaConclusao: "",
          Ferramentas: ferramentas,
        });

        setNextReportNumber(nextNum);
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

  // ================= MAIN RENDER =================
  return (
    <div className="font-display min-h-screen bg-neutral-100 flex flex-col relative">
      <NavBar />
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="flex-1 p-3 pt-3 md:pt-20 pb-32 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-semibold text-neutral-600 mt-5 mb-5 text-center">
          Novo Relatório | {obra}
        </h1>

        {/* O onSubmit agora é tratado pelo handleConcluirClick */}
        <form onSubmit={handleConcluirClick} className="space-y-6"> 
          {/* Campo Funcionário */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-3">
            <div className="flex-1 md:max-w-md">
              <Combobox value={selectedFuncionario} onChange={setSelectedFuncionario} open={true}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full p-3 text-md text-neutral-500 rounded-lg bg-white shadow focus:outline-none focus:ring-2 focus:ring-[#E35A4D]"
                    placeholder="Digite ou selecione um funcionário"
                    onChange={(e) => setSelectedFuncionario(e.target.value)}
                  />
                  <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                    {funcionarios
                      .filter((f) =>
                        f.NOME.toLowerCase().includes((selectedFuncionario || "").toLowerCase())
                      )
                      .map((f) => (
                        <Combobox.Option
                          key={f.MATRICULA}
                          value={f.NOME}
                          as="li"
                          className={({ active, selected }) =>
                            `cursor-pointer select-none px-4 py-2 ${active ? "bg-[#E35A4D] text-white" : "text-neutral-700"} ${
                              selected ? "font-semibold" : ""
                            }`
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
              {/* Adicionar Ferramenta - type="button" para evitar submissão do form */}
              <button
                type="button"
                onClick={() => setNewToolsModalOpen(true)}
                disabled={!selectedFuncionario}
                className={`w-12 h-12 text-2xl rounded flex items-center justify-center shadow-md transition ${
                  !selectedFuncionario ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-[#E35A4D] text-white hover:bg-[#BA544A]"
                }`}
                title="Adicionar Ferramenta (QR / Manual)"
              >
                <FaPlus />
              </button>

              {/* Assinatura - type="button" para evitar submissão do form */}
              <button
                type="button"
                onClick={() => {
                  setSignatureModalOpen(true);
                  setIsOpeningSignature(true);
                }}
                disabled={selectedTools.length === 0}
                className={`w-12 h-12 rounded text-xl flex items-center justify-center shadow-md transition ${
                  selectedTools.length === 0 ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-sky-400 text-white hover:bg-sky-500"
                }`}
                title="Adicionar Assinatura"
              >
                <FaPen />
              </button>

              {/* Concluir - type="submit" para chamar o handleSubmit que agora é handleConcluirClick */}
              <button
                type="submit"
                // A desativação está aqui para fins visuais, mas a validação principal é no handleConcluirClick
                disabled={!assinaturaAbertura || selectedTools.length === 0 || !selectedFuncionario} 
                className={`w-12 h-12 rounded text-2xl flex items-center justify-center shadow-md transition ${
                  (!assinaturaAbertura || selectedTools.length === 0 || !selectedFuncionario) ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-[#7EBA4A] text-white hover:bg-[#709E49]"
                }`}
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
                <div key={idx} className="bg-white p-3 rounded-lg shadow hover:shadow-lg transition relative">
                  <button
                    onClick={() => handleRemoveTool(idx)} 
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
              ))}
            </div>
          )}
        </form>
      </div>

      <BottomBar />
      <LoadingOverlay show={loading} />

      {/* Modal QR / Manual */}
      {newToolsModalOpen && (
        <ModalTools
          selectedTools={selectedTools}
          onAddFerramenta={addTool}
          onClose={() => setNewToolsModalOpen(false)}
        />
      )}

      {/* Modal Assinatura */}
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
          forceRequired={true}
        />
      )}
      
      {/* Modal de Confirmação para Conclusão */}
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