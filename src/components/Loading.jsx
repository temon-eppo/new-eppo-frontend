// src/components/Loading.jsx
import React, { useEffect, useState } from "react";

/**
 * Componente que gerencia múltiplos estados de loading e exibe overlay
 * @param {{loading: boolean, message: string}[]} loadings - Array de objetos com loading e mensagem
 */
export default function Loading({ loadings = [] }) {
  const [activeMessage, setActiveMessage] = useState("");

  useEffect(() => {
    // Prioriza o primeiro loading que estiver ativo
    const active = loadings.find(l => l.loading);
    if (active) {
      setActiveMessage(active.message);
    } else {
      // Delay pequeno para deixar a transição suave
      const timeout = setTimeout(() => setActiveMessage(""), 150);
      return () => clearTimeout(timeout);
    }
  }, [loadings]);

  if (!activeMessage) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-800/95 backdrop-blur-sm transition-opacity duration-300">
      {/* Spinner minimalista */}
      <div className="w-16 h-16 border-4 border-[#E35A4D] border-t-transparent rounded-full animate-spin"></div>

      {/* Texto do loading ativo */}
      <p className="mt-4 text-[#E35A4D] text-lg font-medium transition-opacity duration-300">
        {activeMessage}
      </p>
    </div>
  );
}