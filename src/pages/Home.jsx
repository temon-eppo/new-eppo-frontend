// src/pages/Home.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaFilter } from "react-icons/fa";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { ModalDetail } from "../components/ModalDetail";
import { RelatorioCard } from "../components/RelatorioCard";
import Loading from "../components/Loading";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Converte Firestore Timestamp ou cache local → Date
function parseBrazilianDate(dateInput) {
  if (!dateInput) return null;

  if (typeof dateInput.toDate === "function") return dateInput.toDate();
  if (dateInput?.type === "firestore/timestamp/1.0" && typeof dateInput.seconds === "number") {
    return new Date(dateInput.seconds * 1000 + Math.floor((dateInput.nanoseconds || 0) / 1e6));
  }
  if (dateInput instanceof Date) return dateInput;

  if (typeof dateInput === "string") {
    const [datePart, timePart = "00:00:00"] = dateInput.split(" às ")[0].split(" ");
    const match = datePart.match(/(\d+)\D+(\d+)?\D+(\d+)/);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2] || 1) - 1;
      const year = Number(match[3]);
      const [hours, minutes, seconds] = timePart.split(":").map(Number);
      const jsDate = new Date(year, month, day, hours, minutes, seconds);
      return isNaN(jsDate.getTime()) ? null : jsDate;
    }
  }

  return null;
}

// Retorna status e cor do relatório
function getRelatorioStatus(dataAbertura) {
  const data = parseBrazilianDate(dataAbertura);
  if (!data) return { dias: null, status: "—", color: "border-zinc-400" };

  const hoje = new Date();
  let diffDays = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) diffDays = 0;

  let status = "NO PRAZO";
  let color = "border-(--green)";
  if (diffDays >= 14) {
    status = "CRÍTICO";
    color = "border-(--red)";
  } else if (diffDays >= 7) {
    status = "ATRASADO";
    color = "border-(--yellow)";
  }

  return { dias: diffDays, status, color };
}

// Formata data para DD/MM/YYYY
function formatDate(dateInput) {
  const date = parseBrazilianDate(dateInput);
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR");
}

