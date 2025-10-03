import React from "react";

export default function LoadingOverlay({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-800/95 bg-opacity-80 backdrop-blur-sm">
      {/* Spinner minimalista */}
      <div className="w-16 h-16 border-4 border-[#E35A4D] border-t-transparent rounded-full animate-spin"></div>
      
      {/* Texto opcional */}
      <p className="mt-4 text-[#E35A4D] text-lg font-medium">
        Carregando...
      </p>
    </div>
  );
}
