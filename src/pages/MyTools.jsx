// src/pages/MyTools.jsx
import { useEffect, useState, useMemo } from "react";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import * as XLSX from "xlsx";
import { FaSearch, FaFileExcel } from "react-icons/fa";

export default function MyTools() {
  const userObra = localStorage.getItem("userObra") || "";
  const [tools, setTools] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ---------------- BUSCAR FERRAMENTAS ----------------
  useEffect(() => {
    const allToolsRaw = localStorage.getItem("ferramentas_all");
    if (!allToolsRaw) return;

    const allTools = JSON.parse(allToolsRaw);
    const myTools = allTools.filter((f) => f.T035GCODI === `8028${userObra}`);

    const relatoriosRaw = localStorage.getItem(`relatorios_${userObra}`);
    const relatorios = relatoriosRaw ? JSON.parse(relatoriosRaw) : [];

    const toolsWithStatus = myTools.map((tool) => {
      let status = "ALMOXARIFE";
      let funcionario = "";

      relatorios.forEach((rel) => {
        rel.ferramentas?.forEach((f) => {
          if (f.patrimonio === tool.PATRIMONIO || f.serial === tool.NUMSER) {
            if (f.estadoFer === "DEVOLVIDO" || f.estadoFer === "EXTRAVIADO") {
              status = "ALMOXARIFE";
            } else {
              status = "EM CAMPO";
              funcionario = rel.funcionario || "";
            }
          }
        });
      });

      return {
        PATRIMONIO: tool.PATRIMONIO,
        NUMSER: tool.NUMSER,
        COD_FERRA_COB: tool.COD_FERRA_COB,
        DESCRICAO: tool.DESCRICAO,
        STATUS: status,
        FUNCIONARIO: funcionario,
      };
    });

    setTools(toolsWithStatus);
  }, [userObra]);

  // ---------------- FILTRO + BUSCA ----------------
  const filteredTools = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return tools.filter((t) => {
      const matchesSearch =
        !lowerSearch ||
        t.PATRIMONIO?.toLowerCase().includes(lowerSearch) ||
        t.NUMSER?.toLowerCase().includes(lowerSearch) ||
        t.COD_FERRA_COB?.toLowerCase().includes(lowerSearch) ||
        t.DESCRICAO?.toLowerCase().includes(lowerSearch) ||
        t.FUNCIONARIO?.toLowerCase().includes(lowerSearch);

      const matchesStatus = !filterStatus || t.STATUS === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [tools, search, filterStatus]);

  const countEmCampo = tools.filter((t) => t.STATUS === "EM CAMPO").length;
  const countAlmoxarife = tools.filter((t) => t.STATUS === "ALMOXARIFE").length;

  const tableHeaders = [
    "PATRIMONIO",
    "NUMSER",
    "COD_FERRA_COB",
    "DESCRICAO",
    "STATUS",
    "FUNCIONARIO",
  ];

  // ---------------- EXPORTAR PARA EXCEL ----------------
  const exportToExcel = () => {
    if (!filteredTools.length) return alert("Nenhum dado para exportar.");

    const ws = XLSX.utils.json_to_sheet(filteredTools);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ferramentas");
    XLSX.writeFile(wb, `mytools_${userObra}.xlsx`);
  };

  return (
    <div className="font-display min-h-screen bg-(--backgroundfirst) flex flex-col">
      <NavBar />

      <main className="flex-1 px-3 pt-5 md:pt-10 pb-22 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-semibold mb-5">Minhas Ferramentas</h1>

        {/* ---------------- QUADRADOS DE CONTAGEM ---------------- */}
        <div className="flex gap-4 mb-5 flex-wrap">
          <div className="flex-1 p-5 bg-(--primaryfirst) text-white rounded-lg shadow text-center">
            <div className="text-lg font-semibold">Ferramentas em Campo</div>
            <div className="text-3xl font-bold mt-2">{countEmCampo}</div>
          </div>
          <div className="flex-1 p-5 bg-(--green) text-white rounded-lg shadow text-center">
            <div className="text-lg font-semibold">Ferramentas no Almoxarife</div>
            <div className="text-3xl font-bold mt-2">{countAlmoxarife}</div>
          </div>
        </div>

        {/* ---------------- BUSCA + FILTRO ---------------- */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar patrimônio, numser, código, descrição, funcionário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 p-2.5 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-(--primaryfirst) transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-zinc-300 rounded-md p-2"
            >
              <option value="">Todos</option>
              <option value="EM CAMPO">EM CAMPO</option>
              <option value="ALMOXARIFE">ALMOXARIFE</option>
            </select>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-(--green) text-white p-2 rounded-md"
            >
              <FaFileExcel /> Exportar Excel
            </button>
          </div>
        </div>

        {/* ---------------- TABELA RESPONSIVA ---------------- */}
        <div className="overflow-x-auto border border-zinc-300 rounded-lg">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-zinc-100">
                {tableHeaders.map((h) => (
                  <th key={h} className="border border-zinc-300 p-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="text-center p-4">
                    Nenhuma ferramenta encontrada.
                  </td>
                </tr>
              ) : (
                filteredTools.map((t, i) => (
                  <tr key={i} className="even:bg-zinc-50">
                    {tableHeaders.map((h) => (
                      <td key={h} className="border border-zinc-300 p-2">
                        {t[h]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
