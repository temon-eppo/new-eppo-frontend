// ModalConfirm.jsx
import React from "react";
import { FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ModalConfirm({ title = "Confirmação", message, onConfirm, onCancel }) {
  // ... (código que você forneceu) ...
  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} />
      {/* Certifique-se de que o z-index esteja correto, z-50 é um bom valor */}
      <div className="fixed inset-0 flex bg-black/85 items-center justify-center z-50 p-3"> 
        <div className="bg-neutral-100 p-4 rounded-xl w-full max-w-md shadow">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-neutral-600">{title}</h2>
            <button
              onClick={onCancel}
              className="text-neutral-400 hover:text-neutral-500"
              aria-label="Cancelar"
            >
              <FaTimes size={22} />
            </button>
          </div>

          {/* Mensagem */}
          <p className="text-neutral-700 text-md mb-6">{message}</p>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-neutral-400 text-white rounded-lg hover:bg-neutral-500 transition-colors duration-200"
            >
              Não
            </button>
            <button
              onClick={() => {
                onConfirm();
                // O toast de confirmação será removido/movido para o NewReport para melhor fluxo
                // toast.success("Ação confirmada!"); 
              }}
              className="px-4 py-2 bg-[#7EBA4A] text-white rounded-lg hover:bg-[#709E49] transition-colors duration-200"
            >
              Sim
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ModalConfirm;