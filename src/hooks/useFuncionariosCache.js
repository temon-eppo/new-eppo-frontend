// src/hooks/useFuncionariosCache.js
import { useState, useEffect } from "react";

const API_BASE = "https://backend-eppo-obras.onrender.com/api";

/**
 * Hook para carregar funcionários de uma obra com cache local e atualização automática.
 * Usa cache instantâneo e atualização em segundo plano.
 */
export function useFuncionariosCache(obra, cacheHours = 6) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!obra) {
      setLoading(false);
      return;
    }

    const STORAGE_KEY = `funcionarios_${obra}`;
    const CACHE_DURATION = 1000 * 60 * 60 * cacheHours;
    const now = Date.now();

    const normalizeObra = (f) =>
      f?.OBRA || f?.Obra || f?.obra || f?.GRUPODEF || "";

    const loadFromCache = () => {
      try {
        const cachedRaw = localStorage.getItem(STORAGE_KEY);
        if (!cachedRaw) return null;

        const cached = JSON.parse(cachedRaw);
        if (now - cached.timestamp < CACHE_DURATION && Array.isArray(cached.data)) {
          setFuncionarios(cached.data);
          setLoading(false);
          return cached;
        }
      } catch (err) {
        console.warn("Erro ao ler cache de funcionários:", err);
      }
      return null;
    };

    const fetchFromAPI = async (cached) => {
      try {
        const res = await fetch(`${API_BASE}/employees?obra=${encodeURIComponent(obra)}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        // 🔍 Filtra exatamente por obra
        const filtered = arr.filter((f) => normalizeObra(f).trim() === obra.trim());

        if (filtered.length === 0) {
          console.warn(`[useFuncionariosCache] Nenhum funcionário encontrado para obra "${obra}".`);
        }

        // ⚙️ Atualiza cache se mudou
        const shouldUpdate =
          !cached ||
          filtered.length !== cached.data.length ||
          filtered.some((f) => !cached.data.find((c) => c.MATRICULA === f.MATRICULA));

        if (shouldUpdate) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: filtered })
          );
          setFuncionarios(filtered);
        }

        if (!cached) setLoading(false);
      } catch (err) {
        console.error("Erro ao buscar funcionários:", err);
        setError(err);
        setLoading(false);
      }
    };

    const cached = loadFromCache();
    fetchFromAPI(cached);

    if (!cached) setLoading(true);
  }, [obra, cacheHours]);

  return { funcionarios, loading, error };
}