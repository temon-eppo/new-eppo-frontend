// src/pages/Home.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaSearch, FaFilter } from "react-icons/fa";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { ModalDetail } from "../components/ModalDetail";
import { RelatorioCard } from "../components/RelatorioCard";
import Loading from "../components/Loading";
import { useRelatorios } from "../hooks/useRelatoriosFirestore";
import { getRelatorioStatus } from "../utils/dataStatus";

export default function Home() {
  const navigate = useNavigate();

  const [obra] = useState(localStorage.getItem("userObra") || "");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ status: "", dataInicial: "", dataFinal: "" });
  const [visibleCount, setVisibleCount] = useState(10);

  // Hook dos relatórios com cache
  const { relatorios, filtered: relFiltrados, error, loading } = useRelatorios(
    obra,
    debouncedSearch,
    "EM CAMPO"
  );

  // Debounce do search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Toggle painel de filtros
  const toggleFilter = useCallback(() => {
    if (showFilter) setFilters({ status: "", dataInicial: "", dataFinal: "" });
    setShowFilter((p) => !p);
  }, [showFilter]);

  const filtersActive = Object.values(filters).some(Boolean);

  // Lista filtrada com filtro de status e data
    const filteredRelatorios = useMemo(() => {
    const list = relFiltrados;
    const lowerSearch = debouncedSearch.toLowerCase();

    const filtered = list.filter((rel) => {
      // Busca case-insensitive
      const matchesSearch =
        !lowerSearch ||
        rel.Funcionario?.toLowerCase().includes(lowerSearch) ||
        rel.Ferramentas?.some(
          (f) =>
            f.Patrimonio?.toLowerCase().includes(lowerSearch) ||
            f.Serial?.toLowerCase().includes(lowerSearch) ||
            f.Item?.toLowerCase().includes(lowerSearch)
        );
      if (!matchesSearch) return false;

      // Filtro status (NO PRAZO / ATRASADO / CRÍTICO)
      const { status } = getRelatorioStatus(rel.DataAberturaRel);
      if (filters.status && filters.status !== status) return false;

      // Filtro por data
      const dataAbertura = new Date(rel.DataAberturaRel);
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

    // ✅ Ordena por DataAberturaRel da maior para a menor
    filtered.sort((a, b) => new Date(b.DataAberturaRel) - new Date(a.DataAberturaRel));

    return filtered;
  }, [relFiltrados, debouncedSearch, filters]);

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
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Funcionário, Patrimônio, Serial ou Item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 p-2.5 text-sm placeholder:normal-case uppercase text-zinc-600 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold hover:text-(--primaryfirst)"
              >
                ✕
              </button>
            )}
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
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-zinc-500/90 focus:outline-none"
              >
                <option value="">Todos</option>
                <option value="NO PRAZO">No Prazo</option>
                <option value="ATRASADO">Atrasado</option>
                <option value="CRÍTICO">Crítico</option>
              </select>
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
                    onChange={(e) => setFilters((f) => ({ ...f, [campo]: e.target.value }))}
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
            visibleRelatorios.map((rel) => {
              const { status, color, dias } = getRelatorioStatus(rel.DataAberturaRel);
              return (
                <RelatorioCard
                  key={rel.id}
                  rel={rel}
                  status={status}
                  color={color}
                  dias={dias}
                  onClick={() => setSelectedRelatorio(rel)}
                  mode="home"
                />
              );
            })
          )}
        </div>

        {visibleCount < filteredRelatorios.length && (
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="mt-4 w-full py-2 bg-(--primaryfirst) text-white rounded-lg hover:bg-(--primarysecond) transition"
          >
            Carregar mais
          </button>
        )}
      </main>

      {/* Botão flutuante "Novo Relatório" */}
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