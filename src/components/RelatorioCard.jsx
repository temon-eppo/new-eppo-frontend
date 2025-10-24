// src/components/RelatorioCard.jsx
import { useState, useMemo } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { getDataStatus } from "../utils/dataStatus";

// Subcomponente: Ferramenta individual
function FerramentaItem({ f, mode = "completed" }) {
  const status = f.EstadoFer;
  const inactive = status === "DEVOLVIDO" || status === "EXTRAVIADO";

  const containerClass =
    mode === "home"
      ? inactive
        ? "bg-zinc-50 border-zinc-300 opacity-40 cursor-default"
        : "bg-zinc-50 border-zinc-400 cursor-pointer hover:border-zinc-500"
      : "bg-zinc-50 border-zinc-300";

  const color =
    status === "DEVOLVIDO"
      ? "bg-(--green) text-white"
      : status === "EXTRAVIADO"
      ? "bg-(--red) text-white"
      : "";

  const fields = [
    ["Patrimônio:", f.Patrimonio],
    ["Serial:", f.Serial],
    ["Item:", f.Item],
  ];

  return (
    <div className={`relative rounded-lg p-3 border transition-all ${containerClass}`}>
      {color && (
        <span className={`absolute top-2 right-2 p-1 text-xs font-bold rounded-sm ${color}`}>
          {status}
        </span>
      )}
      {fields.map(([label, val]) => (
        <p key={label} className="text-sm text-zinc-500/90 line-clamp-1">
          <span className="font-medium text-zinc-700">{label}</span> {val || "—"}
        </p>
      ))}
    </div>
  );
}

// Subcomponente: Lista de ferramentas com botão expandir
function FerramentasList({ ferramentas, expanded, toggle, mode }) {
  if (!ferramentas || ferramentas.length === 0) return null;
  if (ferramentas.length === 1) return <FerramentaItem f={ferramentas[0]} mode={mode} />;

  return (
    <div className="space-y-2">
      {expanded &&
        ferramentas.map((f, i) => (
          <FerramentaItem key={f.Patrimonio || f.Serial || i} f={f} mode={mode} />
        ))}
      <button
        onClick={toggle}
        className="w-full mt-3 p-1 bg-zinc-200 border border-zinc-300 text-zinc-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
        aria-expanded={expanded}
      >
        {expanded ? (
          <>
            Ocultar ferramentas <FaChevronUp size={12} />
          </>
        ) : (
          <>
            Ver todas ({ferramentas.length}) <FaChevronDown size={12} />
          </>
        )}
      </button>
    </div>
  );
}

// Componente Principal
export function RelatorioCard({ rel, onClick, mode = "completed" }) {
  const [expanded, setExpanded] = useState(false);

  // Memoiza data e status para evitar recalculos desnecessários
  const abertura = useMemo(() => getDataStatus(rel.DataAberturaRel), [rel.DataAberturaRel]);
  const conclusaoFormatada = useMemo(
    () => (rel.DataConclusaoRel ? getDataStatus(rel.DataConclusaoRel).dataFormatada : "—"),
    [rel.DataConclusaoRel]
  );

  const borderColor = {
    CRÍTICO: "border-(--red)",
    ATRASADO: "border-(--yellow)",
    "NO PRAZO": "border-(--green)",
  }[abertura.status] || "border-zinc-400";

  const badgeColor = {
    CRÍTICO: "text-(--red)",
    ATRASADO: "text-(--yellow)",
    "NO PRAZO": "text-(--green)",
  }[abertura.status] || "text-zinc-400";

  // Ordena ferramentas no modo "home"
  const sortedFerramentas = useMemo(() => {
    if (mode === "home") {
      return [...(rel.Ferramentas || [])].sort((a, b) => {
        const aIn = a.EstadoFer === "DEVOLVIDO" || a.EstadoFer === "EXTRAVIADO";
        const bIn = b.EstadoFer === "DEVOLVIDO" || b.EstadoFer === "EXTRAVIADO";
        return aIn - bIn;
      });
    }
    return rel.Ferramentas || [];
  }, [rel.Ferramentas, mode]);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`bg-white rounded-lg p-3 shadow transition-all cursor-pointer hover:shadow-xl
          ${mode === "home" ? `rounded-l-xs border-l-6 ${borderColor}` : "border border-zinc-300"}`}
    >
      {/* Header */}
      <header className="mb-4">
        <h3 className="text-[22px] font-semibold text-zinc-700 flex flex-wrap gap-1">
          RELATÓRIO <span>#{rel.NumRelatorio}</span>
          {mode === "home" && (
            <>
              <span className="text-zinc-300 font-light">/</span>
              <span className={`ml-0.5 ${badgeColor}`}>{abertura.status}</span>
            </>
          )}
        </h3>
        <p className="text-zinc-500/90 text-[15px]">{rel.Funcionario}</p>
      </header>

      {/* Datas */}
      <div className="flex flex-row gap-5 mb-4 text-sm">
        <div>
          <span className="font-medium text-zinc-700">Abertura:</span>
          <span className="ml-1 text-zinc-500/90">{abertura.dataFormatada}</span>
        </div>
        {mode === "home" ? (
          <div>
            <span className="font-medium text-zinc-700">Dias:</span>
            <span className="ml-1 text-zinc-500/90">{abertura.dias ?? "—"}</span>
          </div>
        ) : (
          <div>
            <span className="font-medium text-zinc-700">Conclusão:</span>
            <span className="ml-1 text-zinc-500/90">{conclusaoFormatada}</span>
          </div>
        )}
      </div>

      {/* Ferramentas */}
      <FerramentasList
        ferramentas={sortedFerramentas}
        expanded={expanded}
        toggle={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        mode={mode}
      />
    </div>
  );
}