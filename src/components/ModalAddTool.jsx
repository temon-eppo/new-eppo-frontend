import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ModalAddTool({ closeAllModals, onAddFerramenta, selectedTools = [], activeTools = [] }) {
  const [manualTool, setManualTool] = useState({
    Patrimonio: "",
    Serial: "",
    Descricao: ""
  });

  const handleAdd = () => {
    // 1. Normalização dos dados e validação de campos
    const patrimonio = manualTool.Patrimonio.trim().toUpperCase();
    const serial = manualTool.Serial.trim().toUpperCase();
    const descricao = manualTool.Descricao.trim();

    // Funções de validação centralizadas
    const isDuplicate = (t) => 
      (patrimonio && t.Patrimonio === patrimonio) || (serial && t.Serial === serial);

    // 2. Verifica duplicata no relatório atual
    if (selectedTools.some(isDuplicate)) {
      toast.error("Ferramenta já selecionada neste relatório!");
      return;
    }

    // 3. Verifica se está em outro relatório
    const alreadyInOtherReport = activeTools.find(t =>
      isDuplicate(t) && !selectedTools.some(s => s.Patrimonio === t.Patrimonio && s.Serial === t.Serial)
    );
    if (alreadyInOtherReport) {
      toast.error(`Ferramenta em uso no Relatório N. ${alreadyInOtherReport.NumRelatorio}`);
      return;
    }

    // 4. Adiciona a ferramenta e fecha a modal
    onAddFerramenta({
      Patrimonio: patrimonio,
      Serial: serial,
      Item: descricao.toUpperCase(),
      EstadoFer: "EM CAMPO",
      DataAberturaFer: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      DataConclusaoFer: "",
      Observacao: "",
      ImagemURL: ""
    });
    
    // O toast de sucesso e o fechamento da modal principal agora estão no ModalTools.jsx (veja a próxima seção)
    closeAllModals(); // Fecha apenas o ModalAddTool
  };

  // Melhorando a checagem de "vazio"
  const isDisabled = (!manualTool.Patrimonio.trim() && !manualTool.Serial.trim()) || !manualTool.Descricao.trim();

  return (
    <>
      {/* Mudei z-50 para z-[51] para garantir que fique acima do ModalTools (z-50) */}
      <div className="fixed inset-0 flex bg-black/85 items-center justify-center z-[51] p-3"> 
        <div className="bg-neutral-100 p-3 rounded-xl w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-neutral-600">Adicionar Nova Ferramenta</h2>
            <button onClick={closeAllModals} className="text-neutral-400 hover:text-neutral-500">
              <FaTimes size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Removendo .toUpperCase() dos onChange para refletir o input exato */}
            <input
              type="text"
              placeholder="Patrimônio"
              className="w-full p-3 text-md text-neutral-500 rounded-lg bg-white shadow focus:outline-none focus:ring-2 focus:ring-red-400"
              value={manualTool.Patrimonio}
              onChange={(e) => setManualTool({ ...manualTool, Patrimonio: e.target.value })}
            />
            <input
              type="text"
              placeholder="Serial"
              className="w-full p-3 text-md text-neutral-500 rounded-lg bg-white shadow focus:outline-none focus:ring-2 focus:ring-red-400"
              value={manualTool.Serial}
              onChange={(e) => setManualTool({ ...manualTool, Serial: e.target.value })}
            />
            <input
              type="text"
              placeholder="Descrição"
              className="w-full p-3 text-md text-neutral-500 rounded-lg bg-white shadow focus:outline-none focus:ring-2 focus:ring-red-400"
              value={manualTool.Descricao}
              onChange={(e) => setManualTool({ ...manualTool, Descricao: e.target.value })}
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button" // Adicionado type="button" para evitar submit acidental
                onClick={closeAllModals}
                className="px-4 py-2 bg-neutral-400 text-white rounded-lg hover:bg-neutral-500 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="button" // Adicionado type="button"
                onClick={handleAdd}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
                  isDisabled ? "bg-neutral-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                }`}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2500} />
    </>
  );
}

export default ModalAddTool;