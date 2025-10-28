import { useState } from "react";
import { FaTrash, FaTimes } from "react-icons/fa";

export default function Detalhes({ observacao, setObservacao, photos, setPhotos }) {
  const [open, setOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const handleRemovePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index));

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
        <div className="p-3 space-y-3">
          {/* Observação */}
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-1">Observação</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full min-h-[75px] p-2 border bg-white border-zinc-300 rounded-md text-sm text-zinc-500/90 focus:outline-none focus:border-(--primaryfirst) resize-y"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-1">Fotos</label>

            {/* Botão que abre câmera nativa */}
            <label className="w-full bg-(--blue) text-white p-2 rounded-md hover:bg-(--bluedark) cursor-pointer text-center block">
              Tirar Foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setPhotos(prev => [...prev, reader.result]);
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            {photos.length > 0 && (
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
            className="text-sm text-zinc-500/90 mt-2 underline block mx-auto"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Preview */}
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
            className="max-h-100% max-w-100% md:max-h-[80%] md:max-w-[90%] object-contain rounded-md shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
