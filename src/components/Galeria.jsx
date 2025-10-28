// Galeria.jsx
import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function Galeria({ images, onClose }) {
  const [zoomedImage, setZoomedImage] = useState(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md w-full max-w-3xl p-4 max-h-[90vh] overflow-y-auto relative">

        {/* Cabeçalho */}
        <div className="flex justify-between pb-2 border-b border-zinc-300 items-center mb-2">
          <h2 className="text-xl font-semibold text-zinc-700">Fotos</h2>
          <button
            onClick={onClose}
            className="text-zinc-400/80 hover:text-zinc-600"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Grid de imagens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((imgObj, idx) => (
            <img
              key={idx}
              src={imgObj.imagemURL}
              alt={`Imagem ${idx + 1}`}
              className="w-full h-48 object-cover rounded-md border border-zinc-500 cursor-pointer"
              loading="lazy"
              onClick={() => setZoomedImage(imgObj.imagemURL)}
            />
          ))}
        </div>

        {/* Zoomed Image Overlay */}
        {zoomedImage && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-[90%] max-h-[90%]">
              <img
                src={zoomedImage}
                alt="Zoomed"
                className="w-full h-full object-contain rounded-md"
              />
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-3 right-3 text-white"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
