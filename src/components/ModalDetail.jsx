import { useState, useMemo, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadString, getDownloadURL, listAll } from "firebase/storage";
import Detalhes from "./Detalhes";
import { ModalSignature } from "./ModalSignature";
import Loading from "./Loading";
import Galeria from "./Galeria";

// ---------------- FerramentaItem ----------------
function FerramentaItem({ f, onClick, isSelected, anotherSelected }) {
  const { overlayText, overlayBg, border, opacity, cursor, clickable } = (() => {
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
    const isClickable = !overlayText;
    const border = isSelected ? "border border-zinc-500" : "border border-zinc-300";
    const opacity = overlayText ? "opacity-40" : anotherSelected && !isSelected ? "opacity-40" : "opacity-100";
    const cursor = isClickable ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed";
    return { overlayText, overlayBg, border, opacity, cursor, clickable: isClickable };
  })();

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`relative flex flex-col text-sm text-zinc-500 bg-[#eeeeee] p-2 rounded-lg ${border} ${opacity} ${cursor} transition-colors duration-200`}
    >
      {overlayText && (
        <span className={`absolute top-2 right-2 p-1 text-xs font-semibold rounded ${overlayBg}`}>
          {overlayText}
        </span>
      )}
      <p className="text-zinc-500/90"><span className="text-zinc-700 font-medium">Pat.</span> {f.Patrimonio || "—"}</p>
      <p className="text-zinc-500/90"><span className="text-zinc-700 font-medium">Serial:</span> {f.Serial || "—"}</p>
      <p className="text-zinc-500/90 line-clamp-1"><span className="text-zinc-700 font-medium">Item:</span> {f.Item || "—"}</p>
      <p className="text-zinc-500/90"><span className="text-zinc-700 font-medium">Devolução:</span> {f.DataConclusaoFer || "—"}</p>
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
  const [storageImages, setStorageImages] = useState([]);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const navigate = useNavigate();
  const anotherSelected = selectedTool !== null;

  const pendingTools = useMemo(
    () => localRelatorio.Ferramentas.filter(f => f.EstadoFer !== "DEVOLVIDO" && f.EstadoFer !== "EXTRAVIADO"),
    [localRelatorio.Ferramentas]
  );

  const isLastTool =
    pendingTools.length === 1 &&
    selectedTool?.Patrimonio === pendingTools[0].Patrimonio &&
    selectedTool?.Serial === pendingTools[0].Serial;

  // ---------------- Buscar todas as imagens do Storage automaticamente ----------------
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const listRef = ref(storage, `relatorios/${relatorio.id}`);
        const res = await listAll(listRef);

        const urls = await Promise.all(
          res.items.map((itemRef) => getDownloadURL(itemRef))
        );

        setStorageImages(urls);
      } catch (err) {
        console.error("Erro ao buscar imagens do Storage:", err);
      }
    };

    fetchImages();
  }, [relatorio.id]);

  // ---------------- Reset de observação/fotos ao trocar de ferramenta ----------------
  const handleToolSelect = (f) => {
    setSelectedTool(f);
    setObservacao("");
    setPhotos([]);
    setAction(null);
    setShowCamera(false);
  };

  // ---------------- Helpers ----------------
  const uploadPhotos = async () => {
    return Promise.all(
      photos.map(async (photo, i) => {
        const photoRef = ref(storage, `relatorios/${localRelatorio.id}/${selectedTool.Patrimonio}_${i}.png`);
        await uploadString(photoRef, photo, "data_url");
        return getDownloadURL(photoRef);
      })
    );
  };

  const updateFerramentas = (uploadedUrls) =>
    localRelatorio.Ferramentas.map(f =>
      f.Patrimonio === selectedTool.Patrimonio && f.Serial === selectedTool.Serial
        ? { ...f, EstadoFer: action, DataConclusaoFer: new Date().toISOString(), Observacao: observacao, ImagemURL: uploadedUrls }
        : f
    );

  const handleConcluir = async (isLastToolAction = false) => {
    if (!selectedTool) return;
    setConcluirLoading(true);
    try {
      const uploadedUrls = await uploadPhotos();
      const updatedFerramentas = updateFerramentas(uploadedUrls);
      setLocalRelatorio(prev => ({ ...prev, Ferramentas: updatedFerramentas }));

      const updatePayload = { Ferramentas: updatedFerramentas };
      if (isLastToolAction) {
        updatePayload.EstadoRel = action;
        updatePayload.DataConclusaoRel = new Date().toISOString();
        updatePayload.AssinaturaConclusao = assinaturaConclusao;
        updatePayload.Observacao = observacao;
      }

      await updateDoc(doc(db, "relatorios", relatorio.id), updatePayload);

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
      className="flex justify-center items-center text-zinc-400/50 hover:text-zinc-600"
    >
      <FaTimes className="text-xl" />
    </button>
  );

  // ---------------- Bloqueio do scroll do fundo ----------------
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-md w-full max-w-md sm:max-w-lg relative p-3 sm:p-6 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="flex justify-between border-b mb-2 border-zinc-300 pb-2">
            <h2 className="text-xl font-semibold text-zinc-700">
              Relatório #{localRelatorio.NumRelatorio}
            </h2>
            <CloseButton />
          </div>

          {/* Info do relatório */}
          <div className="grid grid-cols-1 text-[15px] text-zinc-500/90 mb-2">
            <p><span className="text-zinc-700 font-medium">Funcionário:</span> {localRelatorio.Funcionario}</p>
            <div className="flex flex-row justify-between">
              <p><span className="text-zinc-700 font-medium">Status:</span> {localRelatorio.EstadoRel}</p>
              <p><span className="text-zinc-700 font-medium">Abertura:</span> {localRelatorio.DataAberturaRel}</p>
            </div>
          </div>

          {/* Botão abrir Galeria */}
          {selectedTool === null && storageImages.length > 0 && (
            <div className="flex justify-start mb-2">
              <button
                onClick={() => setGalleryOpen(true)}
                className="bg-(--purple) text-white p-2 rounded-md hover:bg-(--purpledark) text-md"
              >
                Galeria
              </button>
            </div>
          )}

          {/* Lista de ferramentas */}
          <div className="mt-2 grid grid-cols-1 gap-2">
            {localRelatorio.Ferramentas.map((f, idx) => (
              <FerramentaItem
                key={idx}
                f={f}
                onClick={() => handleToolSelect(f)}
                isSelected={selectedTool?.Patrimonio === f.Patrimonio && selectedTool?.Serial === f.Serial}
                anotherSelected={anotherSelected}
              />
            ))}
          </div>

          {/* Ação DEVOLVER / EXTRAVIADO */}
          {selectedTool && !action && (
            <div className="flex flex-row gap-2 justify-center mt-2">
              <button
                onClick={() => setAction("DEVOLVIDO")}
                disabled={concluirLoading}
                className={`flex-1 bg-(--green) text-white p-2 rounded-md hover:bg-(--greendark) font-medium ${concluirLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {concluirLoading ? "Processando..." : "DEVOLVER"}
              </button>
              <button
                onClick={() => setAction("EXTRAVIADO")}
                disabled={concluirLoading}
                className={`flex-1 bg-(--red) text-white p-2 rounded-md hover:bg-(--reddark) font-medium ${concluirLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {concluirLoading ? "Processando..." : "EXTRAVIO"}
              </button>
            </div>
          )}

          {/* Detalhes e concluir */}
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
                      className="bg-(--purple) text-white p-2 rounded-md hover:bg-(--purpledark) mx-auto mt-4 font-medium"
                    >
                      Assinatura
                    </button>
                  )}
                  {assinaturaConclusao && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => handleConcluir(true)}
                        className="bg-(--green) text-white px-5 py-2 rounded-md hover:bg-(--greendark) font-medium"
                      >
                        Concluir
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => handleConcluir(false)}
                    className="bg-(--green) text-white p-3 rounded-md hover:bg-(--greendark) font-medium"
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

      {/* Modal da Galeria */}
      {galleryOpen && (
        <Galeria
          images={storageImages}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Loading global */}
      <Loading loadings={[concluirLoading]} />
    </>
  );
}