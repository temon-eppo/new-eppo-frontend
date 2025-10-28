// src/pages/Completed.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { FaFilter, FaSearch, FaFileExcel } from "react-icons/fa";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import ModalCompletedDetail from "../components/ModalCompletedDetail";
import { RelatorioCard } from "../components/RelatorioCard";
import Loading from "../components/Loading";
import * as XLSX from "xlsx";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// ------------------- UTILIDADES DE DATA -------------------
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

function formatDate(dateInput) {
  const date = parseBrazilianDate(dateInput);
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR");
}

// ------------------- COMPONENTE PRINCIPAL -------------------
export default function Completed() {
  const obra = localStorage.getItem("userObra") || "";
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", dataInicial: "", dataFinal: "" });
  const [showFilter, setShowFilter] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);

  // ------------------- DEBOUNCE SEARCH -------------------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ------------------- FETCH RELATÓRIOS CONCLUÍDOS -------------------
  useEffect(() => {
    if (!obra) return;

    setLoading(true);
    const cacheKey = `relatorios_completed_${obra}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setRelatorios(parsed);
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    const colRef = collection(db, `relatorios_${obra}`);
    const q = query(colRef, where("estadoRel", "==", "CONCLUIDO"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRelatorios((prev) => {
          const updated = [...prev];
          snapshot.docChanges().forEach((change) => {
            const idx = updated.findIndex((r) => r.id === change.doc.id);
            if (change.type === "removed") {
              if (idx > -1) updated.splice(idx, 1);
            } else {
              const docData = { id: change.doc.id, ...change.doc.data() };
              if (idx > -1) updated[idx] = docData;
              else updated.push(docData);
            }
          });
          localStorage.setItem(cacheKey, JSON.stringify(updated));
          return updated;
        });
        setLoading(false);
      },
      (err) => {
        console.error("Erro no onSnapshot:", err);
        setLoading(false);
      }
    );

    if (!cached) {
      getDocs(q).then((snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRelatorios(docs);
        localStorage.setItem(cacheKey, JSON.stringify(docs));
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [obra]);

  // ------------------- TOGGLE FILTER -------------------
  const toggleFilter = useCallback(() => {
    if (showFilter) setFilters({ status: "", dataInicial: "", dataFinal: "" });
    setShowFilter((p) => !p);
  }, [showFilter]);

  const filtersActive = Object.values(filters).some(Boolean);

  // ------------------- FILTROS + BUSCA -------------------
  const filteredRelatorios = useMemo(() => {
    const lowerSearch = debouncedSearch.toLowerCase();

    return relatorios
      .map((rel) => {
        // Filtra ferramentas pelo status
        const ferramentas = (rel.ferramentas || []).filter(
          (f) => !filters.status || f.estadoFer === filters.status
        );

        if (!ferramentas.length) return null;

        // Busca
        const matchesSearch =
          !lowerSearch ||
          rel.funcionario?.toLowerCase().includes(lowerSearch) ||
          ferramentas.some(
            (f) =>
              f.patrimonio?.toLowerCase().includes(lowerSearch) ||
              f.serial?.toLowerCase().includes(lowerSearch) ||
              f.item?.toLowerCase().includes(lowerSearch)
          );
        if (!matchesSearch) return null;

        // Datas
        const dataConclusao = parseBrazilianDate(rel.dataConclusaoRel);
        if (filters.dataInicial) {
          const start = new Date(filters.dataInicial + "T00:00:00");
          if (dataConclusao < start) return null;
        }
        if (filters.dataFinal) {
          const end = new Date(filters.dataFinal + "T23:59:59");
          if (dataConclusao > end) return null;
        }

        return { ...rel, ferramentas };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          parseBrazilianDate(b.dataConclusaoRel) - parseBrazilianDate(a.dataConclusaoRel)
      );
  }, [relatorios, debouncedSearch, filters]);

  const visibleRelatorios = filteredRelatorios.slice(0, visibleCount);

  // ------------------- EXPORTAR PARA EXCEL -------------------
  const exportToExcel = () => {
    const rows = filteredRelatorios.flatMap((rel) =>
      rel.ferramentas.map((f) => ({
        NumRelatorio: rel.numRelatorio,
        Obra: rel.obra || obra,
        Funcionario: rel.funcionario,
        DataAberturaRel: formatDate(rel.dataAberturaRel),
        DataConclusaoRel: formatDate(rel.dataConclusaoRel),
        Patrimonio: f.patrimonio,
        Serial: f.serial,
        Item: f.item,
        EstadoFer: f.estadoFer,
      }))
    );

    if (!rows.length) return alert("Nenhum dado para exportar.");

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorios");
    XLSX.writeFile(wb, `relatorios_completed_${obra}.xlsx`);
  };

  // ------------------- RENDER -------------------
  return (
    <div className="font-display min-h-screen bg-(--backgroundfirst) flex flex-col">
      <NavBar />
      <Loading loadings={[{ loading, message: "Carregando relatórios concluídos..." }]} />

      <main className="flex-1 px-3 pt-5 md:pt-25 pb-22 max-w-4xl mx-auto w-full">
        <header className="mb-5 flex justify-center text-2xl font-semibold text-zinc-700">
          <h1>Relatórios Completos // {obra}</h1>
        </header>

        {/* Busca + Filtro */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Funcionário, Patrimônio, Serial ou Item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 p-2.5 text-sm text-zinc-600 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-(--primaryfirst) focus:border-transparent transition-all"
            />
          </div>

          <button
            onClick={toggleFilter}
            className={`p-2 px-3 text-md rounded-md border transition-all ${
              showFilter || filtersActive
                ? "bg-(--primaryfirst) text-white border-(--primaryfirst)"
                : "bg-white text-zinc-700 border-zinc-300 shadow hover:text-(--primaryfirst)"
            }`}
            title={showFilter ? "Limpar filtros" : "Abrir filtros"}
          >
            <FaFilter />
          </button>
        </div>

        {/* Painel de filtros */}
        {showFilter && (
          <div className="w-full bg-white rounded-lg border shadow border-zinc-300 p-3 space-y-3 text-sm transition-all">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block mb-0.5 text-zinc-700 font-semibold">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-zinc-500/90 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="DEVOLVIDO">Devolvidos</option>
                  <option value="EXTRAVIADO">Extraviados</option>
                </select>
              </div>

              <button
                onClick={exportToExcel}
                className="flex items-center justify-center gap-2 bg-(--green) hover:bg-green-700 text-white font-semibold p-2.5 rounded-lg transition-all whitespace-nowrap"
              >
                <FaFileExcel className="text-lg" />
              </button>
            </div>

            <div className="flex gap-3">
              {["dataInicial", "dataFinal"].map((campo) => (
                <div key={campo} className="flex-1">
                  <label className="block mb-0.5 text-zinc-700 font-semibold">
                    {campo === "dataInicial" ? "Data inicial" : "Data final"}
                  </label>
                  <input
                    type="date"
                    value={filters[campo]}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, [campo]: e.target.value }))
                    }
                    className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-zinc-500/90 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Relatórios */}
        <div className="space-y-6 mt-6">
          {visibleRelatorios.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">Nenhum relatório encontrado.</div>
          ) : (
            visibleRelatorios.map((rel) => (
              <RelatorioCard
                key={rel.id}
                rel={rel}
                onClick={() => setSelectedRelatorio(rel)}
                mode="completed"
              />
            ))
          )}
        </div>

        {visibleCount < filteredRelatorios.length && (
          <div className="flex justify-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="w-32 mt-6 py-1 text-white font-semibold rounded-md border border-zinc-600 bg-zinc-500"
            >
              Carregar mais
            </button>
          </div>
        )}
      </main>

      <BottomBar />

      {selectedRelatorio && (
        <ModalCompletedDetail
          relatorio={selectedRelatorio}
          onClose={() => setSelectedRelatorio(null)}
          filterStatus={filters.status} // Filtra ferramentas dentro do modal
        />
      )}
    </div>
  );
}
