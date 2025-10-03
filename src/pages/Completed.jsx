// src/pages/Completed.jsx
import { useState, useEffect } from "react";
import { FaFilter, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import ModalCompletedDetail from "../components/ModalCompletedDetail";
import { useCompletedRelatorios } from "../hooks/useCompletedRelatorios";

// ---------------- Ferramenta Card (igual modal) ----------------
function FerramentaItem({ f }) {
  const overlayText =
    f.EstadoFer === "DEVOLVIDO"
      ? "DEVOLVIDO"
      : f.EstadoFer === "EXTRAVIADO"
      ? "EXTRAVIADO"
      : "";

  const overlayBg =
    f.EstadoFer === "DEVOLVIDO"
      ? "bg-(--noprazo) text-white"
      : f.EstadoFer === "EXTRAVIADO"
      ? "bg-(--critico) text-white"
      : "";

  return (
    <div className="relative flex flex-col text-sm text-zinc-500 bg-[#eeeeee] p-2 rounded-lg border-2 border-zinc-300">
      {overlayText && (
        <span className={`absolute top-2 right-2 p-1 text-xs font-semibold rounded ${overlayBg}`}>
          {overlayText}
        </span>
      )}
      <p><b className="text-zinc-600">Pat.</b> {f.Patrimonio || "—"}</p>
      <p><b className="text-zinc-600">Serial:</b> {f.Serial || "—"}</p>
      <p className="text-zinc-500 line-clamp-1"><b className="text-zinc-600">Item:</b> {f.Item || "—"}</p>
    </div>
  );
}

// ---------------- Completed ----------------
export default function Completed() {
  const [obra, setObra] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const { filtered: relatorios, error: relError } = useCompletedRelatorios(obra, searchTerm);

  useEffect(() => {
    const localObra = localStorage.getItem("userObra");
    if (localObra) setObra(localObra);
    setLoading(false);
  }, []);

  if (loading) return <ScreenMessage text="Carregando relatórios..." />;
  if (!obra) return <ScreenMessage text="Obra não encontrada" error />;

  const filteredByStatus = filterStatus
    ? relatorios.filter((r) => r.EstadoRel === filterStatus)
    : relatorios;

  const sortedRelatorios = [...filteredByStatus].sort((a, b) => {
    const dateA = a.DataConclusaoRel ? new Date(a.DataConclusaoRel) : new Date(0);
    const dateB = b.DataConclusaoRel ? new Date(b.DataConclusaoRel) : new Date(0);
    return dateB - dateA;
  });

  const displayedRelatorios = sortedRelatorios.slice(0, limit);
  const handleShowMore = () => setLimit((prev) => prev + 10);

  return (
    <div className="font-display relative min-h-screen bg-zinc-100 flex flex-col">
      <NavBar />

      <div className="flex-1 p-3 pt-3 md:pt-20 pb-32 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-semibold text-zinc-600 mt-5 mb-5 text-center">
          Relatórios Completos | {obra}
        </h1>

        {/* INPUT + FILTRO */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            placeholder="Funcionário, Patrimônio, Serial ou Item"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 text-md text-zinc-600 rounded-lg bg-white shadow focus:outline-none focus:ring-2 focus:ring-(--primary) transition-colors duration-200"
          />
          <div className="relative">
            <button
              onClick={() => setShowFilter(prev => !prev)}
              className="p-4 bg-white rounded-lg text-xl text-zinc-700 shadow hover:bg-zinc-100 transition duration-200 flex items-center gap-2"
            >
              <FaFilter />
            </button>

            {showFilter && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-zinc-200 z-10">
                <button
                  onClick={() => { setFilterStatus(""); setShowFilter(false); }}
                  className="w-full text-left text-lg text-zinc-700 px-3 py-2 hover:bg-zinc-100 transition"
                >Todos</button>
                <button
                  onClick={() => { setFilterStatus("EXTRAVIADO"); setShowFilter(false); }}
                  className="w-full text-left text-lg text-zinc-700 px-3 py-2 hover:bg-zinc-100 transition"
                >EXTRAVIADOS</button>
                <button
                  onClick={() => { setFilterStatus("DEVOLVIDO"); setShowFilter(false); }}
                  className="w-full text-left text-lg text-zinc-700 px-3 py-2 hover:bg-zinc-100 transition"
                >DEVOLVIDOS</button>
              </div>
            )}
          </div>
        </div>

        {relError && <p className="text-(--primary) text-center mb-4">{relError}</p>}

        <div className="grid grid-cols-1 gap-5">
          {displayedRelatorios.length === 0 ? (
            <p className="text-zinc-400 text-md text-center">Nenhum relatório encontrado.</p>
          ) : (
            displayedRelatorios.map((rel) => (
              <RelatorioCard key={rel.id} rel={rel} onClick={() => setSelectedRelatorio(rel)} />
            ))
          )}
          {limit < sortedRelatorios.length && (
            <button
              onClick={handleShowMore}
              className="w-full text-zinc-500 hover:text-zinc-700 text-lg underline transition duration-200 mt-4"
            >
              Mostrar Mais
            </button>
          )}
        </div>
      </div>

      <BottomBar />

      {/* Modal */}
      {selectedRelatorio && (
        <ModalCompletedDetail relatorio={selectedRelatorio} onClose={() => setSelectedRelatorio(null)} />
      )}
    </div>
  );
}

// ---------------- Relatório Card ----------------
function RelatorioCard({ rel, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ferramentas = rel.Ferramentas || [];
  const ferramenta = ferramentas[0];
  const showMultipleTools = ferramentas.length > 1;
  const toolsToShow = showMultipleTools && isExpanded ? ferramentas : [ferramenta].filter(Boolean);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="w-full text-left bg-white p-2 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
    >
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-zinc-600">Relatório #{rel.NumRelatorio}</span>
        <span className="text-zinc-500">{rel.EstadoRel}</span>
      </div>
      <p className="text-zinc-500"><b>Func.</b> {rel.Funcionario}</p>
      <div className="flex justify-between">
        <p className="text-zinc-500"><b>Abertura:</b> {rel.DataAberturaRel}</p>
        <p className="text-zinc-500"><b>Conclusão:</b> {rel.DataConclusaoRel}</p>
      </div>

      {ferramentas.length > 0 && (
        <div className="mt-2 grid grid-cols-1 gap-2">
          {toolsToShow.map((f, i) => (
            <FerramentaItem key={f.Patrimonio || f.Serial || i} f={f} />
          ))}

          {showMultipleTools && (
            <div
              onClick={(e) => { e.stopPropagation(); setIsExpanded(prev => !prev); }}
              className="p-2 bg-zinc-300 text-zinc-600 rounded-lg hover:bg-zinc-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium mt-2 cursor-pointer"
            >
              {isExpanded ? <>Ocultar Ferramentas <FaChevronUp size={12} /></> :
                <>Mostrar Ferramentas ({ferramentas.length - 1}) <FaChevronDown size={12} /></>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Mensagem de Tela ----------------
function ScreenMessage({ text, error }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className={`text-lg md:text-xl font-semibold ${error ? "text-(--primary)" : "text-zinc-600"} text-center`}>
        {text}
      </p>
    </div>
  );
}
