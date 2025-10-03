import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaTimes, FaSearch, FaPlus, FaSpinner, FaQrcode } from "react-icons/fa";
import QrScanner from "qr-scanner";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, getDocs, where } from "firebase/firestore";
import ModalAddTool from "./ModalAddTool";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "https://backend-eppo-obras.onrender.com/api";

// Componente auxiliar para leitura de QR Code
function QRScanner({ onScan, active }) {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    if (!active || !videoRef.current) return;

    // Corrigido: result é a string lida
    qrScannerRef.current = new QrScanner(videoRef.current, (result) => onScan(result));
    qrScannerRef.current.start();

    return () => {
      qrScannerRef.current?.destroy();
      qrScannerRef.current = null;
    };
  }, [active, onScan]);

  useEffect(() => {
    if (!active) qrScannerRef.current?.stop();
  }, [active]);

  return <video ref={videoRef} className="w-full rounded" />;
}

export function ModalTools({ onClose, onAddFerramenta, selectedTools }) {
  const [userObra, setUserObra] = useState("");
  const [activeTools, setActiveTools] = useState(null);
  const [foundTools, setFoundTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [showAddTool, setShowAddTool] = useState(false);

  // ================= CARREGA OBRA DO USUÁRIO =================
  useEffect(() => {
    const fetchUserObra = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) setUserObra(userDoc.data().obra);
    };
    fetchUserObra();
  }, []);

  // ================= BUSCA FERRAMENTAS EM CAMPO =================
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

  // ================= HANDLE SEARCH =================
  const handleSearch = useCallback(
    async (term) => {
      if (loading) return;
      const searchValue = term?.trim() || searchTerm.trim();
      if (!searchValue) return;

      setLoading(true);
      setFoundTools([]);

      let queryTerm = searchValue;
      if (/^\d{5}$/.test(queryTerm)) queryTerm = `B${queryTerm}`;

      try {
        const res = await fetch(`${API_URL}/ferramentas/${encodeURIComponent(queryTerm)}`);
        if (!res.ok) throw new Error("Ferramenta não localizada!");
        const dataJson = await res.json();
        const dataArray = Array.isArray(dataJson) ? dataJson : [dataJson];

        let filteredTools = dataArray;
        if (/^B\d{5}$/.test(queryTerm)) {
          filteredTools = filteredTools.filter((t) => t.COD_FERRA_COB === "531080001");
        }

        if (filteredTools.length === 0) {
          toast.error("Ferramenta não localizada!");
          return;
        }

        setFoundTools(filteredTools);
      } catch (err) {
        console.error(err);
        toast.error("Ferramenta não localizada!");
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, loading]
  );

  // ================= HANDLE SCAN =================
  const handleScan = async (data) => {
    if (typeof data === "string" && data.trim()) {
      const scannedTerm = data.trim();
      setSearchTerm(scannedTerm);
      setScanActive(false);
      setFoundTools([]);
      await handleSearch(scannedTerm);
    }
  };

  // ================= ADICIONA FERRAMENTA =================
  const handleAddToolClick = (tool) => {
    const duplicate = selectedTools.find(
      (t) => t.Patrimonio === tool.PATRIMONIO && t.Serial === tool.NUMSER
    );
    if (duplicate) {
      toast.error("Ferramenta já selecionada neste relatório!");
      return;
    }

    const inOtherReport = activeTools?.find(
      (t) =>
        (t.Patrimonio === tool.PATRIMONIO || t.Serial === tool.NUMSER) &&
        !selectedTools.some((s) => s.Patrimonio === t.Patrimonio && s.Serial === t.Serial)
    );
    if (inOtherReport) {
      toast.error(`Ferramenta em uso no Rel. #${inOtherReport.NumRelatorio}`);
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
    onClose();
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-neutral-100 p-3 rounded-xl shadow w-full max-w-xl">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-neutral-600">Adicionar Ferramenta</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-500" aria-label="Fechar modal">
              <FaTimes size={22} />
            </button>
          </div>

          {/* Search Input */}
          <div className="flex flex-col gap-2 mb-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Digite Patrimônio ou Serial"
              className="flex-1 px-3 py-3 bg-white text-md text-neutral-500 shadow rounded focus:outline-none focus:ring-2 focus:ring-[#E35A4D]"
            />

            {/* Botões */}
            <div className="flex flex-row gap-2">
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading || activeTools === null}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded ${
                  loading ? "bg-[#E35A4D] cursor-not-allowed" : "bg-[#E35A4D] hover:bg-[#BA544A] shadow text-white"
                }`}
              >
                {loading ? <FaSpinner className="animate-spin text-white" /> : <FaSearch />}
              </button>

              <button
                type="button"
                onClick={() => setScanActive((prev) => !prev)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded bg-[#59C9DE] hover:bg-[#4AA9BA] shadow text-white"
              >
                <FaQrcode />
              </button>

              <button
                type="button"
                onClick={() => setShowAddTool(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded bg-violet-400 shadow hover:bg-violet-500 text-white"
              >
                Manual
              </button>
            </div>
          </div>

          {scanActive && <QRScanner active={scanActive} onScan={handleScan} />}
          {loading && <div className="text-center text-neutral-500 mt-3">Carregando ferramentas...</div>}

          {foundTools.length > 0 && (
            <div className="mt-5 max-h-80 overflow-y-auto flex flex-col gap-2">
              {foundTools.map((tool) => (
                <div key={tool.PATRIMONIO || tool.NUMSER} className="bg-neutral-300/50 p-3 rounded flex flex-col">
                  <div className="text-md text-neutral-600 mb-2 flex justify-between">
                    <span><b>Pat:</b> {tool.PATRIMONIO || "—"}</span>
                    <span><b>Serial:</b> {tool.NUMSER || "—"}</span>
                  </div>
                  <span className="text-md mb-2 text-neutral-600"><b>Item:</b> {tool.DESCRICAO || "—"}</span>
                  <button
                    onClick={() => handleAddToolClick(tool)}
                    disabled={activeTools === null}
                    className="w-full px-3 py-3 bg-[#7EBA4A] text-white rounded hover:bg-[#709E49] flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Adicionar Ferramenta
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Manual */}
      {showAddTool && (
        <ModalAddTool
          selectedTools={selectedTools}
          activeTools={activeTools || []}
          onAddFerramenta={(tool) => {
            onAddFerramenta(tool);
            onClose(); // fecha ModalTools
          }}
          closeAllModals={() => setShowAddTool(false)}
        />
      )}
    </>
  );
}

export default ModalTools;
