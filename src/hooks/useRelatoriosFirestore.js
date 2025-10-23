// src/hooks/useRelatoriosFirestore.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

/**
 * Hook unificado para relatórios com cache de 6h
 * @param {string} obra - Nome da obra
 * @param {string} searchTerm - Termo de busca
 * @param {"EM CAMPO"|"CONCLUIDO"} status - Filtra por estado do relatório
 */
export function useRelatorios(obra, searchTerm = "", status = "EM CAMPO") {
  const [relatorios, setRelatorios] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const CACHE_KEY = `relatorios_${obra}`;
  const CACHE_DURATION = 1000 * 60 * 60 * 6; // 6h

  useEffect(() => {
    if (!obra) return;

    let isMounted = true;

    const now = Date.now();

    // ===== 1. Ler cache =====
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached.timestamp && now - cached.timestamp < CACHE_DURATION) {
          setRelatorios(cached.data);
          applyFilter(cached.data, searchTerm);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Erro ao ler cache:", err);
      }
    }

    // ===== 2. Montar query Firestore =====
    let q;
    if (status === "EM CAMPO") {
      q = query(
        collection(db, "relatorios"),
        where("Obra", "==", obra),
        where("EstadoRel", "==", "EM CAMPO")
      );
    } else {
      // CONCLUIDO
      q = query(
        collection(db, "relatorios"),
        where("Obra", "==", obra)
      );
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!isMounted) return;

        let data = snap.docs.map((d) => {
          const docData = d.data();
          return {
            id: d.id,
            DataAberturaRel: docData.DataAberturaRel || "",
            DataConclusaoRel: docData.DataConclusaoRel || "",
            EstadoRel: docData.EstadoRel || "",
            NumRelatorio: docData.NumRelatorio || null,
            Funcionario: docData.Funcionario || "",
            Matricula: docData.Matricula || "",
            Obra: docData.Obra || "",
            Ferramentas: Array.isArray(docData.Ferramentas)
              ? docData.Ferramentas.map((f) => ({
                  Codigo: f.Codigo || "",
                  EstadoFer: f.EstadoFer || "",
                  Item: f.Item || "",
                  Observacao: f.Observacao || "",
                  Patrimonio: f.Patrimonio || "",
                  Serial: f.Serial || "",
                }))
              : [],
          };
        });

        // Filtra CONCLUIDO no cliente
        if (status === "CONCLUIDO") {
          data = data.filter((r) => r.EstadoRel !== "EM CAMPO");
        }

        // ===== 3. Atualiza estado e cache =====
        setRelatorios(data);
        applyFilter(data, searchTerm);
        setLoading(false);

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, data }));
        } catch (err) {
          console.warn("Erro ao salvar cache:", err);
        }
      },
      (err) => {
        if (!isMounted) return;
        console.error(err);
        setError("Erro ao sincronizar relatórios.");
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, [obra, status, searchTerm]);

  const applyFilter = (list, term) => {
    if (!term) {
      setFiltered(list);
      return;
    }

    const lower = term.toLowerCase();
    const filteredList = list.filter(
      (r) =>
        r.Funcionario?.toLowerCase().includes(lower) ||
        r.Ferramentas?.some(
          (f) =>
            f.Patrimonio?.toLowerCase().includes(lower) ||
            f.Serial?.toLowerCase().includes(lower) ||
            f.Item?.toLowerCase().includes(lower)
        )
    );
    setFiltered(filteredList);
  };

  return { relatorios, filtered, error, loading };
}