// src/components/Loading.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Componente de overlay de loading com priorização e transição suave
 * @param {{loading: boolean, message: string}[]} loadings - Lista de estados de loading
 */
function Loading({ loadings = [] }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  // 🔍 Pega o primeiro loading ativo (prioridade natural)
  const active = useMemo(() => loadings.find((l) => l.loading), [loadings]);

  useEffect(() => {
    let timeout;
    if (active) {
      setMessage(active.message || "Carregando...");
      // Pequeno delay para suavizar entrada
      timeout = setTimeout(() => setVisible(true), 100);
    } else {
      // Delay para evitar flicker (evita desaparecer instantaneamente)
      timeout = setTimeout(() => setVisible(false), 150);
    }
    return () => clearTimeout(timeout);
  }, [active]);

  if (!visible && !active) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100 bg-neutral-800/95 backdrop-blur-sm" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Spinner minimalista e performático */}
      <div className="w-16 h-16 border-4 border-[#E35A4D] border-t-transparent rounded-full animate-spin will-change-transform"></div>

      {/* Texto do loading ativo */}
      {visible && (
        <p className="mt-4 text-[#E35A4D] text-lg font-medium animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );
}

export default React.memo(Loading);