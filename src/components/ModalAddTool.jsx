import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ModalAddTool({ closeAllModals, onAddFerramenta, selectedTools = [], activeTools = [], cachedFerramentas = [] }) {
  const [manualTool, setManualTool] = useState({
    Patrimonio: "",
    Serial: "",
    Descricao: ""
  });

  const handleChange = (field) => (e) => {
    setManualTool(prev => ({ ...prev, [field]: e.target.value.toUpperCase() }));
  };

  const handleAdd = () => {
    const { Patrimonio, Serial, Descricao } = manualTool;

    // Verifica duplicados no relatório atual
    if (selectedTools.some(t => t.Patrimonio === Patrimonio || t.Serial === Serial)) {
      toast.error("Ferramenta já selecionada neste relatório!");
      return;
    }

    // Verifica duplicados no cache de ferramentas (activeTools + cachedFerramentas)
    if (cachedFerramentas.some(f => f.PATRIMONIO === Patrimonio)) {
      toast.error("Patrimônio já cadastrado!");
      return;
    }

    if (cachedFerramentas.some(f => f.NUMSER === Serial)) {
      toast.error("Serial já cadastrado!");
      return;
    }

    // Verifica se já está em outro relatório
    const inOtherReport = activeTools.find(
      t => (t.Patrimonio === Patrimonio || t.Serial === Serial) &&
           !selectedTools.some(s => s.Patrimonio === t.Patrimonio && s.Serial === t.Serial)
    );
    if (inOtherReport) {
      toast.error(`Ferramenta em uso no relatório #${inOtherReport.NumRelatorio}`);
      return;
    }

    onAddFerramenta({
      Patrimonio,
      Serial,
      Item: Descricao,
      EstadoFer: "EM CAMPO",
      DataAberturaFer: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      DataConclusaoFer: "",
      Observacao: "",
      ImagemURL: ""
    });

    closeAllModals();
    toast.success("Ferramenta adicionada!");
  };

  const isDisabled = !(manualTool.Patrimonio || manualTool.Serial) || !manualTool.Descricao;

  return (
    <>
      <div className="fixed inset-0 flex bg-black/50 items-center justify-center z-[51] p-3">
        <div className="bg-(--backgroundfirst) p-3 rounded-md w-full max-w-md">
          <div className="flex justify-between pb-2 border-b border-zinc-300 items-center mb-2">
            <h2 className="text-xl font-semibold text-zinc-700">Adicionar Nova Ferramenta</h2>
            <button onClick={closeAllModals} className="text-zinc-400/80 hover:text-zinc-600">
              <FaTimes size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Patrimônio"
              value={manualTool.Patrimonio}
              onChange={handleChange("Patrimonio")}
              className="w-full p-2.5 text-md placeholder:normal-case uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
            />
            <input
              type="text"
              placeholder="Serial"
              value={manualTool.Serial}
              onChange={handleChange("Serial")}
              className="w-full p-2.5 text-md placeholder:normal-case uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
            />
            <input
              type="text"
              placeholder="Descrição"
              value={manualTool.Descricao}
              onChange={handleChange("Descricao")}
              className="w-full p-2.5 text-md placeholder:normal-case uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
            />

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                className={`p-2 rounded-md text-white font-medium transition-colors duration-200 ${
                  isDisabled ? "bg-zinc-400 cursor-not-allowed" : "bg-(--green) hover:bg-(--greendark)"
                }`}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={2500} />
    </>
  );
}

export default ModalAddTool;