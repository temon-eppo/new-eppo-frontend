import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { FaTimes } from "react-icons/fa";

export function ModalSignature({ onClose, onSave, initialValue, forceRequired = false }) {
  const sigCanvas = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [hasSigned, setHasSigned] = useState(false);
  const [isInitialSignature, setIsInitialSignature] = useState(false);

  // Ajusta largura do canvas responsivamente
  useEffect(() => {
    const updateWidth = () => {
      const maxWidth = 400;
      const padding = 32;
      const w = Math.min(window.innerWidth - padding, maxWidth);
      setCanvasWidth(w);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Carrega assinatura inicial (se houver)
  useEffect(() => {
    if (sigCanvas.current && initialValue) {
      const img = new Image();
      img.src = initialValue;
      img.onload = () => {
        const ctx = sigCanvas.current.getCanvas().getContext("2d");
        ctx.clearRect(0, 0, sigCanvas.current.getCanvas().width, sigCanvas.current.getCanvas().height);
        ctx.drawImage(img, 0, 0, sigCanvas.current.getCanvas().width, sigCanvas.current.getCanvas().height);
        setHasSigned(true);
        setIsInitialSignature(true);
      };
    } else if (sigCanvas.current) {
      sigCanvas.current.clear();
      setHasSigned(false);
      setIsInitialSignature(false);
    }
  }, [initialValue]);

  // Marca como assinada ao desenhar
  const handleEnd = () => {
    if (!sigCanvas.current.isEmpty()) {
      setHasSigned(true);
      setIsInitialSignature(false);
    }
  };

  // Salva assinatura
  const handleSave = () => {
    if (!sigCanvas.current) return;
    if (forceRequired && !hasSigned) return;
    const dataURL = sigCanvas.current.toDataURL();
    onSave(dataURL);
  };

  // Limpa assinatura
  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setHasSigned(false);
      setIsInitialSignature(false);
    }
  };

  // Evita warning de passive listener no touchmove
  useEffect(() => {
    const canvas = sigCanvas.current?.getCanvas();
    if (!canvas) return;

    const touchMoveHandler = (e) => e.preventDefault();
    canvas.addEventListener("touchmove", touchMoveHandler, { passive: false });

    return () => canvas.removeEventListener("touchmove", touchMoveHandler);
  }, []);

  return (
    <div className="fixed inset-0 flex bg-black/90 items-center justify-center z-50 p-3">
      <div className="bg-(--backgroundfirst) p-3 rounded-md w-full max-w-md">
        {/* Cabeçalho */}
        <div className="flex justify-between pb-2 border-b border-zinc-300 items-center mb-2">
          <h2 className="text-xl font-semibold text-zinc-700">Assine abaixo</h2>
          <button onClick={onClose} className="text-zinc-400/80 hover:text-zinc-600">
            <FaTimes size={22} />
          </button>
        </div>

        {/* Área de assinatura */}
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          onEnd={handleEnd}
          canvasProps={{
            width: canvasWidth,
            height: 300,
            className: "border border-zinc-300 bg-white rounded-lg w-full focus:outline-none",
          }}
        />

        {/* Botões */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleClear}
            className="px-3 py-2 bg-(--purple) text-white font-medium rounded-md hover:bg-(--purpledark) transition-colors duration-200"
          >
            Limpar
          </button>
          <button
            onClick={handleSave}
            disabled={isInitialSignature || (forceRequired && !hasSigned)}
            className={`px-3 py-2 rounded-md text-white font-medium transition-colors duration-200 ${
              isInitialSignature || (forceRequired && !hasSigned)
                ? "bg-zinc-400 cursor-not-allowed"
                : "bg-(--green) hover:bg-(--greendark)"
            }`}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
