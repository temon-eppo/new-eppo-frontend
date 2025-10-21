// src/components/ModalDetail.jsx
import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import Detalhes from "./Detalhes";
import { ModalSignature } from "./ModalSignature";
import LoadingOverlay from "../components/LoadingOverlay";
import { useLoading } from "../hooks/useLoading";
import ImageGallery from "./ImageGallery"; // Import da galeria

// ---------------- Ferramenta Item ----------------
function FerramentaItem({ f, onClick, isSelected, anotherSelected }) {
  const overlayText =
    f.EstadoFer === "DEVOLVIDO"
      ? "DEVOLVIDO"
      : f.EstadoFer === "EXTRAVIADO"
      ? "EXTRAVIADO"
      : "";

  const overlayBg =
    f.EstadoFer === "DEVOLVIDO"
      ? "bg-(--noprazo) text-white"
      : f.EstadoFer === "EXTRAVIADO"
      ? "bg-(--critico) text-white"
      : "";

  const clickable = !overlayText;
  const border = isSelected ? "border-2 border-zinc-500" : "border-2 border-zinc-300";
  const opacity =
    overlayText ? "opacity-50" : anotherSelected && !isSelected ? "opacity-50" : "opacity-100";

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`relative flex flex-col text-sm text-zinc-500 bg-[#eeeeee] p-2 rounded-lg ${border} ${opacity} ${
        clickable ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"
      } transition-colors duration-200`}
    >
      {overlayText && (
        <span className={`absolute top-2 right-2 p-1 text-xs font-semibold rounded ${overlayBg}`}>
          {overlayText}
        </span>
      )}
      <p><b className="text-zinc-600">Pat.</b> {f.Patrimonio || "—"}</p>
      <p><b className="text-zinc-600">Serial:</b> {f.Serial || "—"}</p>
      <p className="text-zinc-500 line-clamp-1"><b className="text-zinc-600">Item:</b> {f.Item || "—"}</p>
      <p className="text-zinc-500"><b className="text-zinc-600">Devolução:</b> {f.DataConclusaoFer || "—"}</p>
    </div>
  );
}

