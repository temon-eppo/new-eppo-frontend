// src/components/RelatorioCard.jsx
import { useState, useMemo } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

//
// === Funções utilitárias compatíveis com Timestamp e DD/MM/YYYY HH:mm:ss ===
//

// Converte Firestore Timestamp ou string "DD/MM/YYYY HH:mm:ss" → Date
function parseBrazilianDate(dateInput) {
  if (!dateInput) return null;

  // Firestore Timestamp
  if (typeof dateInput.toDate === "function") {
    return dateInput.toDate();
  }

  // Timestamp em cache local {type: 'firestore/timestamp/1.0', seconds, nanoseconds}
  if (dateInput?.type === "firestore/timestamp/1.0" && typeof dateInput.seconds === "number") {
    return new Date(dateInput.seconds * 1000 + Math.floor((dateInput.nanoseconds || 0) / 1e6));
  }

  // Já é um Date
  if (dateInput instanceof Date) return dateInput;

  // Se for string
  if (typeof dateInput === "string") {
    const [datePart, timePart = "00:00:00"] = dateInput.split(" às ")[0].split(" "); // adapta "17 de outubro de 2025 às 15:53:17"
    const match = datePart.match(/(\d+)\D+(\d+)?\D+(\d+)/); // fallback para dd/MM/yyyy
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

// Formata uma data para DD/MM/YYYY
function formatDate(dateInput) {
  const date = parseBrazilianDate(dateInput);
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR");
}

// Retorna status e cor do relatório com base na data de abertura
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

// Retorna data formatada + status + dias
function getDataStatus(dataAbertura) {
  const dataFormatada = formatDate(dataAbertura);
  const { dias, status, color } = getRelatorioStatus(dataAbertura);
  return { dataFormatada, dias, status, color };
}

//
// === Subcomponente: Ferramenta individual ===
//
function FerramentaItem({ f, mode = "completed" }) {
  const status = f.estadoFer;
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
    ["Patrimônio:", f.patrimonio],
    ["Serial:", f.serial],
    ["Item:", f.item],
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

//
// === Subcomponente: Lista de ferramentas ===
//
function FerramentasList({ ferramentas, expanded, toggle, mode }) {
  if (!ferramentas || ferramentas.length === 0) return null;
  if (ferramentas.length === 1) return <FerramentaItem f={ferramentas[0]} mode={mode} />;

  return (
    <div className="space-y-2">
      {expanded &&
        ferramentas.map((f, i) => (
          <FerramentaItem key={f.patrimonio || f.serial || i} f={f} mode={mode} />
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

//
// === Componente Principal ===
//
export function RelatorioCard({ rel, onClick, mode = "completed" }) {
  const [expanded, setExpanded] = useState(false);

  // Processa abertura
  const abertura = useMemo(() => {
    const { status, dias, color } = getRelatorioStatus(rel.dataAberturaRel);
    return {
      status,
      dias,
      color,
      dataFormatada: formatDate(rel.dataAberturaRel),
    };
  }, [rel.dataAberturaRel]);

  // Processa conclusão
  const conclusaoFormatada = useMemo(
    () =>
      rel.dataConclusaoRel
        ? formatDate(rel.dataConclusaoRel)
        : "—",
    [rel.dataConclusaoRel]
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

  const sortedFerramentas = useMemo(() => {
    if (mode === "home") {
      return [...(rel.ferramentas || [])].sort((a, b) => {
        const aIn = a.estadoFer === "DEVOLVIDO" || a.estadoFer === "EXTRAVIADO";
        const bIn = b.estadoFer === "DEVOLVIDO" || b.estadoFer === "EXTRAVIADO";
        return aIn - bIn;
      });
    }
    return rel.ferramentas || [];
  }, [rel.ferramentas, mode]);

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
          RELATÓRIO <span>#{rel.numRelatorio}</span>
          {mode === "home" && (
            <>
              <span className="text-zinc-300 font-light">/</span>
              <span className={`ml-0.5 ${badgeColor}`}>{abertura.status}</span>
            </>
          )}
        </h3>
        <p className="text-zinc-500/90 text-[15px]">{rel.funcionario}</p>
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

export { getRelatorioStatus, parseBrazilianDate, getDataStatus, formatDate };