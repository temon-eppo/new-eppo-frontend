// hooks/useUserObra.js
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export function useUserObra() {
  const [obra, setObra] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setError(null);

      if (!user) {
        setObra(null);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setObra(userData.obra || null);
          setRole(userData.role || null);

          if (userData.obra) localStorage.setItem("userObra", userData.obra);
          if (userData.role) localStorage.setItem("userRole", userData.role);
        } else {
          setError("Dados do usuário não encontrados.");
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados do usuário.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { obra, role, error, loading };
}
