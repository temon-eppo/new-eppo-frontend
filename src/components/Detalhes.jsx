// src/components/Detalhes.jsx
import { useState } from "react";
import { FaTrash, FaTimes } from "react-icons/fa";
import Camera from "./Camera";

export default function Detalhes({
  observacao,
  setObservacao,
  photos,
  setPhotos,
  showCamera,
  setShowCamera,
}) {
  const [open, setOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null); // foto aberta em tela cheia

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setPhotos((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
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

          {/* Upload de fotos */}
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
                      onClick={() => setPreviewPhoto(p)} // abre a foto em tela cheia
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

          {/* Camera */}
          <Camera
            photos={photos}
            setPhotos={setPhotos}
            showCamera={showCamera}
            setShowCamera={setShowCamera}
          />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-zinc-500/90 mt-4 underline block mx-auto"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Modal de visualização de foto */}
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
            className="max-h-[100%] max-w-[100%]  md:max-h-[80%] md:max-w-[90%] object-contain rounded-md shadow-lg"
          />
        </div>
      )}
    </div>
  );
}