import { useState, useMemo, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
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
    const isClickable = !overlayText && !anotherSelected;
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
      <p><span className="text-zinc-700 font-medium">Pat.</span> {f.patrimonio || "—"}</p>
      <p><span className="text-zinc-700 font-medium">Serial:</span> {f.serial || "—"}</p>
      <p className="line-clamp-1"><span className="text-zinc-700 font-medium">Item:</span> {f.item || "—"}</p>
      <p>
        <span className="text-zinc-700 font-medium mr-1">Devolução:</span> 
        {f.dataConclusaoFer?.toDate
          ? f.dataConclusaoFer.toDate().toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : f.dataConclusaoFer || "—"}
      </p>
      {f.observacao && (
        <p className="line-clamp-2"><span className="text-zinc-700 font-medium">Obs:</span> {f.observacao}</p>
      )}
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
  const userObra = localStorage.getItem("userObra");

  const pendingTools = useMemo(
    () => localRelatorio.ferramentas.filter(f => f.estadoFer !== "DEVOLVIDO" && f.estadoFer !== "EXTRAVIADO"),
    [localRelatorio.ferramentas]
  );

  const isLastTool =
    pendingTools.length === 1 &&
    selectedTool?.patrimonio === pendingTools[0].patrimonio &&
    selectedTool?.serial === pendingTools[0].serial;

  // ---------------- Buscar imagens do Storage ----------------
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const listRef = ref(storage, `relatorios_${userObra}/${relatorio.id}`);
        const res = await listAll(listRef);

        const urls = await Promise.all(
          res.items.map(itemRef => getDownloadURL(itemRef))
        );

        // Apenas imagemURL
        const imgObjs = urls.map(u => ({ imagemURL: u }));
        setStorageImages(imgObjs);
      } catch (err) {
        console.error("Erro ao buscar imagens do Storage:", err);
      }
    };
    fetchImages();
  }, [relatorio.id, userObra]);

  // ---------------- Reset ao selecionar ferramenta ----------------
  const handleToolSelect = f => {
    setSelectedTool(f);
    setObservacao(f.observacao || "");
    setPhotos([]);
    setAction(null);
    setShowCamera(false);
  };

  // ---------------- Upload de fotos ----------------
  const uploadPhotos = async () => {
    const uploadedObjs = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoRef = ref(storage, `relatorios_${userObra}/${localRelatorio.id}/${selectedTool.patrimonio}_${i}.png`);
      await uploadString(photoRef, photo, "data_url");
      const imagemURL = await getDownloadURL(photoRef);
      uploadedObjs.push({ imagemURL });
    }
    return uploadedObjs;
  };

  // ---------------- Concluir ferramenta / relatório ----------------
  const handleConcluir = async (isLastToolAction = false) => {
    if (!selectedTool || !localRelatorio.id) return;
    setConcluirLoading(true);
    try {
      const uploadedObjs = await uploadPhotos();
      const updatedFerramentas = localRelatorio.ferramentas.map(f =>
        f.patrimonio === selectedTool.patrimonio && f.serial === selectedTool.serial
          ? { ...f, estadoFer: action, dataConclusaoFer: Timestamp.fromDate(new Date()), observacao }
          : f
      );

      // Atualiza galeria do relatório
      const newGaleria = [...(localRelatorio.galeria || []), ...uploadedObjs];

      const updatePayload = {
        ferramentas: updatedFerramentas,
        galeria: newGaleria
      };

      if (isLastToolAction) {
        updatePayload.estadoRel = "CONCLUIDO";
        updatePayload.dataConclusaoRel = Timestamp.fromDate(new Date());
        updatePayload.assinaturaConclusao = assinaturaConclusao;
      }

      await updateDoc(doc(db, `relatorios_${userObra}`, localRelatorio.id), updatePayload);

      setLocalRelatorio(prev => ({ ...prev, ferramentas: updatedFerramentas, galeria: newGaleria }));

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

  // Bloqueio scroll do fundo
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-md w-full max-w-md sm:max-w-lg relative p-3 sm:p-6 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="flex justify-between border-b mb-2 border-zinc-300 pb-2">
            <h2 className="text-xl font-semibold text-zinc-700">Relatório #{localRelatorio.numRelatorio}</h2>
            <CloseButton />
          </div>

          {/* Info do relatório */}
          <div className="grid grid-cols-1 text-[15px] text-zinc-500/90 mb-2">
            <p><span className="text-zinc-700 font-medium">Funcionário:</span> {localRelatorio.funcionario}</p>
            <p><span className="text-zinc-700 font-medium">Status:</span> {localRelatorio.estadoRel}</p>
            <p>
                <span className="text-zinc-700 font-medium mr-1">Abertura:</span>
                {localRelatorio.dataAberturaRel?.toDate
                  ? localRelatorio.dataAberturaRel.toDate().toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : localRelatorio.dataAberturaRel || "—"}
            </p>
          </div>

          {/* Galeria botão */}
          {selectedTool === null && localRelatorio.galeria?.length > 0 && (
            <div className="flex justify-start mb-2">
              <button
                onClick={() => setGalleryOpen(true)}
                className="bg-(--purple) text-white p-2 rounded-md hover:bg-(--purpledark) text-md"
              >
                Galeria
              </button>
            </div>
          )}

          {/* Lista ferramentas */}
          <div className="mt-2 grid grid-cols-1 gap-2">
            {localRelatorio.ferramentas.map((f, idx) => (
              <FerramentaItem
                key={idx}
                f={f}
                onClick={() => handleToolSelect(f)}
                isSelected={selectedTool?.patrimonio === f.patrimonio && selectedTool?.serial === f.serial}
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

      {/* Galeria Modal */}
      {galleryOpen && (
        <Galeria
          images={localRelatorio.galeria || []}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Loading global */}
      <Loading loadings={[{ loading: concluirLoading, message: "Salvando relatório..." }]} />
    </>
  );
}
