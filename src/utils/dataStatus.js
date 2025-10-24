// src/utils/dataStatus.js

// Formata uma data (Date ou string) para DD/MM/YYYY
export function formatDate(dateInput) {
  if (!dateInput) return "—";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (!(date instanceof Date) || isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR");
}

// Retorna status do relatório com base na data de abertura
export function getRelatorioStatus(dataAbertura) {
  if (!dataAbertura) return { dias: null, status: "—", color: "border-zinc-400" };

  const data = new Date(dataAbertura);
  if (isNaN(data.getTime())) return { dias: null, status: "—", color: "border-zinc-400" };

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

// Retorna data formatada + status do relatório
export function getDataStatus(dataAbertura) {
  const dataFormatada = formatDate(dataAbertura);
  const { dias, status, color } = getRelatorioStatus(dataAbertura);
  return { dataFormatada, dias, status, color };
}