// src/hooks/useFuncionariosCache.js
import { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const API_BASE = "https://backend-eppo-obras--eppo-obras-aef61.us-east4.hosted.app/api";

export function useFuncionariosCache() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const db = getFirestore();
  const obra = localStorage.getItem("userObra") || "";
  const STORAGE_KEY = `funcionarios_${obra}`;

  useEffect(() => {
    const syncCache = async () => {
      if (!obra || navigator.onLine === false) return;

      try {
        // Recupera log do Firestore
        const logRef = doc(db, "logs", "employees");
        const logSnap = await getDoc(logRef);
        if (!logSnap.exists()) return;

        const { lastUpdate } = logSnap.data();
        if (!lastUpdate) return;

        const lastSyncEmployees = localStorage.getItem("lastSyncEmployees");
        if (lastSyncEmployees && lastSyncEmployees === lastUpdate) return; // nada a fazer

        // ==================== BUSCA DADOS DA API ====================
        setLoading(true);
        const res = await fetch(`${API_BASE}/employees`); // pega todos
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) return;

        // Filtra apenas funcionários da obra atual
        const filtered = data.filter(f => f.GRUPODEF === obra);

        // ==================== ATUALIZA CACHE ====================
        setFuncionarios(filtered);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        localStorage.setItem("lastSyncEmployees", lastUpdate);

        console.log(`✅ Cache funcionários atualizado - ${filtered.length} itens para obra ${obra}`);
      } catch (err) {
        console.warn("Não foi possível sincronizar o cache de funcionários:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    // ==================== CARREGA CACHE LOCAL ====================
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setFuncionarios(parsed);
      } catch {
        // ignora se der erro
      }
    }

    syncCache();
  }, [db, obra, STORAGE_KEY]);

  return { funcionarios, loading, error };
}