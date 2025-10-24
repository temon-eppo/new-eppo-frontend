import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaTimes, FaSearch, FaPlus, FaSpinner, FaQrcode } from "react-icons/fa";
import QrScanner from "qr-scanner";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, getDocs, where } from "firebase/firestore";
import ModalAddTool from "./ModalAddTool";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useFerramentasCache } from "../hooks/useFerramentasCache";

const API_URL = "https://backend-eppo-obras.onrender.com/api";

// ---------------- QR SCANNER ----------------
function QRScanner({ onScan, active }) {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    if (!active || !videoRef.current) return;

    const videoEl = videoRef.current;

    // Garante que o scanner anterior seja parado
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }

    qrScannerRef.current = new QrScanner(
      videoEl,
      (result) => {
        // ✅ Corrige o retorno — o texto vem em result.data
        if (result?.data) {
          onScan(result.data.trim());
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
        maxScansPerSecond: 8,
        returnDetailedScanResult: true,
      }
    );

    // ✅ Start com foco e delay para inicializar a câmera
    qrScannerRef.current.start().catch((err) => {
      console.error("Erro ao iniciar câmera:", err);
    });

    return () => {
      qrScannerRef.current?.stop();
      qrScannerRef.current?.destroy();
      qrScannerRef.current = null;
    };
  }, [active, onScan]);

  return (
    <div className="relative mt-3 border border-zinc-400 rounded-md overflow-hidden">
      <video
        ref={videoRef}
        className="w-full rounded-md aspect-video object-cover bg-black"
        muted
        playsInline
      />
      <p className="absolute bottom-1 right-2 text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded">
        Aponte para o QR Code
      </p>
    </div>
  );
}

