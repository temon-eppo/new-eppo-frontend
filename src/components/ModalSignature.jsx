import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { FaTimes } from "react-icons/fa";

export function ModalSignature({ onClose, onSave, initialValue, forceRequired = false }) {
  const sigCanvas = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [hasSigned, setHasSigned] = useState(false);
  const [isInitialSignature, setIsInitialSignature] = useState(false);

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

  const handleEnd = () => {
    if (!sigCanvas.current.isEmpty()) {
      setHasSigned(true);
      setIsInitialSignature(false);
    }
  };

  const handleSave = () => {
    if (!sigCanvas.current) return;
    if (forceRequired && sigCanvas.current.isEmpty()) {
      alert("É obrigatório assinar para concluir.");
      return;
    }
    const dataURL = sigCanvas.current.toDataURL();
    onSave(dataURL);
  };

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setHasSigned(false);
      setIsInitialSignature(false);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-black/85 items-center justify-center z-50 p-3">
      <div className="bg-neutral-100 p-3 rounded-xl w-full max-w-md">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-neutral-600">Assine abaixo</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-500">
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
            height: 200,
            className: "border-2 border-neutral-300 bg-white rounded-lg w-full focus:outline-none",
          }}
        />

        {/* Botões */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-violet-400 text-white rounded-lg hover:bg-violet-500 transition-colors duration-200"
          >
            Limpar
          </button>
          <button
            onClick={handleSave}
            disabled={isInitialSignature || (forceRequired && !hasSigned)}
            className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
              isInitialSignature || (forceRequired && !hasSigned)
                ? "bg-neutral-400 cursor-not-allowed"
                : "bg-[#7EBA4A] hover:bg-[#709E49]"
            }`}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
