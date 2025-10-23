// src/components/Camera.jsx
import { useRef, useEffect } from "react";

export default function Camera({ photos, setPhotos, showCamera, setShowCamera }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (showCamera && inputRef.current) {
      inputRef.current.click(); // abre automaticamente a câmera traseira
    }
  }, [showCamera]);

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // só pega a primeira foto

    if (!file) {
      setShowCamera(false);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string" && result.startsWith("data:")) {
        setPhotos((prev) => [...prev, result]); // adiciona ao estado
      } else {
        console.error("Arquivo não é um Data URL válido");
      }
      setShowCamera(false); // fecha o modal automaticamente após tirar a foto
    };
    reader.readAsDataURL(file);

    e.target.value = ""; // limpa input
  };

  if (!showCamera) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        ref={inputRef}
        className="hidden"
      />
    </div>
  );
}
