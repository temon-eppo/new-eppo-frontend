// src/components/ModalCompletedDetail.jsx
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Galeria from "./Galeria";
import AssinaturasSection from "./AssinaturasSections";

function FerramentaItem({ f }) {
  const { overlayText, overlayBg, border, opacity } = (() => {
    const overlayText =
      f.estadoFer === "DEVOLVIDO"
        ? "DEVOLVIDO"
        : f.estadoFer === "EXTRAVIADO"
        ? "EXTRAVIADO"
        : "";
    const overlayBg =
      f.estadoFer === "DEVOLVIDO"
        ? "bg-(--green) text-white"
        : f.estadoFer === "EXTRAVIADO"
        ? "bg-(--red) text-white"
        : "";
    const border = "border border-zinc-300";
    const opacity = overlayText ? "opacity-90" : "opacity-100";
    return { overlayText, overlayBg, border, opacity };
  })();

  return (
    <div
      className={`relative flex flex-col text-sm text-zinc-500/90 bg-[#eeeeee] p-2 rounded-lg ${border} ${opacity}`}
    >
      {overlayText && (
        <span
          className={`absolute top-2 right-2 p-1 text-xs font-semibold rounded ${overlayBg}`}
        >
          {overlayText}
        </span>
      )}
      <p>
        <span className="text-zinc-700 font-medium">Pat.</span> {f.patrimonio || "—"}
      </p>
      <p>
        <span className="text-zinc-700 font-medium">Serial:</span> {f.serial || "—"}
      </p>
      <p className="line-clamp-1">
        <span className="text-zinc-700 font-medium">Item:</span> {f.item || "—"}
      </p>
      <p>
        <span className="text-zinc-700 font-medium">Devolução:</span>{" "}
        {f.dataConclusaoFer?.toDate
          ? f.dataConclusaoFer.toDate().toLocaleString("pt-BR")
          : f.dataConclusaoFer
          ? new Date(f.dataConclusaoFer).toLocaleString("pt-BR")
          : "—"}
      </p>
      {f.observacao && (
        <p>
          <span className="text-zinc-700 font-medium">Observação:</span> {f.observacao}
        </p>
      )}
    </div>
  );
}

export default function ModalCompletedDetail({ relatorio, onClose }) {
  const [assinaturasOpen, setAssinaturasOpen] = useState(false);
  const [galeriaOpen, setGaleriaOpen] = useState(false);

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="flex justify-center items-center text-zinc-400/50 hover:text-zinc-600"
    >
      <FaTimes className="text-xl" />
    </button>
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  // Mantendo o padrão do Galeria: array de objetos com `imagemURL`
  const storageImages = (relatorio.galeria || []).map((img) => ({ imagemURL: img.imagemURL }));

  const assinaturaAbertura = relatorio.assinaturaAbertura || null;
  const assinaturaConclusao = relatorio.assinaturaConclusao || null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-md w-full max-w-md sm:max-w-lg relative p-3 sm:p-6 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between border-b mb-2 border-zinc-300 pb-2">
          <h2 className="text-xl font-semibold text-zinc-700">
            Relatório #{relatorio.numRelatorio}
          </h2>
          <CloseButton />
        </div>

        {/* Info do relatório */}
        <div className="grid grid-cols-1 text-[15px] text-zinc-500/90 mb-2">
          <p>
            <span className="text-zinc-700 font-medium">Funcionário:</span>{" "}
            {relatorio.funcionario}
          </p>
          <p>
            <span className="text-zinc-700 font-medium mr-1">Abertura:</span>{" "}
            {relatorio.dataAberturaRel?.toDate
              ? relatorio.dataAberturaRel.toDate().toLocaleString("pt-BR")
              : relatorio.dataAberturaRel
              ? new Date(relatorio.dataAberturaRel).toLocaleString("pt-BR")
              : "—"}
          </p>
          <p>
            <span className="text-zinc-700 font-medium mr-1">Conclusão:</span>{" "}
            {relatorio.dataConclusaoRel?.toDate
              ? relatorio.dataConclusaoRel.toDate().toLocaleString("pt-BR")
              : relatorio.dataConclusaoRel
              ? new Date(relatorio.dataConclusaoRel).toLocaleString("pt-BR")
              : "—"}
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-row gap-2 mb-3">
          {storageImages.length > 0 && (
            <button
              onClick={() => setGaleriaOpen(true)}
              className="flex-1 bg-(--purple) text-white px-4 py-2 rounded-md hover:bg-(--purpledark) transition-colors duration-200 font-medium"
            >
              Ver Galeria
            </button>
          )}
          <button
            onClick={() => setAssinaturasOpen(true)}
            className="flex-1 bg-(--blue) text-white px-4 py-2 rounded-md hover:bg-(--bluedark) transition-colors duration-200 font-medium"
          >
            Ver Assinaturas
          </button>
        </div>

        {/* Ferramentas */}
        <div className="mt-2 grid grid-cols-1 gap-2">
          {(relatorio.ferramentas || []).map((f, i) => (
            <FerramentaItem key={f.patrimonio || f.serial || i} f={f} />
          ))}
        </div>

        {/* Galeria */}
        {galeriaOpen && (
          <Galeria
            images={storageImages}
            onClose={() => setGaleriaOpen(false)}
          />
        )}

        {/* Assinaturas */}
        {assinaturasOpen && (
          <AssinaturasSection
            assinaturaAbertura={assinaturaAbertura}
            assinaturaConclusao={assinaturaConclusao}
            onClose={() => setAssinaturasOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
