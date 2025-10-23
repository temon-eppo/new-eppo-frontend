// src/hooks/useFerramentasCache.js
import { useState, useEffect } from "react";

const API_BASE = "https://backend-eppo-obras.onrender.com/api";

/**
 * Hook para carregar ferramentas de uma obra com cache local e atualização automática.
 * @param {string} obra - Nome da obra
 * @param {number} cacheHours - Quantas horas o cache deve durar (padrão 2h)
 */
export function useFerramentasCache(obra, cacheHours = 2) {
  const [ferramentas, setFerramentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!obra) {
      setLoading(false);
      return;
    }

    const STORAGE_KEY = `ferramentas_${obra}`;
    const CACHE_DURATION = 1000 * 60 * 60 * cacheHours;
    const now = Date.now();

    const loadFerramentas = async () => {
      try {
        const cachedRaw = localStorage.getItem(STORAGE_KEY);
        let cachedData = cachedRaw ? JSON.parse(cachedRaw) : null;
        let usedCache = false;

        // 1️⃣ Usa cache se ainda válido
        if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
          setFerramentas(cachedData.data);
          setLoading(false);
          usedCache = true;
        }

        // 2️⃣ Busca atualização em background
        const res = await fetch(`${API_BASE}/ferramentas?obra=${encodeURIComponent(obra)}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const data = await res.json();
        const tools = Array.isArray(data) ? data : [];

        // 3️⃣ Atualiza cache se necessário
        let shouldUpdateCache =
          !cachedData ||
          tools.length !== cachedData.data.length ||
          tools.some((f) => !cachedData.data.find((c) => c.PATRIMONIO === f.PATRIMONIO));

        if (shouldUpdateCache) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: tools })
          );
          setFerramentas(tools);
        }

        if (!usedCache) setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar ferramentas:", err);
        setError(err);
        setLoading(false);
      }
    };

    loadFerramentas();
  }, [obra, cacheHours]);

  return { ferramentas, loading, error };
}