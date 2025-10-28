// src/pages/NewReport.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import ModalTools from "../components/ModalTools";
import { ModalSignature } from "../components/ModalSignature";
import ModalConfirm from "../components/ModalConfirm";
import Loading from "../components/Loading";
import { useFuncionariosCache } from "../hooks/useFuncionariosCache";
import { useFerramentasCache } from "../hooks/useFerramentasCache";
import { FaPlus, FaPen, FaCheck, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { getFirestore, collection, doc, setDoc, getDocs, Timestamp } from "firebase/firestore";
import { getApp } from "firebase/app";

// ==================== TOOL CARD ====================
function ToolCard({ tool, onRemove }) {
  return (
    <div className="bg-white p-3 border border-zinc-300 rounded-md shadow hover:shadow-lg transition relative">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-md text-(--red) hover:text-(--reddark)"
        title="Remover ferramenta"
        type="button"
      >
        <FaTrash />
      </button>
      <p className="text-zinc-500/90 text-sm">
        <span className="text-zinc-700 font-medium">Patrimônio:</span> {tool.Patrimonio || "—"}
      </p>
      <p className="text-zinc-500/90 text-sm mt-1">
        <span className="text-zinc-700 font-medium">Serial:</span> {tool.Serial || "—"}
      </p>
      <p className="text-zinc-500/90 text-sm line-clamp-1 mt-1">
        <span className="text-zinc-700 font-medium">Item:</span> {tool.Item || "—"}
      </p>
    </div>
  );
}

// ==================== NEW REPORT ====================
export default function NewReport() {
  const navigate = useNavigate();
  const [obra] = useState(localStorage.getItem("userObra") || "");
  const db = getFirestore(getApp());
  const { funcionarios } = useFuncionariosCache();
  const { loading: loadingFerramentas } = useFerramentasCache();

  const [selectedFuncionario, setSelectedFuncionario] = useState("");
  const [selectedTools, setSelectedTools] = useState([]);
  const [assinaturaAbertura, setAssinaturaAbertura] = useState("");
  const [assinaturaConclusao, setAssinaturaConclusao] = useState("");
  const [newToolsModalOpen, setNewToolsModalOpen] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [isOpeningSignature, setIsOpeningSignature] = useState(true);
  const [confirmModalInfo, setConfirmModalInfo] = useState(null);
  const [filteredFuncionarios, setFilteredFuncionarios] = useState([]);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);

  // ==================== ADD TOOL ====================
  const addTool = (tool) => {
    const exists = selectedTools.some(
      (t) => t.patrimonio === tool.Patrimonio && t.serial === tool.Serial
    );
    if (!exists) {
      setSelectedTools((prev) => [...prev, tool]);
      toast.success(`Ferramenta adicionada: ${tool.Patrimonio || tool.Serial}`);
    } else {
      toast("Ferramenta já adicionada", { icon: "⚠️" });
    }
  };

  const handleRemoveTool = (idx) =>
    setSelectedTools((prev) => prev.filter((_, i) => i !== idx));

  // ==================== SALVAR RELATÓRIO ====================
  const salvarRelatorio = async ({ funcionario, ferramentas, assinaturaAbertura, assinaturaConclusao }) => {
    if (!obra) throw new Error("Obra não definida");
    setLoadingRelatorio(true);
    const colecao = `relatorios_${obra}`;

    try {
      const agora = new Date();
      const timestampAgora = Timestamp.fromDate(agora);

      // ----- Buscar matrícula -----
      let matricula = "";
      try {
        const cacheFuncionarios = JSON.parse(localStorage.getItem(`funcionarios_${obra}`)) || [];
        const match = cacheFuncionarios.find(
          (f) => f.NOME?.toUpperCase() === funcionario.toUpperCase()
        );
        if (match) matricula = match.MATRICULA || "";
      } catch {
        console.warn("Erro ao ler cache de funcionários");
      }

      // ----- Buscar último número de relatório -----
      const colRef = collection(db, colecao);
      const snapshot = await getDocs(colRef);
      let ultimoNumero = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data?.numRelatorio && Number.isInteger(data.numRelatorio)) {
          ultimoNumero = Math.max(ultimoNumero, data.numRelatorio);
        }
      });
      const numRelatorio = ultimoNumero + 1;

      // ----- Montar ferramentas -----
      const ferramentasCache = JSON.parse(localStorage.getItem("ferramentas_all")) || [];
      const ferramentasFormatadas = ferramentas.map((f) => {
        const patrimonio = f.Patrimonio || "";
        const serial = f.Serial || "";
        const item = f.Item || "";

        const byDescricao = ferramentasCache.find(
          (x) => x.DESCRICAO?.toUpperCase() === item?.toUpperCase()
        );
        const codigo = byDescricao?.COD_FERRA_COB || "";

        const byPatrimonioOuSerial = ferramentasCache.find(
          (x) =>
            (patrimonio && x.PATRIMONIO === patrimonio) ||
            (serial && x.SERIAL === serial)
        );
        const obraCOB = byPatrimonioOuSerial?.T035GCODI || "";
        const statusCOB = byPatrimonioOuSerial?.STATUS || "";

        return {
          patrimonio,
          serial,
          item,
          codigo,
          obraCOB,
          statusCOB,
          estadoFer: "EM CAMPO",
          dataAberturaFer: timestampAgora,
          dataConclusaoFer: null,
          observacao: "",
        };
      });

      // ----- Montar relatório -----
      const relatorioData = {
        funcionario: funcionario.toUpperCase(),
        matricula,
        assinaturaAbertura,
        assinaturaConclusao,
        dataAberturaRel: timestampAgora,
        dataConclusaoRel: null,
        numRelatorio,
        estadoRel: "ABERTO",
        ferramentas: ferramentasFormatadas,
        galeria: [],
      };

      // ----- Salvar no Firestore com ID gerado automaticamente -----
      const docRef = doc(collection(db, colecao)); // Firestore gera o ID
      await setDoc(docRef, relatorioData);

      toast.success("Relatório concluído com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
      toast.error("Erro ao salvar relatório");
    } finally {
      setLoadingRelatorio(false);
    }
  };

  // ==================== CONCLUIR RELATÓRIO ====================
  const handleConcluirClick = (e) => {
    e.preventDefault();
    if (!selectedFuncionario || !selectedTools.length || !assinaturaAbertura) return;

    setConfirmModalInfo({
      title: "Concluir Relatório?",
      message: "Confirma a conclusão deste relatório?",
      onConfirm: () => {
        confirmSubmit();
        setConfirmModalInfo(null);
      },
      onCancel: () => setConfirmModalInfo(null),
    });
  };

  const confirmSubmit = async () => {
    await salvarRelatorio({
      funcionario: selectedFuncionario,
      ferramentas: selectedTools,
      assinaturaAbertura,
      assinaturaConclusao,
    });
  };

  // ==================== RENDER ====================
  return (
    <div className="font-display min-h-screen bg-(--backgroundfirst) flex flex-col relative">
      <NavBar />

      <div className="flex-1 px-3 pt-5 md:pt-25 pb-22 max-w-4xl mx-auto w-full">
        <h1 className="mb-5 flex justify-center text-2xl font-semibold text-zinc-700">
          Novo Relatório // {obra}
        </h1>

        <form onSubmit={handleConcluirClick} className="space-y-6">
          {/* FUNCIONÁRIO */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-1 md:gap-2">
            <div className="flex-1 md:max-w-md relative">
              <input
                type="text"
                value={selectedFuncionario}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setSelectedFuncionario(val);
                  setFilteredFuncionarios(
                    funcionarios
                      .map((f) => f.NOME)
                      .filter((name) => name.toUpperCase().includes(val))
                  );
                }}
                placeholder="Digite ou selecione um funcionário"
                className="w-full p-2.5 text-sm uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
              />
              {filteredFuncionarios.length > 0 && (
                <ul className="absolute z-10 bg-white border border-zinc-300 text-zinc-500/90 w-full max-h-40 overflow-auto rounded-md mt-2 shadow">
                  {filteredFuncionarios.map((name, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        setSelectedFuncionario(name);
                        setFilteredFuncionarios([]);
                      }}
                      className="p-2 hover:bg-(--primaryfirst)/20 cursor-pointer"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* BOTÕES */}
            <div className="flex text-xl gap-2">
              <button
                type="button"
                onClick={() => setNewToolsModalOpen(true)}
                disabled={!selectedFuncionario}
                className={`w-10 h-10 mt-1 md:mt-0 text-2xl rounded flex items-center justify-center shadow-md transition ${
                  !selectedFuncionario
                    ? "bg-zinc-400/90 text-zinc-600 cursor-not-allowed"
                    : "bg-(--primaryfirst) text-white hover:bg-(--primarysecond)"
                }`}
                title="Adicionar Ferramenta"
              >
                <FaPlus />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSignatureModalOpen(true);
                  setIsOpeningSignature(true);
                }}
                disabled={selectedTools.length === 0}
                className={`w-10 h-10 mt-1 md:mt-0 rounded text-xl flex items-center justify-center shadow-md transition ${
                  selectedTools.length === 0
                    ? "bg-zinc-400/90 text-zinc-600 cursor-not-allowed"
                    : "bg-(--primaryfirst) text-white hover:bg-(--primarysecond)"
                }`}
                title="Adicionar Assinatura"
              >
                <FaPen />
              </button>

              <button
                type="submit"
                disabled={
                  !assinaturaAbertura || selectedTools.length === 0 || !selectedFuncionario
                }
                className={`w-10 h-10 mt-1 md:mt-0 rounded text-2xl flex items-center justify-center shadow-md transition ${
                  !assinaturaAbertura || selectedTools.length === 0 || !selectedFuncionario
                    ? "bg-zinc-400/90 text-zinc-600 cursor-not-allowed"
                    : "bg-(--green) text-white hover:bg-(--greendark)"
                }`}
                title="Concluir Relatório"
              >
                <FaCheck />
              </button>
            </div>
          </div>

          {selectedTools.length > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md md:max-w-4xl mx-auto">
              {selectedTools.map((tool, idx) => (
                <ToolCard key={idx} tool={tool} onRemove={() => handleRemoveTool(idx)} />
              ))}
            </div>
          )}
        </form>
      </div>

      <BottomBar />

      <Loading
        loadings={[
          { loading: loadingFerramentas, message: "Carregando ferramenta do cache..." },
          { loading: loadingRelatorio, message: "Salvando relatório..." },
        ]}
      />

      {/* ---------- MODALS ---------- */}
      {newToolsModalOpen && (
        <ModalTools
          selectedTools={selectedTools}
          onAddFerramenta={(tool) => addTool(tool)}
          onClose={() => setNewToolsModalOpen(false)}
        />
      )}

      {signatureModalOpen && (
        <ModalSignature
          onClose={() => setSignatureModalOpen(false)}
          onSave={(dataURL) => {
            if (isOpeningSignature) setAssinaturaAbertura(dataURL);
            else setAssinaturaConclusao(dataURL);
            setSignatureModalOpen(false);
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
