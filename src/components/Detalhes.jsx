// src/components/Detalhes.jsx
import { useState, useRef, useEffect } from "react";
import { FaTrash, FaTimes } from "react-icons/fa";

export default function Detalhes({ observacao, setObservacao, photos, setPhotos }) {
  const [open, setOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null); // foto em tela cheia
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  // abre automaticamente a câmera
  useEffect(() => {
    if (showCamera && inputRef.current) {
      inputRef.current.click();
    }
  }, [showCamera]);

  const closeCamera = () => {
    setShowCamera(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      closeCamera();
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string" && result.startsWith("data:")) {
        setPhotos((prev) => [...prev, result]);
      }
      closeCamera();
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-(--backgroundfirst) border border-zinc-300 rounded-md mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-zinc-700 font-medium text-center py-1 rounded-lg hover:bg-zinc-400 transition"
        >
          Detalhes ▼
        </button>
      ) : (
        <div className="p-2 space-y-2">
          {/* Observação */}
          <div>
            <label className="block ml-0.5 text-zinc-700 text-[15px] font-medium">
              Digite uma observação...
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full min-h-[75px] p-2 border bg-white border-zinc-300
                         rounded-md text-zinc-500/90 text-[15px]
                         focus:outline-none focus:border focus:border-(--primaryfirst)
                         resize-y"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="block ml-0.5 text-zinc-700 text-[15px] font-medium">
              Fotos
            </label>

            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full bg-(--blue) text-white p-2 rounded-md hover:bg-(--bluedark) transition font-medium"
            >
              Abrir Câmera
            </button>

            {photos && photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={p}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-20 object-cover rounded-md border border-zinc-400 cursor-pointer"
                      onClick={() => setPreviewPhoto(p)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-white text-(--red) p-1 rounded-full"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-zinc-500/90 mt-4 underline block mx-auto"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Camera */}
      {showCamera && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={closeCamera}
        >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            ref={inputRef}
            className="hidden"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeCamera();
            }}
            className="absolute top-4 right-4 text-white text-2xl bg-black/50 rounded-full p-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Preview de foto */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3">
          <button
            onClick={() => setPreviewPhoto(null)}
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:text-(--primaryfirst) transition"
          >
            <FaTimes size={25} />
          </button>
          <img
            src={previewPhoto}
            alt="Preview"
            className="max-h-[100%] max-w-[100%] md:max-h-[80%] md:max-w-[90%] object-contain rounded-md shadow-lg"
          />
        </div>
      )}
    </div>
  );
}