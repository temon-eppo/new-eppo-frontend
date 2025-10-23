// src/pages/Imports.jsx
import { useState, useRef, useEffect } from "react";
import { FaUpload, FaTimes } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { NavBar } from "../components/NavBar";
import { BottomBar } from "../components/BottomBar";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import Loading from "../components/Loading"; // ✅ agora usando o novo Loading

// ----------------------------
// Upload Card
// ----------------------------
function UploadCard({ title, file, setFile, inputRef, loading, onUpload, color, disableOther }) {
  const isDisabled = disableOther && !file;

  const removeFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = null;
  };

  const displayFileName = file
    ? file.name.length > 20
      ? file.name.substring(0, 17) + "..."
      : file.name
    : "Selecionar arquivo...";

  return (
    <div className="bg-neutral-50 shadow-md rounded-lg p-4 w-full md:w-1/3 max-w-sm flex flex-col gap-4 transition-all">
      <h2 className="text-xl font-semibold text-neutral-600 text-center">{title}</h2>

      <div className="flex items-center gap-2 relative">
        {/* Input oculto */}
        <input
          type="file"
          accept=".xlsx, .xls"
          ref={inputRef}
          onChange={(e) => setFile(e.target.files[0])}
          disabled={loading || isDisabled}
          className="absolute w-0 h-0 opacity-0"
        />

        {/* Input visual */}
        <div
          onClick={() => !loading && !isDisabled && inputRef.current?.click()}
          className={`flex-1 border-2 rounded px-3 py-3 text-ellipsis overflow-hidden whitespace-nowrap select-none cursor-pointer transition-colors
            ${
              loading
                ? "bg-neutral-200 cursor-not-allowed text-neutral-400"
                : isDisabled
                ? "bg-neutral-100 border-neutral-300 text-neutral-300 cursor-not-allowed"
                : file
                ? "border-[#5DD63E] bg-[#E2FFDB] text-neutral-700"
                : "border-neutral-300 bg-neutral-50 hover:bg-neutral-200 text-neutral-700"
            }`}
        >
          {displayFileName}
        </div>

        {/* Remover arquivo */}
        {file && (
          <button
            onClick={removeFile}
            className="absolute right-17 top-4 text-xl text-red-400 hover:text-red-500"
          >
            <FaTimes />
          </button>
        )}

        {/* Botão upload */}
        <button
          onClick={onUpload}
          disabled={loading || !file}
          className={`flex-shrink-0 w-12 h-12 rounded flex items-center justify-center transition-colors ${
            loading ? "bg-neutral-400 cursor-not-allowed text-neutral-100" : color
          }`}
        >
          {loading ? <span className="font-mono">...</span> : <FaUpload />}
        </button>
      </div>
    </div>
  );
}

// ----------------------------
// Página Imports
// ----------------------------
export default function Imports() {
  const [toolsFile, setToolsFile] = useState(null);
  const [employeeFile, setEmployeeFile] = useState(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const toolsInputRef = useRef(null);
  const employeeInputRef = useRef(null);
  const navigate = useNavigate();

  // Pega o role do localStorage
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || role !== "Dev") {
      navigate("/"); // redireciona se não for Dev
    } else {
      setUserRole(role);
    }
  }, [navigate]);

  const API_BASE = "https://backend-eppo-obras.onrender.com";
  const isAnyLoading = loadingTools || loadingEmployees;

  const sendExcelBatch = async (file, endpoint, setLoadingState, inputRef) => {
    if (!file) {
      toast.error("Selecione um arquivo primeiro!");
      return;
    }

    setLoadingState(true);

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      const chunkSize = 500;

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const isFirstBatch = i === 0;

        const res = await fetch(`${API_BASE}/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-first-batch": isFirstBatch ? "true" : "false",
          },
          body: JSON.stringify(chunk),
        });

        if (!res.ok) throw new Error("Erro ao enviar os dados");
      }

      toast.success("Upload concluído com sucesso!");
      if (inputRef.current) inputRef.current.value = null;
      if (endpoint === "upload-tools") setToolsFile(null);
      if (endpoint === "upload-employees") setEmployeeFile(null);
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao enviar os dados: ${err.message}`);
    } finally {
      setLoadingTools(false);
      setLoadingEmployees(false);
    }
  };

  if (userRole !== "Dev") return null;

  return (
    <div className="font-display flex flex-col min-h-screen bg-neutral-100 relative">
      <NavBar />
      <Toaster />

      {/* Loading global */}
      <Loading loadings={[isAnyLoading]} /> {/* ✅ substituição aqui */}

      <h1 className="text-2xl font-semibold text-neutral-600 mt-25 mb-5 text-center">
        IMPORTAR PLANILHAS
      </h1>

      <div className="flex flex-col md:flex-row items-start md:justify-center gap-8 p-4 w-full max-w-6xl mx-auto">
        <UploadCard
          title="Ferramentas"
          file={toolsFile}
          setFile={setToolsFile}
          inputRef={toolsInputRef}
          loading={loadingTools}
          onUpload={() => sendExcelBatch(toolsFile, "upload-tools", setLoadingTools, toolsInputRef)}
          color="bg-[#7EBA4A] hover:bg-[#709E49] text-white"
          disableOther={employeeFile !== null}
        />

        <UploadCard
          title="Funcionários"
          file={employeeFile}
          setFile={setEmployeeFile}
          inputRef={employeeInputRef}
          loading={loadingEmployees}
          onUpload={() =>
            sendExcelBatch(employeeFile, "upload-employees", setLoadingEmployees, employeeInputRef)
          }
          color="bg-[#7EBA4A] hover:bg-[#709E49] text-white"
          disableOther={toolsFile !== null}
        />
      </div>

      <BottomBar />
    </div>
  );
}
