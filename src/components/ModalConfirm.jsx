// ModalConfirm.jsx
import React from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ModalConfirm({ title = "Confirmação", message, onConfirm, onCancel }) {
  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="fixed inset-0 flex bg-black/85 items-center justify-center z-50 p-3">
        <div className="bg-neutral-100 p-4 rounded-xl w-full max-w-md shadow">
          {/* Cabeçalho */}
          <div className="mb-4 text-start">
            <h2 className="text-xl font-semibold text-neutral-600">{title}</h2>
          </div>

          {/* Mensagem */}
          <p className="text-neutral-700 text-md mb-6 text-start">{message}</p>

          {/* Botões centralizados */}
          <div className="flex justify-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-neutral-400 text-white rounded-lg hover:bg-neutral-500 transition-colors duration-200"
            >
              Não
            </button>
            <button
              onClick={() => {
                onConfirm();
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