// src/hooks/useLoading.js
import { useState, useEffect } from "react";

/**
 * Hook para controlar estados de loading centralizados
 * Recebe um array de booleans (ex: [carregandoLogin, obraLoading])
 * e retorna true se algum deles estiver ativo
 */
export function useLoading(loadings = []) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(loadings.some((l) => l === true));
  }, [loadings]);

  return loading;
}