// ---------------- ModalDetail ----------------
export function ModalDetail({ relatorio, onClose }) {
  const [localRelatorio, setLocalRelatorio] = useState(relatorio);
  const [selectedTool, setSelectedTool] = useState(null);
  const [action, setAction] = useState(null);
  const [assinaturaConclusao, setAssinaturaConclusao] = useState("");
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [concluirLoading, setConcluirLoading] = useState(false);

  const navigate = useNavigate();
  const anotherSelected = selectedTool !== null;

  const loading = useLoading([concluirLoading]);

  const pendingTools = localRelatorio.Ferramentas.filter(
    (f) => f.EstadoFer !== "DEVOLVIDO" && f.EstadoFer !== "EXTRAVIADO"
  );

  const isLastTool =
    pendingTools.length === 1 &&
    selectedTool?.Patrimonio === pendingTools[0].Patrimonio &&
    selectedTool?.Serial === pendingTools[0].Serial;

  const handleToolClick = (f) => setSelectedTool(f);

  // Todas as imagens do relatório
  const imagens =
    localRelatorio.Ferramentas?.flatMap((f) =>
      Array.isArray(f.ImagemURL) ? f.ImagemURL : f.ImagemURL ? [f.ImagemURL] : []
    ) || [];

  // ---------------- Concluir ferramenta ----------------
  const handleConcluir = async (isLastToolAction = false) => {
    if (!selectedTool) return;
    try {
      setConcluirLoading(true);

      const now = new Date().toISOString();

      const uploadedUrls = await Promise.all(
        photos.map(async (photo, i) => {
          const photoRef = ref(storage, `relatorios/${localRelatorio.id}/${selectedTool.Patrimonio}_${i}.png`);
          await uploadString(photoRef, photo, "data_url");
          return await getDownloadURL(photoRef);
        })
      );

      const updatedFerramentas = localRelatorio.Ferramentas.map((f) => {
        if (f.Patrimonio === selectedTool.Patrimonio && f.Serial === selectedTool.Serial) {
          return {
            ...f,
            EstadoFer: action,
            DataConclusaoFer: now,
            Observacao: observacao,
            ImagemURL: uploadedUrls,
          };
        }
        return f;
      });

      setLocalRelatorio((prev) => ({ ...prev, Ferramentas: updatedFerramentas }));

      const allDone = updatedFerramentas.every(
        (f) => f.EstadoFer === "DEVOLVIDO" || f.EstadoFer === "EXTRAVIADO"
      );

      const relRef = doc(db, "relatorios", relatorio.id);
      const updatePayload = { Ferramentas: updatedFerramentas };

      if (isLastToolAction && allDone) {
        updatePayload.EstadoRel = action;
        updatePayload.DataConclusaoRel = now;
        updatePayload.AssinaturaConclusao = assinaturaConclusao;
        updatePayload.Observacao = observacao;
      }

      await updateDoc(relRef, updatePayload);

      if (isLastToolAction) {
        onClose();
        navigate("/");
      } else {
        setSelectedTool(null);
        setAction(null);
        setObservacao("");
        setPhotos([]);
      }
    } catch (err) {
      console.error("Erro ao concluir:", err);
    } finally {
      setConcluirLoading(false);
    }
  };

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="flex justify-center items-center text-zinc-500 hover:text-zinc-700"
    >
      <FaTimes className="text-xl" />
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/85 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md sm:max-w-lg relative p-3 sm:p-6 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="flex justify-between border-b-2 border-zinc-200 pb-1">
            <h2 className="text-xl font-semibold text-zinc-600">
              Relatório #{localRelatorio.NumRelatorio}
            </h2>
            <CloseButton />
          </div>

          {/* Info do relatório */}
          <div className="grid grid-cols-1 pt-2 text-[15px] text-zinc-500">
            <p><b className="text-zinc-600">Func.</b> {localRelatorio.Funcionario}</p>
            <div className="flex flex-row justify-between">
              <p><b className="text-zinc-600">Status:</b> {localRelatorio.EstadoRel}</p>
              <p><b className="text-zinc-600">Abertura:</b> {localRelatorio.DataAberturaRel}</p>
            </div>
          </div>

          {/* Galeria de imagens (apenas se nenhuma ferramenta estiver selecionada) */}
          {selectedTool === null && imagens.length > 0 && (
            <div className="mt-2">
              <ImageGallery images={imagens} />
            </div>
          )}

          {/* Lista de ferramentas */}
          <div className="mt-2 grid grid-cols-1 gap-3">
            {localRelatorio.Ferramentas.map((f, idx) => (
              <FerramentaItem
                key={idx}
                f={f}
                onClick={() => handleToolClick(f)}
                isSelected={selectedTool?.Patrimonio === f.Patrimonio && selectedTool?.Serial === f.Serial}
                anotherSelected={anotherSelected}
              />
            ))}
          </div>

          {/* Botões para ação (aparecem somente quando uma ferramenta é selecionada) */}
          {selectedTool && !action && (
            <div className="flex flex-row gap-4 justify-center mt-4">
              <button
                onClick={() => setAction("DEVOLVIDO")}
                className="flex-1 bg-(--noprazo) text-white px-5 py-3 rounded-lg hover:bg-[#5DA32E] font-medium"
              >
                DEVOLVER
              </button>
              <button
                onClick={() => setAction("EXTRAVIADO")}
                className="flex-1 bg-(--critico) text-white px-5 py-3 rounded-lg hover:bg-[#B5291C] font-medium"
              >
                EXTRAVIO
              </button>
            </div>
          )}

          {/* Detalhes e botão concluir */}
          {selectedTool && action && (
            <>
              <Detalhes
                observacao={observacao}
                setObservacao={setObservacao}
                photos={photos}
                setPhotos={setPhotos}
                showCamera={showCamera}
                setShowCamera={setShowCamera}
              />

              {isLastTool ? (
                <>
                  {!assinaturaConclusao && (
                    <button
                      onClick={() => setSignatureModalOpen(true)}
                      className="bg-sky-400 text-white px-5 py-3 rounded-lg hover:bg-sky-500 mx-auto mt-4 font-medium"
                    >
                      ASSINATURA
                    </button>
                  )}
                  {assinaturaConclusao && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => handleConcluir(true)}
                        className="bg-[#8BD15C] text-white px-5 py-3 rounded-lg hover:bg-[#5DA32E] font-medium"
                      >
                        Concluir
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => handleConcluir(false)}
                    className="bg-[#8BD15C] text-white px-6 py-3 rounded-lg hover:bg-[#5DA32E] font-medium"
                  >
                    Concluir ferramenta
                  </button>
                </div>
              )}

              {signatureModalOpen && (
                <ModalSignature
                  initialValue={assinaturaConclusao}
                  onSave={(dataURL) => {
                    setAssinaturaConclusao(dataURL);
                    setSignatureModalOpen(false);
                  }}
                  onClose={() => setSignatureModalOpen(false)}
                  forceRequired
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Overlay global de loading */}
      <LoadingOverlay show={loading} />
    </>
  );
}
