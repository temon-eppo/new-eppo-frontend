// src/hooks/useFerramentasCache.js
import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const API_BASE = "https://backend-eppo-obras--eppo-obras-aef61.us-east4.hosted.app/api";

export function useFerramentasCache() {
  const [cache, setCache] = useState({ all: [] }); // armazena todas as ferramentas
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const db = getFirestore();

  // ==================== SINCRONIZAÇÃO INICIAL ====================
  useEffect(() => {
    const syncCache = async () => {
      try {
        if (!navigator.onLine) return; // offline, não faz nada

        const logRef = doc(db, "logs", "tools");
        const logSnap = await getDoc(logRef);
        if (!logSnap.exists()) return;

        const { lastUpdate } = logSnap.data();
        if (!lastUpdate) return;

        const lastSyncTools = localStorage.getItem("lastSyncTools");
        if (lastSyncTools && lastSyncTools === lastUpdate) return; // já sincronizado

        setLoading(true);

        // ==================== BUSCA TODAS AS FERRAMENTAS ====================
        const res = await fetch(`${API_BASE}/ferramentas`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
        const data = await res.json();

        // ==================== ATUALIZA CACHE ====================
        setCache({ all: data });

        // ==================== ATUALIZA LOCALSTORAGE ====================
        localStorage.setItem("lastSyncTools", lastUpdate);
        localStorage.setItem("ferramentas_all", JSON.stringify(data)); // <- NOVO
        console.log(`✅ Cache ferramentas atualizado - lastUpdate: ${lastUpdate}`);
      } catch (err) {
        console.warn("Não foi possível sincronizar o cache de ferramentas:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    syncCache();
  }, [db]);

  return { cache, loading, error };
}