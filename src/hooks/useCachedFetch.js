// src/hooks/useCachedFetch.js
import { useState, useEffect } from "react";

export function useCachedFetch(cacheKey, url, expirationMs = 24 * 60 * 60 * 1000) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url || !cacheKey) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const now = Date.now();
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { dados, timestamp } = JSON.parse(cached);
          if (Array.isArray(dados) && now - timestamp < expirationMs) {
            setData(dados);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Erro ao ler cache:", err);
        }
      }

      // Cache expirado ou inexistente, faz fetch
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erro ao buscar dados da API");
        const json = await res.json();

        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify({ dados: json, timestamp: now }));
      } catch (err) {
        setError(err.message || "Erro desconhecido");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [cacheKey, url, expirationMs]);

  return { data, isLoading, error };
}
