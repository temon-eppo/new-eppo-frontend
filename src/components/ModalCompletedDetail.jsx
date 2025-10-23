// src/components/ModalCompletedDetail.jsx
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { storage, db } from "../firebase";
import { formatDate } from "../utils/dataStatus";
import Galeria from "./Galeria";
import AssinaturasSection from "./AssinaturasSections"; // 👈 import novo

function FerramentaItem({ f }) {
  const { overlayText, overlayBg, border, opacity } = (() => {
    const overlayText =
      f.EstadoFer === "DEVOLVIDO"
        ? "DEVOLVIDO"
        : f.EstadoFer === "EXTRAVIADO"
        ? "EXTRAVIADO"
        : "";
    const overlayBg =
      f.EstadoFer === "DEVOLVIDO"
        ? "bg-(--green) text-white"
        : f.EstadoFer === "EXTRAVIADO"
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
        <span className={`absolute top-2 right-2 p-1 text-xs font-semibold rounded ${overlayBg}`}>
          {overlayText}
        </span>
      )}
      <p>
        <span className="text-zinc-700 font-medium">Pat.</span> {f.Patrimonio || "—"}
      </p>
      <p>
        <span className="text-zinc-700 font-medium">Serial:</span> {f.Serial || "—"}
      </p>
      <p className="line-clamp-1">
        <span className="text-zinc-700 font-medium">Item:</span> {f.Item || "—"}
      </p>
      <p>
        <span className="text-zinc-700 font-medium">Devolução:</span> {formatDate(f.DataConclusaoFer)}
      </p>
      {f.Observacao && (
        <p>
          <span className="text-zinc-700 font-medium">Observação:</span> {f.Observacao}
        </p>
      )}
    </div>
  );
}

export default function ModalCompletedDetail({ relatorio, onClose }) {
  const [assinaturasOpen, setAssinaturasOpen] = useState(false);
  const [storageImages, setStorageImages] = useState([]);
  const [galeriaOpen, setGaleriaOpen] = useState(false);
  const [assinaturaAbertura, setAssinaturaAbertura] = useState(null);
  const [assinaturaConclusao, setAssinaturaConclusao] = useState(null);

  const ferramentas = relatorio.Ferramentas || [];

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="flex justify-center items-center text-zinc-400/50 hover:text-zinc-600"
    >
      <FaTimes className="text-xl" />
    </button>
  );

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const listRef = ref(storage, `relatorios/${relatorio.id}`);
        const res = await listAll(listRef);
        const urls = await Promise.all(res.items.map((itemRef) => getDownloadURL(itemRef)));
        setStorageImages(urls);
      } catch (err) {
        console.error("Erro ao buscar imagens:", err);
      }
    };
    fetchImages();
  }, [relatorio.id]);

  useEffect(() => {
    const fetchAssinaturas = async () => {
      try {
        const docRef = doc(db, "relatorios", relatorio.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAssinaturaAbertura(data.AssinaturaAbertura || null);
          setAssinaturaConclusao(data.AssinaturaConclusao || null);
        }
      } catch (err) {
        console.error("Erro ao buscar assinaturas:", err);
      }
    };
    fetchAssinaturas();
  }, [relatorio.id]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-md w-full max-w-md sm:max-w-lg relative p-3 sm:p-6 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between border-b mb-2 border-zinc-300 pb-2">
          <h2 className="text-xl font-semibold text-zinc-700">
            Relatório #{relatorio.NumRelatorio}
          </h2>
          <CloseButton />
        </div>

        {/* Info do relatório */}
        <div className="grid grid-cols-1 text-[15px] text-zinc-500/90 mb-2">
          <p>
            <span className="text-zinc-700 font-medium">Funcionário:</span>{" "}
            {relatorio.Funcionario}
          </p>
          <div className="flex flex-row justify-between">
            <p>
              <span className="text-zinc-700 font-medium">Abertura:</span>{" "}
              {formatDate(relatorio.DataAberturaRel)}
            </p>
            {relatorio.DataConclusaoRel && (
              <p>
                <span className="text-zinc-700 font-medium">Conclusão:</span>{" "}
                {formatDate(relatorio.DataConclusaoRel)}
              </p>
            )}
          </div>
          {relatorio.Observacao && (
            <p>
              <span className="text-zinc-700 font-medium">Observação:</span>{" "}
              {relatorio.Observacao}
            </p>
          )}
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
          {ferramentas.map((f, i) => (
            <FerramentaItem key={f.Patrimonio || f.Serial || i} f={f} />
          ))}
        </div>

        {/* Galeria */}
        {galeriaOpen && <Galeria images={storageImages} onClose={() => setGaleriaOpen(false)} />}

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