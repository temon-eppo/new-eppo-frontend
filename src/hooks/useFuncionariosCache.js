// src/hooks/useFuncionariosCache.js
import { useState, useEffect } from "react";

const API_BASE = "https://backend-eppo-obras.onrender.com/api";

/**
 * Hook para carregar funcionários de uma obra com cache local e atualização automática.
 * @param {string} obra - Nome da obra.
 * @param {number} cacheHours - Quantas horas o cache deve durar (padrão 6h).
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

    const loadFuncionarios = async () => {
      try {
        const cachedRaw = localStorage.getItem(STORAGE_KEY);
        let cachedData = cachedRaw ? JSON.parse(cachedRaw) : null;
        let usedCache = false;

        // 1️⃣ Tenta usar cache se ainda válido
        if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
          setFuncionarios(cachedData.data);
          setLoading(false);
          usedCache = true;
        }

        // 2️⃣ Busca atualização em segundo plano
        const res = await fetch(`${API_BASE}/employees?obra=${encodeURIComponent(obra)}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const data = await res.json();
        const filtered = Array.isArray(data)
          ? data.filter((f) => f.GRUPODEF === obra)
          : [];

        // 3️⃣ Decide se deve atualizar cache
        let shouldUpdateCache =
          !cachedData ||
          filtered.length !== cachedData.data.length ||
          filtered.some((f) => !cachedData.data.find((c) => c.MATRICULA === f.MATRICULA));

        if (shouldUpdateCache) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: filtered })
          );
          setFuncionarios(filtered);
        }

        if (!usedCache) setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar funcionários:", err);
        setError(err);
        setLoading(false);
      }
    };

    loadFuncionarios();
  }, [obra, cacheHours]);

  return { funcionarios, loading, error };
}