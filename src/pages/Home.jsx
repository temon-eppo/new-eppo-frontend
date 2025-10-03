// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { ModalDetail } from "../components/ModalDetail";
import { useRelatorios } from "../hooks/useRelatorios";

// ---------------- Função utilitária para Status ----------------
function getStatus(dataAberturaFer) {
  if (!dataAberturaFer)
    return { dias: null, status: "Sem Status", color: "border-l-zinc-400" };

  const diffTime = Date.now() - new Date(dataAberturaFer).getTime();
  const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (dias < 7)
    return { dias, status: "No Prazo", color: "border-l-(--noprazo)" };
  if (dias < 14)
    return { dias, status: "Atrasado", color: "border-l-(--atrasado)" };
  return { dias, status: "Crítico", color: "border-l-(--critico)" };
}

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);
  const [obra, setObra] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    const localObra = localStorage.getItem("userObra");
    if (localObra) setObra(localObra);
  }, []);

  const { filtered: relatorios, error: relError, loading } = useRelatorios(
    obra,
    debouncedSearch
  );

  if (!obra) return <ScreenMessage text="Obra não encontrada" error />;
  if (loading) return <ScreenMessage text="Carregando relatórios..." />;

  return (
    <div className="font-display relative min-h-screen bg-zinc-100 flex flex-col">
      <NavBar />

      <div className="flex-1 p-3 pt-3 md:pt-20 pb-32 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-semibold text-zinc-600 mt-5 mb-5 text-center">
          Relatórios Pendentes | {obra}
        </h1>

        <div className="relative mb-5">
          <input
            type="text"
            placeholder="Funcionário, Patrimônio, Serial ou Item"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 text-md text-zinc-600 rounded-lg bg-white shadow focus:outline-none focus:ring-2 focus:ring-(--primary) transition-colors duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold hover:text-(--primary) transition"
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        {relError && (
          <p className="text-(--primary) text-center mb-4">{relError}</p>
        )}

        <div className="grid grid-cols-1 gap-5">
          {relatorios.length === 0 ? (
            <p className="text-zinc-400 text-md text-center">
              Nenhum relatório encontrado.
            </p>
          ) : (
            relatorios.map((rel) => (
              <RelatorioCard
                key={rel.id}
                rel={rel}
                onClick={() => setSelectedRelatorio(rel)}
              />
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => navigate("/new-report")}
        className="fixed bottom-22 right-5 md:right-10 z-50 bg-(--primary) hover:bg-(--primaryhover) text-white p-3 rounded-full shadow-lg flex items-center justify-center"
        title="Novo Relatório"
        aria-label="Criar novo relatório"
      >
        <FaPlus size={30} />
      </button>

      <BottomBar />
      {selectedRelatorio && (
        <ModalDetail
          relatorio={selectedRelatorio}
          onClose={() => setSelectedRelatorio(null)}
        />
      )}
    </div>
  );
}

// ---------------- Relatório Card ----------------
function RelatorioCard({ rel, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ferramentas = rel.Ferramentas || [];
  const ferramenta = ferramentas[0];
  const { dias, status, color } = getStatus(ferramenta?.DataAberturaFer);

  const badgeColor =
    status === "Crítico"
      ? "text-(--critico)"
      : status === "Atrasado"
      ? "text-(--atrasado)"
      : status === "No Prazo"
      ? "text-(--noprazo)"
      : "text-zinc-500";

  const showMultipleTools = ferramentas.length > 1;
  const toolsToShow =
    showMultipleTools && isExpanded ? ferramentas : [ferramenta].filter(Boolean);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`cursor-pointer w-full text-[15px] text-left bg-white p-2 rounded-r-xl shadow hover:shadow-lg ${color} border-l-10 transition duration-200`}
    >
      <div className="flex flex-row gap-2 items-center flex-wrap">
        <span className="text-lg font-semibold text-zinc-600">
          Relatório #{rel.NumRelatorio} |
        </span>
        <span className={`text-lg font-semibold ${badgeColor}`}>{status}</span>
      </div>

      <p className="text-zinc-500 line-clamp-1">
        <b className="text-zinc-600">Func.</b> {rel.Funcionario}
      </p>
      <p className="text-zinc-500">
        <b className="text-zinc-600">Dias:</b> {dias !== null ? dias : "—"}
      </p>

      {ferramentas.length > 0 && (
        <div className="mt-1 grid grid-cols-1 gap-2">
          {toolsToShow.map((f, i) => (
            <FerramentaCard
              key={f.Patrimonio || f.Serial || i}
              ferramenta={f}
            />
          ))}

          {showMultipleTools && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="p-2 bg-zinc-300 text-zinc-600 rounded-lg hover:bg-zinc-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              {isExpanded ? (
                <>
                  Ocultar Ferramentas <FaChevronUp size={12} />
                </>
              ) : (
                <>
                  Mostrar Ferramentas ({ferramentas.length - 1}){" "}
                  <FaChevronDown size={12} />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Ferramenta Card ----------------
function FerramentaCard({ ferramenta }) {
  let borderColor = "border border-transparent";
  let overlayText = "";
  let overlayBg = "";
  let opacity = "opacity-100";

  if (ferramenta.EstadoFer === "DEVOLVIDO") {
    borderColor = "border-2 border-zinc-300";
    overlayText = "DEVOLVIDO";
    overlayBg = "bg-(--noprazo) text-white";
    opacity = "opacity-70";
  } else if (ferramenta.EstadoFer === "EXTRAVIADO") {
    borderColor = "border-2 border-zinc-300";
    overlayText = "EXTRAVIADO";
    overlayBg = "bg-(--critico) text-white";
    opacity = "opacity-70";
  }

  return (
    <div
      className={`relative flex flex-col text-sm text-zinc-500 bg-[#eeeeee] border-2 border-zinc-300 p-2 rounded-lg ${borderColor} ${opacity}`}
    >
      {/* Badge no canto superior direito */}
      {overlayText && (
        <span
          className={`absolute top-2 right-2 p-1 text-xs font-semibold rounded ${overlayBg}`}
        >
          {overlayText}
        </span>
      )}

      <p>
        <b className="text-zinc-600">Pat.</b> {ferramenta.Patrimonio || "—"}
      </p>
      <p>
        <b className="text-zinc-600">Serial:</b> {ferramenta.Serial || "—"}
      </p>
      <p className="text-zinc-500 line-clamp-1">
        <b className="text-zinc-600">Item:</b> {ferramenta.Item || "—"}
      </p>
    </div>
  );
}

// ---------------- Mensagem de Tela ----------------
function ScreenMessage({ text, error }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p
        className={`text-lg md:text-xl font-semibold ${
          error ? "text-(--primary)" : "text-zinc-600"
        } text-center`}
      >
        {text}
      </p>
    </div>
  );
}
