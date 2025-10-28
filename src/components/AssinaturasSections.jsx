// src/components/AssinaturasSection.jsx
import { FaTimes } from "react-icons/fa";

export default function AssinaturasSection({ assinaturaAbertura, assinaturaConclusao, onClose }) {
  const normalizeAssinaturaSrc = (assinatura) => {
    if (!assinatura) return null;
    // Se já é dataURL, retorna como está; se não, assume base64
    return assinatura.startsWith("data:image") ? assinatura : `data:image/png;base64,${assinatura}`;
  };

  const renderAssinatura = (titulo, assinatura) => (
    <div className="flex flex-col items-start rounded-lg">
      <p className="text-zinc-700 font-medium">{titulo}</p>
      {assinatura ? (
        <img
          src={normalizeAssinaturaSrc(assinatura)}
          alt={`Assinatura ${titulo}`}
          className="w-full h-32 object-contain bg-white rounded-md border"
        />
      ) : (
        <p className="text-zinc-400 text-sm">Não disponível</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-(--backgroundfirst) rounded-md w-full max-w-md sm:max-w-lg relative p-4 sm:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b border-stone-300 mb-2 pb-2">
          <h2 className="text-xl font-semibold text-zinc-700">Assinaturas</h2>
          <button onClick={onClose} className="text-zinc-400/80 hover:text-zinc-600">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Assinaturas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderAssinatura("Abertura", assinaturaAbertura)}
          {renderAssinatura("Conclusão", assinaturaConclusao)}
        </div>
      </div>
    </div>
  );
}
