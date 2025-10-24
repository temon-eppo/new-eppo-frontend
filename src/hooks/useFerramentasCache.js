// src/hooks/useFerramentasCache.js
import { useState, useEffect } from "react";

const API_BASE = "https://backend-eppo-obras.onrender.com/api";

/**
 * Hook para carregar ferramentas de uma obra com cache local e atualização automática.
 * Usa cache instantâneo e atualiza em segundo plano.
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

    // ✅ 1. Tenta carregar do cache imediatamente
    const loadFromCache = () => {
      try {
        const cachedRaw = localStorage.getItem(STORAGE_KEY);
        if (!cachedRaw) return null;

        const cached = JSON.parse(cachedRaw);
        if (now - cached.timestamp < CACHE_DURATION && Array.isArray(cached.data)) {
          setFerramentas(cached.data);
          setLoading(false);
          return cached;
        }
      } catch (err) {
        console.warn("Erro ao ler cache de ferramentas:", err);
      }
      return null;
    };

    // 🔄 2. Atualiza em segundo plano
    const fetchFromAPI = async (cached) => {
      try {
        const res = await fetch(`${API_BASE}/ferramentas?obra=${encodeURIComponent(obra)}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const data = await res.json();
        const tools = Array.isArray(data) ? data : [];

        // ⚙️ 3. Atualiza cache apenas se houver diferenças
        const shouldUpdate =
          !cached ||
          tools.length !== cached.data.length ||
          tools.some((f) => !cached.data.find((c) => c.PATRIMONIO === f.PATRIMONIO));

        if (shouldUpdate) {
          setFerramentas(tools);
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: tools })
          );
        }
      } catch (err) {
        console.error("Erro ao carregar ferramentas:", err);
        setError(err);
      } finally {
        if (!ferramentas.length) setLoading(false);
      }
    };

    const cached = loadFromCache();
    fetchFromAPI(cached);

    // Se não havia cache, mantém "loading" até resposta da API
    if (!cached) setLoading(true);
  }, [obra, cacheHours]);

  return { ferramentas, loading, error };
}