// hooks/useRelatorios.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export function useRelatorios(obra, searchTerm) {
  const [relatorios, setRelatorios] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!obra) return;

    const q = query(
      collection(db, "relatorios"),
      where("Obra", "==", obra),
      where("EstadoRel", "==", "EM CAMPO")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRelatorios(data);
        applyFilter(data, searchTerm);
      },
      (err) => {
        console.error(err);
        setError("Erro ao sincronizar relatórios.");
      }
    );

    return () => unsub();
  }, [obra, searchTerm]);

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

  return { relatorios, filtered, error };
}