export default function Home() {
  const navigate = useNavigate();
  const obra = localStorage.getItem("userObra") || "";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", dataInicial: "", dataFinal: "" });
  const [showFilter, setShowFilter] = useState(false);
  const [relatorios, setRelatorios] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);

  // ------------------- DEBOUNCE SEARCH -------------------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ------------------- FETCH COM CACHE + LEITURA ÚNICA -------------------
  useEffect(() => {
    if (!obra) return;

    const cacheKey = `relatorios_${obra}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setRelatorios(parsed);
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    const colRef = collection(db, cacheKey);
    const q = query(colRef, where("estadoRel", "==", "ABERTO"));

    // 🔹 Leitura única inicial
    const fetchOnce = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRelatorios(docs);
        localStorage.setItem(cacheKey, JSON.stringify(docs));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchOnce();

    // 🔹 Listener opcional para alterações (somente docs modificados/adicionados/removidos)
    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        setRelatorios(prev => {
          const prevWithout = prev.filter(r => r.id !== change.doc.id);
          if (change.type === "removed") return prevWithout;
          return [...prevWithout, { id: change.doc.id, ...change.doc.data() }];
        });
      });
    });

    return () => unsubscribe();
  }, [obra]);

  // ------------------- TOGGLE FILTER -------------------
  const toggleFilter = useCallback(() => {
    if (showFilter) setFilters({ status: "", dataInicial: "", dataFinal: "" });
    setShowFilter(prev => !prev);
  }, [showFilter]);

  const filtersActive = Object.values(filters).some(Boolean);

  // ------------------- FILTROS + BUSCA -------------------
  const filteredRelatorios = useMemo(() => {
    const lowerSearch = debouncedSearch.toLowerCase();

    const filtered = relatorios.filter(rel => {
      // Busca
      const matchesSearch =
        !lowerSearch ||
        rel.funcionario?.toLowerCase().includes(lowerSearch) ||
        rel.ferramentas?.some(
          f =>
            f.patrimonio?.toLowerCase().includes(lowerSearch) ||
            f.serial?.toLowerCase().includes(lowerSearch) ||
            f.item?.toLowerCase().includes(lowerSearch)
        );
      if (!matchesSearch) return false;

      // Status
      const { status } = getRelatorioStatus(rel.dataAberturaRel);
      if (filters.status && filters.status !== status) return false;

      // Datas
      const dataAbertura = parseBrazilianDate(rel.dataAberturaRel);
      if (filters.dataInicial) {
        const start = new Date(filters.dataInicial + "T00:00:00");
        if (dataAbertura < start) return false;
      }
      if (filters.dataFinal) {
        const end = new Date(filters.dataFinal + "T23:59:59");
        if (dataAbertura > end) return false;
      }

      return true;
    });

    return filtered.sort(
      (a, b) => parseBrazilianDate(b.dataAberturaRel) - parseBrazilianDate(a.dataAberturaRel)
    );
  }, [relatorios, debouncedSearch, filters]);

  const visibleRelatorios = filteredRelatorios.slice(0, visibleCount);

  return (
    <div className="font-display relative min-h-screen bg-(--backgroundfirst) flex flex-col">
      <NavBar />
      <Loading loadings={[loading]} />

      <main className="flex-1 px-3 pt-5 md:pt-25 pb-22 max-w-4xl mx-auto w-full">
        <h1 className="mb-5 flex justify-center text-2xl font-semibold text-zinc-700">
          Relatórios Pendentes {obra && `// ${obra}`}
        </h1>

        {/* Busca + Filtro */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Funcionário, Patrimônio, Serial ou Item"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-3 p-2.5 text-sm placeholder:normal-case uppercase text-zinc-600 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
            />
          </div>

          <button
            onClick={toggleFilter}
            className={`p-2 px-3 text-md rounded-md border transition-all ${
              showFilter || filtersActive
                ? "bg-(--primaryfirst) text-white border-(--primaryfirst)"
                : "bg-white text-zinc-700 border-zinc-300 shadow hover:text-(--primaryfirst)"
            }`}
          >
            <FaFilter />
          </button>
        </div>

        {/* Painel de filtros */}
        {showFilter && (
          <div className="mb-5 w-full bg-white rounded-lg border shadow border-zinc-300 p-3 space-y-3 text-sm">
            <div>
              <label className="block mb-0.5 text-zinc-700 font-semibold">Status</label>
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-zinc-500/90 focus:outline-none"
              >
                <option value="">Todos</option>
                <option value="NO PRAZO">No Prazo</option>
                <option value="ATRASADO">Atrasado</option>
                <option value="CRÍTICO">Crítico</option>
              </select>
            </div>

            <div className="flex gap-3">
              {["dataInicial", "dataFinal"].map(campo => (
                <div key={campo} className="flex-1">
                  <label className="block mb-0.5 text-zinc-700 font-semibold">
                    {campo === "dataInicial" ? "Data inicial" : "Data final"}
                  </label>
                  <input
                    type="date"
                    value={filters[campo]}
                    onChange={e => setFilters(f => ({ ...f, [campo]: e.target.value }))}
                    className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-zinc-500/90 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de relatórios */}
        <div className="grid grid-cols-1 gap-6 mt-6">
          {!loading && visibleRelatorios.length === 0 ? (
            <p className="text-zinc-400 text-md text-center">Nenhum relatório encontrado.</p>
          ) : (
            visibleRelatorios.map(rel => (
              <RelatorioCard
                key={rel.id}
                rel={rel}
                onClick={() => setSelectedRelatorio(rel)}
                mode="home"
              />
            ))
          )}
        </div>

        {visibleCount < filteredRelatorios.length && (
          <button
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="mt-4 w-full py-2 bg-(--primaryfirst) text-white rounded-lg hover:bg-(--primarysecond) transition"
          >
            Carregar mais
          </button>
        )}
      </main>

      <button
        aria-label="Criar novo relatório"
        onClick={() => navigate("/new-report")}
        className="fixed bottom-20 right-6 md:right-10 z-50 bg-(--primaryfirst) hover:bg-(--primarysecond) text-white p-3 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-110"
        title="Novo Relatório"
      >
        <FaPlus size={30} />
      </button>

      <BottomBar />

      {selectedRelatorio && (
        <ModalDetail relatorio={selectedRelatorio} onClose={() => setSelectedRelatorio(null)} />
      )}
    </div>
  );
}