import { FaTimes } from "react-icons/fa";

export default function AssinaturasSections({ assinaturaAbertura, assinaturaConclusao, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-stone-50 rounded-xl w-full max-w-md sm:max-w-lg relative p-4 sm:p-6 shadow-lg">

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-stone-500 hover:text-stone-700"
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Título */}
        <h2 className="text-xl font-semibold text-stone-700 mb-4 text-center">
          Assinaturas
        </h2>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Assinatura de Abertura */}
          <div className="flex flex-col items-center border rounded-lg p-3 bg-stone-100">
            <p className="text-stone-700 font-medium mb-2">Abertura</p>
            {assinaturaAbertura ? (
              <img
                src={assinaturaAbertura}
                alt="Assinatura Abertura"
                className="w-full h-32 object-contain bg-white rounded-md border"
              />
            ) : (
              <p className="text-stone-400 text-sm">Não disponível</p>
            )}
          </div>

          {/* Assinatura de Conclusão */}
          <div className="flex flex-col items-center border rounded-lg p-3 bg-stone-100">
            <p className="text-stone-700 font-medium mb-2">Conclusão</p>
            {assinaturaConclusao ? (
              <img
                src={assinaturaConclusao}
                alt="Assinatura Conclusão"
                className="w-full h-32 object-contain bg-white rounded-md border"
              />
            ) : (
              <p className="text-stone-400 text-sm">Não disponível</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
