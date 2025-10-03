// src/components/Detalhes.jsx
import { useState } from "react";
import { FaTrash } from "react-icons/fa";
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
    <div className="bg-zinc-200 rounded-lg mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-zinc-600 font-medium text-center py-1 rounded-lg hover:bg-zinc-400 transition"
        >
          Detalhes ▼
        </button>
      ) : (
        <div className="p-2 space-y-3">
          {/* Observação */}
          <div>
            <label className="block text-zinc-600 text-md font-semibold">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Escreva uma observação..."
              className="w-full min-h-[75px] p-1 border-2 bg-white border-zinc-300
                         rounded-lg text-stone-500 text-[15px]
                         focus:outline-none focus:border-2 focus:border-(--primary)
                         resize-y"
            />
          </div>

          {/* Upload de fotos */}
          <div>
            <label className="block text-zinc-600 text-md font-semibold mb-1">
              Fotos
            </label>

            {/* Abrir câmera */}
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="mt-2 w-full bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition font-medium"
            >
              Abrir Câmera
            </button>

            {/* Galeria de fotos */}
            {photos && photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={p}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100"
                    >
                      <FaTrash size={14} />
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
            className="text-sm text-zinc-500 mt-2 underline block mx-auto"
          >
            Ocultar
          </button>
        </div>
      )}
    </div>
  );
}
