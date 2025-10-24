// src/pages/Completed.jsx
import { useState, useMemo } from "react";
import { FaFilter, FaSearch, FaFileExcel } from "react-icons/fa";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import ModalCompletedDetail from "../components/ModalCompletedDetail";
import { RelatorioCard } from "../components/RelatorioCard";
import { useRelatorios } from "../hooks/useRelatoriosFirestore";
import { formatDate } from "../utils/dataStatus";
import Loading from "../components/Loading";
import * as XLSX from "xlsx";

export default function Completed() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);
  const [limit, setLimit] = useState(10);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState([null, null]);
  const [showFilter, setShowFilter] = useState(false);

  const obra = localStorage.getItem("userObra") || null;

  // Hook de relatórios concluídos com cache de 6h
  const { relatorios, filtered, loading, error } = useRelatorios(
    obra,
    searchTerm,
    "CONCLUIDO"
  );

  // ======= Filtragem extra =======
  const filteredRelatorios = useMemo(() => {
    return filtered
      .map((rel) => {
        let ferramentas = filterStatus
          ? rel.Ferramentas?.filter((f) => f.EstadoFer === filterStatus) || []
          : rel.Ferramentas;

        if (!ferramentas || ferramentas.length === 0) return null;

        // Filtro por data
        if (filterDate[0] || filterDate[1]) {
          const concluDate = new Date(rel.DataConclusaoRel || 0);
          if (filterDate[0] && concluDate < filterDate[0]) return null;
          if (filterDate[1] && concluDate > filterDate[1]) return null;
        }

        return { ...rel, Ferramentas: ferramentas };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.DataConclusaoRel || 0) - new Date(a.DataConclusaoRel || 0));
  }, [filtered, filterStatus, filterDate]);

  const displayedRelatorios = filteredRelatorios.slice(0, limit);

  // ======= Exportar para Excel =======
  const exportToExcel = () => {
    const formatDateBR = (date) =>
      date
        ? new Date(date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
        : "";

    const rows = filteredRelatorios.flatMap((rel) =>
      rel.Ferramentas.map((f) => ({
        NumRelatorio: rel.NumRelatorio,
        Obra: rel.Obra || obra,
        Matricula: rel.Matricula,
        Funcionario: rel.Funcionario,
        DataAberturaRel: formatDateBR(rel.DataAberturaRel),
        DataConclusaoRel: formatDateBR(rel.DataConclusaoRel),
        Patrimonio: f.Patrimonio,
        Serial: f.Serial,
        Item: f.Item,
        EstadoFer: f.EstadoFer,
      }))
    );

    if (!rows.length) return alert("Nenhum dado para exportar.");

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorios");
    XLSX.writeFile(wb, `relatorios_${obra}.xlsx`);
  };

  const toggleFilter = () => {
    if (showFilter) {
      setFilterStatus("");
      setFilterDate([null, null]);
    }
    setShowFilter(!showFilter);
  };

  if (!obra) return <p className="text-center text-red-600 mt-10">Obra não encontrada</p>;
  if (loading) return <Loading loadings={[true]} />;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="font-display min-h-screen bg-(--backgroundfirst) flex flex-col">
      <NavBar />

      <div className="flex-1 px-3 pt-5 md:pt-25 pb-22 max-w-4xl mx-auto w-full">
        <header className="mb-5 flex justify-center text-2xl font-semibold text-zinc-700">
          <h1>Relatórios Completos // {obra}</h1>
        </header>

        {/* Busca e Filtro */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Funcionário, Patrimônio, Serial ou Item"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 p-2.5 text-sm text-zinc-600 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-(--primaryfirst) focus:border-transparent transition-all"
            />
          </div>

          <button
            onClick={toggleFilter}
            className={`p-2 px-3 text-md rounded-md border transition-all ${
              showFilter
                ? "bg-(--primaryfirst) text-white border-(--primaryfirst)"
                : "bg-white text-zinc-700 border-zinc-300 shadow hover:text-(--primaryfirst)"
            }`}
            title={showFilter ? "Limpar filtros" : "Abrir filtros"}
          >
            <FaFilter />
          </button>
        </div>

        {/* Painel de Filtros */}
        {showFilter && (
          <div className="w-full bg-white rounded-lg border shadow border-zinc-300 p-3 space-y-3 text-sm transition-all">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block mb-0.5 text-zinc-700 font-semibold">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
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
              <div className="flex-1">
                <label className="block mb-0.5 text-zinc-700 font-semibold">Data inicial</label>
                <input
                  type="date"
                  onChange={(e) => {
                    const start = e.target.value ? new Date(e.target.value + "T00:00:00") : null;
                    setFilterDate([start, filterDate[1]]);
                  }}
                  className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-zinc-500/90 focus:outline-none"
                />
              </div>

              <div className="flex-1">
                <label className="block mb-0.5 text-zinc-700 font-semibold">Data final</label>
                <input
                  type="date"
                  onChange={(e) => {
                    const end = e.target.value ? new Date(e.target.value + "T23:59:59") : null;
                    setFilterDate([filterDate[0], end]);
                  }}
                  className="w-full border border-zinc-300 rounded-lg p-2 text-sm text-zinc-500/90 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Lista de Relatórios */}
        <div className="space-y-6 mt-6">
          {displayedRelatorios.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">Nenhum relatório encontrado.</div>
          ) : (
            displayedRelatorios.map((rel) => (
              <RelatorioCard
                key={rel.id}
                rel={rel}
                formatDate={formatDate}
                onClick={() => setSelectedRelatorio(rel)}
                mode="completed"
              />
            ))
          )}
        </div>

        {limit < filteredRelatorios.length && (
          <div className="flex justify-center">
            <button
              onClick={() => setLimit((prev) => prev + 10)}
              className="w-32 mt-6 py-1 text-white font-semibold rounded-md border border-zinc-600 bg-zinc-500"
            >
              Carregar mais
            </button>
          </div>
        )}
      </div>

      <BottomBar />

      {selectedRelatorio && (
        <ModalCompletedDetail
          relatorio={selectedRelatorio}
          onClose={() => setSelectedRelatorio(null)}
        />
      )}
    </div>
  );
}
