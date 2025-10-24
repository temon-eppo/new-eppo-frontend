// src/pages/NewReport.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { ModalTools } from "../components/ModalTools";
import { ModalSignature } from "../components/ModalSignature";
import ModalConfirm from "../components/ModalConfirm";
import Loading from "../components/Loading";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  runTransaction,
  doc,
} from "firebase/firestore";
import { FaPlus, FaPen, FaCheck, FaTrash } from "react-icons/fa";
import { Combobox } from "@headlessui/react";
import { useFuncionariosCache } from "../hooks/useFuncionariosCache";
import { useFerramentasCache } from "../hooks/useFerramentasCache";

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

export default function NewReport() {
  const navigate = useNavigate();
  const [obra] = useState(localStorage.getItem("userObra") || "");
  const { funcionarios, loading: loadingFuncionarios } = useFuncionariosCache(obra);

  const { ferramentas, loading: loadingFerramentas } = useFerramentasCache(obra);

  const [selectedFuncionario, setSelectedFuncionario] = useState("");
  const [selectedTools, setSelectedTools] = useState([]);
  const [assinaturaAbertura, setAssinaturaAbertura] = useState("");
  const [assinaturaConclusao, setAssinaturaConclusao] = useState("");
  const [newToolsModalOpen, setNewToolsModalOpen] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [isOpeningSignature, setIsOpeningSignature] = useState(true);
  const [confirmModalInfo, setConfirmModalInfo] = useState(null);
  const [nextReportNumber, setNextReportNumber] = useState(null);
  const [loading, setLoading] = useState(false);

  const addTool = (tool) => {
    const exists = selectedTools.some(
      (t) => t.Patrimonio === tool.Patrimonio && t.Serial === tool.Serial
    );
    if (!exists) {
      setSelectedTools((prev) => [...prev, tool]);
    }
  };

  const handleRemoveTool = (idx) => {
    setSelectedTools((prev) => prev.filter((_, i) => i !== idx));
  };

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
    setLoading(true);
    const relRef = collection(db, "relatorios");

    try {
      await runTransaction(db, async (transaction) => {
        const q = query(
          relRef,
          where("Obra", "==", obra),
          orderBy("NumRelatorio", "desc"),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        const maxNum = !querySnapshot.empty ? querySnapshot.docs[0].data().NumRelatorio : 0;
        const nextNum = maxNum + 1;
        setNextReportNumber(nextNum);

        const ferramentasToSave = prepareFerramentasForSave(selectedTools);
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
          Ferramentas: ferramentasToSave,
        });
      });

      // Atualiza cache local de relatórios
      try {
        const CACHE_KEY = `relatorios_${obra}`;
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        const now = Date.now();
        let cachedData = cachedRaw ? JSON.parse(cachedRaw) : { timestamp: now, data: [] };
        cachedData.data.push({
          NumRelatorio: nextReportNumber,
          Funcionario: selectedFuncionario,
          Matricula: "",
          Obra: obra,
          EstadoRel: "EM CAMPO",
          DataAberturaRel: formatDate(new Date()),
          DataConclusaoRel: "",
          AssinaturaAbertura: assinaturaAbertura,
          AssinaturaConclusao: "",
          Ferramentas: prepareFerramentasForSave(selectedTools),
        });
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
      } catch (err) {
        console.warn("Erro ao atualizar cache:", err);
      }

      navigate("/");
    } catch (err) {
      console.error("Erro ao salvar relatório:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display min-h-screen bg-(--backgroundfirst) flex flex-col relative">
      <NavBar />

      <div className="flex-1 px-3 pt-5 md:pt-25 pb-22 max-w-4xl mx-auto w-full">
        <h1 className="mb-5 flex justify-center text-2xl font-semibold text-zinc-700">
          Novo Relatório // {obra}
        </h1>

        <form onSubmit={handleConcluirClick} className="space-y-6">
          {/* Funcionario */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-1 md:gap-2">
            <div className="flex-1 md:max-w-md">
              <Combobox value={selectedFuncionario} onChange={setSelectedFuncionario}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full p-2.5 text-sm placeholder:normal-case uppercase text-zinc-500 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
                    placeholder="Digite ou selecione um funcionário"
                    displayValue={(value) => value}
                    onChange={(e) => setSelectedFuncionario(e.target.value)}
                  />
                  {funcionarios.length > 0 && (
                    <Combobox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-2 ring-(--primaryfirst) ring-opacity-5 focus:outline-none sm:text-sm z-10">
                      {funcionarios
                        .filter((f) =>
                          f.NOME.toLowerCase().includes(
                            (selectedFuncionario || "").toLowerCase()
                          )
                        )
                        .map((f) => (
                          <Combobox.Option
                            key={f.MATRICULA}
                            value={f.NOME}
                            className={({ active, selected }) =>
                              `cursor-pointer select-none px-4 py-2 ${
                                active ? "bg-(--primaryfirst) text-white" : "text-zinc-500"
                              } ${selected ? "font-semibold" : ""}`
                            }
                          >
                            {f.NOME}
                          </Combobox.Option>
                        ))}
                    </Combobox.Options>
                  )}
                </div>
              </Combobox>
            </div>

            {/* Botões */}
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
          { loading: loadingFuncionarios, message: "Carregando lista de funcionários..." },
          { loading: loadingFerramentas, message: "Carregando lista de ferramentas..." },
          { loading, message: "Salvando relatório..." },
        ]}
      />

      {newToolsModalOpen && (
        <ModalTools
          selectedTools={selectedTools}
          onAddFerramenta={addTool}
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