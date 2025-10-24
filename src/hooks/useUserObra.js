// hooks/useUserObra.js
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export function useUserObra() {
  const [user, setUser] = useState(null);       // Usuário Firebase
  const [obra, setObra] = useState(null);       // Obra do usuário
  const [role, setRole] = useState(null);       // Role do usuário
  const [error, setError] = useState(null);     // Erro ao buscar dados
  const [loading, setLoading] = useState(true); // Loading do hook

  useEffect(() => {
    let isMounted = true;
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!isMounted) return;
      setUser(u);
      setLoading(true);
      setError(null);

      if (!u) {
        setObra(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // Primeiro tenta pegar do localStorage
      const localObra = localStorage.getItem("userObra");
      const localRole = localStorage.getItem("userRole");
      if (localObra && localRole) {
        setObra(localObra);
        setRole(localRole);
        setLoading(false);
        return;
      }

      // Caso não tenha no cache, busca no Firestore
      try {
        const userSnap = await getDoc(doc(db, "users", u.uid));
        if (!isMounted) return;

        if (userSnap.exists()) {
          const data = userSnap.data();
          setObra(data.obra || null);
          setRole(data.role || null);

          if (data.obra) localStorage.setItem("userObra", data.obra);
          if (data.role) localStorage.setItem("userRole", data.role);
        } else {
          setError("Dados do usuário não encontrados.");
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados do usuário.");
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { user, obra, role, error, loading };
}