import { useState, useRef, useEffect } from "react";
import { FaTrash, FaTimes } from "react-icons/fa";

export default function Detalhes({ observacao, setObservacao, photos, setPhotos, showCamera, setShowCamera }) {
  const [open, setOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Inicia a câmera traseira quando showCamera = true
  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        // Forçando câmera traseira
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } }
        });
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.warn("Câmera traseira não disponível, use upload de foto:", err);
        setVideoStream(null);
      }
    };

    if (showCamera) startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [showCamera]);

  const closeCamera = () => setShowCamera(false);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/png");
    setPhotos(prev => [...prev, dataURL]);
    closeCamera();
  };

  const handleRemovePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="bg-(--backgroundfirst) border border-zinc-300 rounded-md mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-zinc-700 font-medium text-center py-1 rounded-lg hover:bg-zinc-400 transition"
        >
          Detalhes ▼
        </button>
      ) : (
        <div className="p-3 space-y-3">
          {/* Observação */}
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-1">Observação</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full min-h-[75px] p-2 border bg-white border-zinc-300 rounded-md text-sm text-zinc-500/90 focus:outline-none focus:border-(--primaryfirst) resize-y"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-1">Fotos</label>
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full bg-(--blue) text-white p-2 rounded-md hover:bg-(--bluedark) transition font-medium"
            >
              Abrir Câmera
            </button>

            {/* Upload alternativo caso câmera traseira não funcione */}
            {showCamera && !videoStream && (
              <div className="mt-2">
                <label className="w-full bg-(--blue) text-white p-2 rounded-md hover:bg-(--bluedark) cursor-pointer text-center block">
                  Enviar Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setPhotos(prev => [...prev, reader.result]);
                        setShowCamera(false);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
            )}

            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={p}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-20 object-cover rounded-md border border-zinc-400 cursor-pointer"
                      onClick={() => setPreviewPhoto(p)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-white text-(--red) p-1 rounded-full"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-zinc-500/90 mt-2 underline block mx-auto"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Camera Web Fullscreen */}
      {showCamera && videoStream && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-2">
          <div className="relative w-full max-w-full md:max-w-2xl md:h-[50vh] h-full rounded-md overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-md"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-4 left-0 w-full flex justify-center gap-4 px-4">
              <button
                onClick={takePhoto}
                className="bg-(--green) text-white px-6 py-3 rounded-full shadow-lg hover:bg-(--greendark) transition"
              >
                Tirar Foto
              </button>
              <button
                onClick={closeCamera}
                className="bg-(--red) text-white px-6 py-3 rounded-full shadow-lg hover:bg-(--reddark) transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3">
          <button
            onClick={() => setPreviewPhoto(null)}
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:text-(--primaryfirst) transition"
          >
            <FaTimes size={25} />
          </button>
          <img
            src={previewPhoto}
            alt="Preview"
            className="max-h-100% max-w-100% md:max-h-[80%] md:max-w-[90%] object-contain rounded-md shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
