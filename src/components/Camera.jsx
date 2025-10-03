// src/components/Camera.jsx
import { useRef, useEffect } from "react";

export default function Camera({ photos, setPhotos, showCamera, setShowCamera }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!showCamera) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        alert("Não foi possível acessar a câmera. Verifique permissões ou dispositivo.");
        setShowCamera(false);
      }
    };

    startCamera();

    // Cleanup: parar câmera ao fechar modal
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [showCamera, setShowCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");

    setPhotos((prev) => [...prev, dataUrl]);
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  if (!showCamera) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-md rounded-lg shadow-lg"
      ></video>

      <canvas ref={canvasRef} className="hidden"></canvas>

      <div className="flex gap-3 mt-4">
        <button
          onClick={capturePhoto}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Capturar
        </button>
        <button
          onClick={closeCamera}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Concluir
        </button>
      </div>
    </div>
  );
}