// ---------------- MODAL TOOLS ----------------
export function ModalTools({ onClose, onAddFerramenta, selectedTools }) {
  const [userObra, setUserObra] = useState("");
  const [activeTools, setActiveTools] = useState([]);
  const [foundTools, setFoundTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [showAddTool, setShowAddTool] = useState(false);

  // ---------------- CARREGA OBRA ----------------
  useEffect(() => {
    const fetchUserObra = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) setUserObra(userDoc.data().obra);
    };
    fetchUserObra();
  }, []);

  // ---------------- FERRAMENTAS EM CAMPO ----------------
  useEffect(() => {
    if (!userObra) return;

    const fetchActiveTools = async () => {
      try {
        const q = query(collection(db, "relatorios"), where("Obra", "==", userObra));
        const snapshot = await getDocs(q);
        const tools = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.Ferramentas)) {
            data.Ferramentas.forEach((f) => {
              if (f.EstadoFer === "EM CAMPO" && data.EstadoRel === "EM CAMPO") {
                f.NumRelatorio = data.NumRelatorio;
                tools.push(f);
              }
            });
          }
        });
        setActiveTools(tools);
      } catch (err) {
        console.error("Erro ao buscar ferramentas EM CAMPO:", err);
        toast.error("Erro ao buscar ferramentas em campo!");
        setActiveTools([]);
      }
    };

    fetchActiveTools();
  }, [userObra]);

  // ---------------- USE FERRAMENTAS CACHE ----------------
  const { ferramentas: cachedFerramentas, loading: cacheLoading } = useFerramentasCache(userObra);

  // ---------------- HANDLE SEARCH ----------------
  const handleSearch = useCallback(
    async (term) => {
      if (loading || cacheLoading) return;
      setFoundTools([]);
      const searchValue = term?.trim() || searchTerm.trim();
      if (!searchValue) return;

      setLoading(true);

      // 1️⃣ Busca no cache
      let results = cachedFerramentas.filter(
        (f) =>
          f.PATRIMONIO === searchValue.toUpperCase() ||
          f.NUMSER === searchValue.toUpperCase()
      );

      // 2️⃣ Se não encontrar no cache, busca API
      if (results.length === 0) {
        try {
          let queryTerm = searchValue;
          if (/^\d{5}$/.test(searchValue)) queryTerm = `B${searchValue}`;

          const res = await fetch(`${API_URL}/ferramentas/${encodeURIComponent(queryTerm)}`);
          if (!res.ok) throw new Error("Ferramenta não localizada!");
          const dataJson = await res.json();
          results = Array.isArray(dataJson) ? dataJson : [dataJson];

          // Marca baterias
          results = results.map((f) => {
            if (f.CODIGO === "531080001") f.IsBattery = true;
            return f;
          });
        } catch (err) {
          console.error(err);
        }
      }

      if (results.length === 0) toast.error("Ferramenta não localizada!");
      setFoundTools(results);
      setLoading(false);
    },
    [searchTerm, cachedFerramentas, loading, cacheLoading]
  );

  // ---------------- HANDLE SCAN ----------------
  const handleScan = async (data) => {
    if (typeof data === "string" && data.trim()) {
      setFoundTools([]);
      const scannedTerm = data.trim();
      setSearchTerm(scannedTerm);
      setScanActive(false);
      await handleSearch(scannedTerm);
    }
  };

  // ---------------- ADD TOOL ----------------
  const handleAddToolClick = (tool, autoClose = true) => {
    // Normalização de patrimônio para baterias
    const normalizePatrimonio = (patrimonio, codigo) =>
      codigo === "531080001" ? patrimonio.replace(/^B/, "") : patrimonio;

    // ✅ Verifica se já existe no relatório atual
    const duplicate = selectedTools.find(
      (t) =>
        normalizePatrimonio(tool.PATRIMONIO, tool.CODIGO) === normalizePatrimonio(t.Patrimonio, tool.CODIGO) &&
        tool.NUMSER === t.Serial
    );
    if (duplicate) {
      toast.error("Ferramenta já selecionada neste relatório!");
      return;
    }

    // Verifica se está em outro relatório
    const inOtherReport = activeTools.find(
      (t) =>
        (t.Patrimonio === tool.PATRIMONIO || t.Serial === tool.NUMSER) &&
        !selectedTools.some((s) => s.Patrimonio === t.Patrimonio && s.Serial === t.Serial)
    );
    if (inOtherReport) {
      toast.error(`Ferramenta está em uso no relatório #${inOtherReport.NumRelatorio}`);
      return;
    }

    onAddFerramenta({
      Patrimonio: tool.PATRIMONIO,
      Serial: tool.NUMSER,
      Item: tool.DESCRICAO,
      EstadoFer: "EM CAMPO",
      DataAberturaFer: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      DataConclusaoFer: "",
      Observacao: "",
      ImagemURL: "",
    });

    toast.success("Ferramenta adicionada!");
    if (autoClose) onClose();
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="fixed inset-0 flex bg-black/90 items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-(--backgroundfirst) p-3 rounded-md w-full max-w-xl">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-300 mb-2">
            <h2 className="text-xl font-semibold text-zinc-700">Adicionar Ferramenta</h2>
            <button onClick={onClose} className="text-zinc-400/80 hover:text-zinc-600" aria-label="Fechar modal">
              <FaTimes size={22} />
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Digite Patrimônio ou Serial"
              className="w-full p-2.5 text-md placeholder:normal-case uppercase text-zinc-500/90 rounded-md bg-white shadow border border-zinc-300 focus:outline-none focus:ring focus:border-(--primaryfirst) focus:ring-(--primaryfirst) transition-all"
            />
            <div className="flex flex-row gap-2">
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading || cacheLoading}
                className={`flex-1 text-xl shadow flex items-center justify-center gap-2 p-2 rounded-md ${
                  loading || cacheLoading ? "bg-(--red) cursor-not-allowed" : "bg-(--red) hover:bg-(--reddark) text-white"
                }`}
                aria-label="Buscar ferramenta"
              >
                {loading || cacheLoading ? <FaSpinner className="animate-spin text-white" /> : <FaSearch />}
              </button>
              <button
                type="button"
                onClick={() => !loading && setScanActive((prev) => !prev)}
                className="flex-1 text-xl shadow flex items-center justify-center gap-2 p-2 rounded-md bg-(--blue) hover:bg-(--bluedark) text-white"
                aria-label="Abrir scanner QR"
              >
                <FaQrcode />
              </button>
              <button
                type="button"
                onClick={() => setShowAddTool(true)}
                className="flex-1 font-medium shadow flex items-center justify-center gap-2 p-2 rounded-md bg-(--purple) hover:bg-(--purpledark) text-white"
                aria-label="Adicionar manualmente"
              >
                Manual
              </button>
            </div>
          </div>

          {foundTools.length > 0 && (
            <div className="mt-5 max-h-80 overflow-y-auto flex flex-col gap-2">
              {foundTools.map((tool) => (
                <div key={tool.PATRIMONIO ?? tool.NUMSER} className="bg-zinc-50 p-4 border border-zinc-300 rounded-md flex flex-col">
                  <p className="text-zinc-500/90"><span className="font-medium text-zinc-700">Patrimônio:</span> {tool.PATRIMONIO ?? "—"}</p>
                  <p className="text-zinc-500/90"><span className="font-medium text-zinc-700">Serial:</span> {tool.NUMSER ?? "—"}</p>
                  <p className="text-zinc-500/90"><span className="font-medium text-zinc-700">Item:</span> {tool.DESCRICAO ?? "—"}</p>
                  <button
                    onClick={() => handleAddToolClick(tool)}
                    disabled={activeTools.length === 0}
                    className="w-full p-2 mt-2 bg-(--green) text-white font-medium rounded-md hover:bg-(--greendark) flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Adicionar Ferramenta
                  </button>
                </div>
              ))}
            </div>
          )}

          {scanActive && <QRScanner active={scanActive} onScan={handleScan} />}
          {(loading || cacheLoading) && <div className="text-center text-zinc-500 mt-3">Carregando ferramentas...</div>}
        </div>
      </div>

      {showAddTool && (
        <ModalAddTool
          selectedTools={selectedTools}
          activeTools={activeTools}
          cachedFerramentas={cachedFerramentas}
          onAddFerramenta={(tool) => {
            onAddFerramenta(tool);
            onClose();
          }}
          closeAllModals={() => setShowAddTool(false)}
        />
      )}
    </>
  );
}

export default ModalTools;
