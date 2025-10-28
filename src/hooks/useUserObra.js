// hooks/useUserObra.js
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export function useUserObra() {
  const [user, setUser] = useState(null);
  const [obra, setObra] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); 

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
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userNome");
        setLoading(false);
        return;
      }

      // Salva email e nome no localStorage
      if (u.email) localStorage.setItem("userEmail", u.email);
      if (u.displayName) localStorage.setItem("userNome", u.displayName);

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

          // Salva nome do Firestore caso não tenha displayName
          if (!u.displayName && data.nome) localStorage.setItem("userNome", data.nome);
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