import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaTimes, FaSearch, FaPlus, FaSpinner, FaQrcode } from "react-icons/fa";
import QrScanner from "qr-scanner";
import { db } from "../firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";

export default function ModalTools({ onClose, onAddFerramenta, selectedTools }) {
  const [userObra, setUserObra] = useState("");
  const [activeTools, setActiveTools] = useState([]);
  const [foundTools, setFoundTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);

  const [manualTool, setManualTool] = useState({ Patrimonio: "", Serial: "", Descricao: "" });
  const [descricaoOptions, setDescricaoOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);

  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // ---------------- CARREGA OBRA ----------------
  useEffect(() => {
    setUserObra(localStorage.getItem("userObra") || "");
  }, []);

  // ---------------- FERRAMENTAS EM CAMPO ----------------
  useEffect(() => {
    if (!userObra) return;
    const fetchActiveTools = async () => {
      try {
        const q = query(collection(db, "relatorios"), where("Obra", "==", userObra));
        const snapshot = await getDocs(q);
        const tools = snapshot.docs.flatMap(doc => {
          const data = doc.data();
          if (!Array.isArray(data.Ferramentas)) return [];
          return data.Ferramentas
            .filter(f => f.EstadoFer === "EM CAMPO" && data.EstadoRel === "EM CAMPO")
            .map(f => ({ ...f, NumRelatorio: data.NumRelatorio }));
        });
        setActiveTools(tools);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao buscar ferramentas em campo!");
      }
    };
    fetchActiveTools();
  }, [userObra]);

  // ---------------- CARREGA DESCRIÇÕES ----------------
  useEffect(() => {
    const allToolsRaw = localStorage.getItem("ferramentas_all");
    if (allToolsRaw) {
      const allTools = JSON.parse(allToolsRaw);
      const uniqueDescriptions = Array.from(new Set(allTools.map(f => f.DESCRICAO).filter(Boolean)));
      setDescricaoOptions(uniqueDescriptions);
      setFilteredOptions(uniqueDescriptions);
    }
  }, []);

  // ---------------- HANDLE SEARCH ----------------
  const handleSearch = useCallback(async (term) => {
    if (!term?.trim()) return;

    setFoundTools([]);
    setLoadingSearch(true);

    try {
      const allToolsRaw = localStorage.getItem("ferramentas_all");
      const allTools = allToolsRaw ? JSON.parse(allToolsRaw) : [];
      const searchTermUpper = term.trim().toUpperCase();
      let results = [];

      if (/^\d{5}$/.test(searchTermUpper)) {
        const modifiedTerm = searchTermUpper.startsWith("B") ? searchTermUpper : "B" + searchTermUpper;
        let found = allTools.find(
          t => (t.PATRIMONIO && t.PATRIMONIO.toUpperCase() === modifiedTerm) ||
              (t.NUMSER && t.NUMSER.toUpperCase() === modifiedTerm)
        );

        if (found && found.COD_FERRA_COB === "531080001") {
          results = [{ ...found, PATRIMONIO: "B" + found.PATRIMONIO.replace(/^B+/, "") }];
        }

        if (results.length === 0) {
          const fallback = allTools.filter(
            t => t.NUMSER && t.NUMSER.toUpperCase() === searchTermUpper
          );
          if (fallback.length > 0) results = fallback;
        }

      } else {
        results = allTools.filter(
          t => (t.PATRIMONIO && t.PATRIMONIO.toUpperCase() === searchTermUpper) ||
              (t.NUMSER && t.NUMSER.toUpperCase() === searchTermUpper)
        );
      }

      setFoundTools(results);
      if (results.length === 0) toast.error("Ferramenta não localizada!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao buscar ferramenta!");
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  // ---------------- HANDLE SCAN ----------------
  const handleScan = async (data) => {
    if (typeof data === "string" && data.trim()) {
      setFoundTools([]);
      setSearchTerm(data.trim());
      setScanActive(false);
      await handleSearch(data.trim());
    }
  };

  // ---------------- QR SCANNER ----------------
  useEffect(() => {
    if (!scanActive || !videoRef.current) return;

    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
    }

    qrScannerRef.current = new QrScanner(
      videoRef.current,
      result => { if (result?.data) handleScan(result.data.trim()); },
      { highlightScanRegion: true, highlightCodeOutline: true, preferredCamera: "environment", maxScansPerSecond: 8, returnDetailedScanResult: true }
    );

    qrScannerRef.current.start().catch(console.error);

    return () => {
      qrScannerRef.current?.stop();
      qrScannerRef.current?.destroy();
      qrScannerRef.current = null;
    };
  }, [scanActive, handleScan]);

  // ---------------- ADD FERRAMENTA ----------------
  const handleAddToolClick = (tool, isManual = false) => {
    const patrimonio = tool.PATRIMONIO || "";
    const serial = tool.NUMSER || "";

    // já no relatório atual
    const exists = selectedTools.some(
      t => t.Patrimonio === patrimonio && t.Serial === serial
    );
    if (exists) return toast("Ferramenta já adicionada", { icon: "⚠️" });

    // verifica uso em outros relatórios locais
    try {
      const relatoriosLocal = JSON.parse(localStorage.getItem(`relatorios_${userObra}`)) || [];
      const emUso = relatoriosLocal.find(r =>
        r.ferramentas?.some(f =>
          f.estadoFer === "EM CAMPO" &&
          (
            (f.patrimonio && f.patrimonio !== "SP" && f.patrimonio === patrimonio) ||
            (f.serial && f.serial !== "" && f.serial === serial)
          )
        )
      );

      if (emUso) {
        return toast.error(`Ferramenta em uso no relatório #${emUso.numRelatorio} conforme o localstorage.`);
      }
    } catch (err) {
      console.warn("Erro ao ler relatorios locais:", err);
    }

    // adiciona nova ferramenta
    onAddFerramenta({
      Patrimonio: patrimonio,
      Serial: serial,
      Item: tool.DESCRICAO,
      EstadoFer: "EM CAMPO",
      DataAberturaFer: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      DataConclusaoFer: "",
      Observacao: "",
      ImagemURL: ""
    });

    setSearchTerm("");
    setFoundTools([]);
  };

// ---------------- ADD MANUAL TOOL ----------------
const handleManualAdd = () => {
  const { Patrimonio, Serial, Descricao } = manualTool;

  if (!Patrimonio && !Serial) return toast.error("Informe Patrimônio ou Serial!");
  if (!Descricao) return toast.error("Informe a Descrição!");

  // duplicidade no relatório atual
  const existsInReport = selectedTools.some(t =>
    (Patrimonio && t.Patrimonio === Patrimonio) ||
    (Serial && Serial !== "" && t.Serial === Serial)
  );
  if (existsInReport) return toast.error("Ferramenta já selecionada neste relatório!");

  // duplicidade no localStorage geral
  const allToolsRaw = localStorage.getItem("ferramentas_all");
  const allTools = allToolsRaw ? JSON.parse(allToolsRaw) : [];
  if (Patrimonio && allTools.some(f => f.PATRIMONIO === Patrimonio)) return toast.error("Patrimônio existe!");
  if (Serial && allTools.some(f => f.NUMSER === Serial)) return toast.error("Serial existe!");

  // em uso em outro relatório local
  try {
    const relatoriosLocal = JSON.parse(localStorage.getItem(`relatorios_${userObra}`)) || [];
    const emUso = relatoriosLocal.find(r =>
      r.ferramentas?.some(f =>
        f.estadoFer === "EM CAMPO" &&
        (
          (f.patrimonio && f.patrimonio !== "SP" && f.patrimonio === Patrimonio) ||
          (f.serial && f.serial !== "" && f.serial === Serial)
        )
      )
    );

    if (emUso) {
      return toast.error(`Ferramenta em uso no relatório #${emUso.numRelatorio} conforme o localstorage.`);
    }
  } catch (err) {
    console.warn("Erro ao ler relatorios locais:", err);
  }

  // adiciona ferramenta manual
  const newTool = {
    Patrimonio,
    Serial,
    Item: Descricao,
    EstadoFer: "EM CAMPO",
    DataAberturaFer: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    DataConclusaoFer: "",
    Observacao: "",
    ImagemURL: ""
  };
  onAddFerramenta(newTool);

  setManualTool({ Patrimonio: "", Serial: "", Descricao: "" });
  setFilteredOptions(descricaoOptions);
  setShowManualAdd(false);
};

  const isManualDisabled = !(manualTool.Patrimonio || manualTool.Serial) || !manualTool.Descricao;

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* ---------- MODAL PRINCIPAL ---------- */}
      <div className="fixed inset-0 flex bg-black/90 items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-(--backgroundfirst) p-3 rounded-md w-full max-w-xl">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-300 mb-2">
            <h2 className="text-xl font-semibold text-zinc-700">Adicionar Ferramenta</h2>
            <button onClick={onClose} className="text-zinc-400/80 hover:text-zinc-600"><FaTimes size={22} /></button>
          </div>

          {/* ---------- BUSCA ---------- */}
          <div className="flex flex-col gap-2 mb-2">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch(searchTerm)}
              placeholder="Digite Patrimônio ou Serial"
              className="w-full p-2.5 text-md placeholder:normal-case uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
            />

            <div className="flex flex-row gap-2">
              <button
                type="button"
                onClick={() => { setScanActive(false); handleSearch(searchTerm); }}
                disabled={loadingSearch}
                className={`flex-1 text-xl shadow flex items-center justify-center gap-2 p-2 rounded-md ${loadingSearch ? "bg-(--red) cursor-not-allowed" : "bg-(--red) hover:bg-(--reddark) text-white"}`}
              >
                {loadingSearch ? <FaSpinner className="animate-spin text-white" /> : <FaSearch />}
              </button>

              <button
                type="button"
                onClick={() => { setFoundTools([]); setScanActive(prev => !prev); }}
                className="flex-1 text-xl shadow flex items-center justify-center gap-2 p-2 rounded-md bg-(--blue) hover:bg-(--bluedark) text-white"
              >
                <FaQrcode />
              </button>

              <button
                type="button"
                onClick={() => { setFoundTools([]); setScanActive(false); setShowManualAdd(true); }}
                className="flex-1 font-medium shadow flex items-center justify-center gap-2 p-2 rounded-md bg-(--purple) hover:bg-(--purpledark) text-white"
              >
                Manual
              </button>
            </div>
          </div>

          {/* ---------- RESULTADOS ---------- */}
          {foundTools.length > 0 && (
            <div className="mt-5 max-h-80 overflow-y-auto flex flex-col gap-2">
              {foundTools.map(tool => (
                <div key={tool.PATRIMONIO ?? tool.NUMSER} className="bg-zinc-50 p-4 border border-zinc-300 rounded-md flex flex-col">
                  <p><strong>Patrimônio:</strong> {tool.PATRIMONIO ?? "—"}</p>
                  <p><strong>Serial:</strong> {tool.NUMSER ?? "—"}</p>
                  <p><strong>Item:</strong> {tool.DESCRICAO ?? "—"}</p>
                  <button
                    onClick={() => handleAddToolClick(tool, false)}
                    className="w-full p-2 mt-2 bg-(--green) text-white font-medium rounded-md hover:bg-(--greendark) flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Adicionar Ferramenta
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ---------- QR VIDEO ---------- */}
          {scanActive && (
            <div className="relative mt-3 border-2 border-zinc-300 rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full rounded-md aspect-video object-cover bg-black" muted playsInline />
              <p className="absolute bottom-1 right-1 text-xs text-white/80 bg-black/60 px-2 py-0.5 rounded">Aponte para o QR Code</p>
            </div>
          )}

          {loadingSearch && <div className="text-center text-zinc-500 mt-3">Carregando ferramentas...</div>}
        </div>
      </div>

      {/* ---------- MODAL MANUAL ---------- */}
      {showManualAdd && (
        <div className="fixed inset-0 flex bg-black/50 items-center justify-center z-50 p-3">
          <div className="bg-(--backgroundfirst) p-3 rounded-md w-full max-w-md">
            <div className="flex justify-between pb-2 border-b border-zinc-300 items-center mb-2">
              <h2 className="text-xl font-semibold text-zinc-700">Adicionar Nova Ferramenta</h2>
              <button onClick={() => setShowManualAdd(false)} className="text-zinc-400/80 hover:text-zinc-600"><FaTimes size={22} /></button>
            </div>

            <div className="flex flex-col gap-2">
              <input type="text" placeholder="Patrimônio (máx. 6 caracteres)" value={manualTool.Patrimonio} onChange={e => setManualTool(prev => ({ ...prev, Patrimonio: e.target.value.toUpperCase().slice(0,6) }))} className="w-full p-2.5 text-md placeholder:normal-case uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all" />
              <input type="text" placeholder="Serial" value={manualTool.Serial} onChange={e => setManualTool(prev => ({ ...prev, Serial: e.target.value.toUpperCase() }))} className="w-full p-2.5 text-md placeholder:normal-case uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all" />
              <div className="relative">
                <input type="text" placeholder="Descrição" value={manualTool.Descricao} onChange={e => { 
                  const val = e.target.value.toUpperCase(); 
                  setManualTool(prev => ({ ...prev, Descricao: val }));
                  setFilteredOptions(descricaoOptions.filter(d => d.toUpperCase().includes(val)));
                }} className="w-full p-2.5 text-md placeholder:normal-case uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all" />
                {filteredOptions.length > 0 && (
                  <ul className="z-10 bg-white border border-zinc-300 w-full max-h-30 text-zinc-500/90 overflow-auto rounded-md mt-2 shadow">
                    {filteredOptions.map((d, i) => (
                      <li key={i} onClick={() => { setManualTool(prev => ({ ...prev, Descricao: d })); setFilteredOptions([]); }} className="p-2 hover:bg-(--primaryfirst)/20 cursor-pointer">{d}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleManualAdd}
                  disabled={isManualDisabled}
                  className={`p-2 rounded-md text-white font-medium transition-colors duration-200 ${isManualDisabled ? "bg-zinc-400 cursor-not-allowed" : "bg-(--green) hover:bg-(--greendark)"}`}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}