import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import AssinaturasSections from "./AssinaturasSections";

// ---------------- Ferramenta Card ----------------
function FerramentaCard({ f }) {
  let overlayText = "";
  let overlayBg = "";
  let opacity = "opacity-100";

  if (f.EstadoFer === "DEVOLVIDO") {
    overlayText = "DEVOLVIDO";
    overlayBg = "bg-(--noprazo) text-white";
    opacity = "opacity-70";
  } else if (f.EstadoFer === "EXTRAVIADO") {
    overlayText = "EXTRAVIADO";
    overlayBg = "bg-(--critico) text-white";
    opacity = "opacity-70";
  }

  return (
    <div
      className={`relative flex flex-col text-sm text-zinc-500 bg-[#eeeeee] p-2 rounded-lg border-2 border-zinc-300 ${opacity}`}
    >
      {overlayText && (
        <span
          className={`absolute top-2 right-2 p-1 text-xs font-semibold rounded ${overlayBg}`}
        >
          {overlayText}
        </span>
      )}
      <p>
        <b className="text-zinc-600">Pat.</b> {f.Patrimonio || "—"}
      </p>
      <p>
        <b className="text-zinc-600">Serial:</b> {f.Serial || "—"}
      </p>
      <p className="text-zinc-500 line-clamp-1">
        <b className="text-zinc-600">Item:</b> {f.Item || "—"}
      </p>
      {f.Observacao && (
        <p className="text-zinc-500">
          <b className="text-zinc-600">Observação:</b> {f.Observacao}
        </p>
      )}
    </div>
  );
}

// ---------------- ModalCompletedDetail ----------------
export default function ModalCompletedDetail({ relatorio, onClose }) {
  const [assinaturasModalOpen, setAssinaturasModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(null); // null = nenhum modal aberto

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700"
    >
      <FaTimes className="text-xl" />
    </button>
  );

  const ferramentas = relatorio.Ferramentas || [];

  // Todas as imagens do relatório
  const imagens =
    relatorio.Ferramentas?.flatMap((f) =>
      Array.isArray(f.ImagemURL) ? f.ImagemURL : f.ImagemURL ? [f.ImagemURL] : []
    ) || [];

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black/85 flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-neutral-50 rounded-t-xl sm:rounded-xl w-full max-w-md sm:max-w-lg relative p-3 sm:p-6 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="flex justify-between border-b border-neutral-200 mb-3">
            <h2 className="text-xl font-semibold text-neutral-700">
              Detalhes do Relatório #{relatorio.NumRelatorio}
            </h2>
            <CloseButton />
          </div>

          {/* Info do relatório */}
          <div className="grid grid-cols-1 gap-1 text-neutral-500 mb-3">
            <p><b className="text-neutral-700">Func.</b> {relatorio.Funcionario}</p>
            <div className="flex justify-between">
              <p><b className="text-neutral-700">Status:</b> {relatorio.EstadoRel}</p>
              <p><b className="text-neutral-700">Abertura:</b> {relatorio.DataAberturaRel}</p>
            </div>
            {relatorio.Observacao && <p><b className="text-neutral-700">Observação:</b> {relatorio.Observacao}</p>}
          </div>

          {/* Ferramentas */}
          <div className="mt-1 grid grid-cols-1 gap-2">
            {ferramentas.map((f, i) => (
              <FerramentaCard key={f.Patrimonio || f.Serial || i} f={f} />
            ))}
          </div>

          {/* Galeria horizontal */}
          {imagens.length > 0 && (
            <div
              className="mt-2 flex gap-2 py-2"
              style={{ flexWrap: "nowrap" }}
            >
              {imagens.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Imagem ${idx + 1}`}
                  className={`w-24 h-24 object-cover rounded-lg cursor-pointer flex-shrink-0 border-2 ${idx === modalImageIndex ? "border-blue-500" : "border-transparent"}`}
                  onClick={() => setModalImageIndex(idx)}
                />
              ))}
            </div>
          )}

          {/* Botão Assinaturas */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setAssinaturasModalOpen(true)}
              className="bg-[#4DCFE3] text-neutral-50 px-6 py-3 rounded-lg hover:bg-[#1CA1B5] transition-colors duration-200 font-medium"
            >
              Ver Assinaturas
            </button>
          </div>

          {/* Modal Assinaturas */}
          {assinaturasModalOpen && (
            <AssinaturasSections
              assinaturaAbertura={relatorio.AssinaturaAbertura}
              assinaturaConclusao={relatorio.AssinaturaConclusao}
              onClose={() => setAssinaturasModalOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Modal da imagem em destaque */}
      {modalImageIndex !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-2">
          <img
            src={imagens[modalImageIndex]}
            alt={`Imagem ${modalImageIndex + 1}`}
            className="max-h-[90vh] max-w-full object-contain rounded-lg"
          />
          <button
            onClick={() => setModalImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
          >
            <FaTimes />
          </button>
        </div>
      )}
    </>
  );
}
