import React from "react";

function ModalConfirm({ title = "Confirmação", message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex bg-black/90 items-center justify-center z-50 p-3">
      <div className="bg-(--backgroundfirst) p-3 rounded-md w-full max-w-md">
        {/* Cabeçalho */}
        <div className="pb-2 border-b border-zinc-300 mb-2">
          <h2 className="text-xl font-semibold text-zinc-700">{title}</h2>
        </div>

        {/* Mensagem */}
        <p className="text-zinc-700 text-md mb-4">{message}</p>

        {/* Botões */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-zinc-400 text-white font-medium rounded-md hover:bg-zinc-500 transition-colors duration-200"
          >
            Não
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 bg-(--green) text-white font-medium rounded-md hover:bg-(--greendark) transition-colors duration-200"
          >
            Sim
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirm;