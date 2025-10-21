// src/components/ImageGallery.jsx
import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

/**
 * Componente de galeria horizontal de imagens.
 * Recebe array de URLs de imagens.
 */
export default function ImageGallery({ images }) {
  const [modalImageIndex, setModalImageIndex] = useState(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Galeria horizontal */}
      <div className="mt-2 flex gap-2 py-2 overflow-x-auto">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Imagem ${idx + 1}`}
            className={`w-24 h-24 object-cover rounded-lg cursor-pointer flex-shrink-0 border-2 ${
              idx === modalImageIndex ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => setModalImageIndex(idx)}
          />
        ))}
      </div>

      {/* Modal da imagem em destaque */}
      {modalImageIndex !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-2">
          <img
            src={images[modalImageIndex]}
            alt={`Imagem ${modalImageIndex + 1}`}
            className="max-h-[90vh] max-w-full object-contain rounded-lg"
          />
          <button
            onClick={() => setModalImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
          >
            <FaTimes />
          </button>
        </div>
      )}
    </>
  );
}
