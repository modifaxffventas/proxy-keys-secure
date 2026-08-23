import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  src: string;
  title?: string;
}

const VideoModal = ({ open, onClose, src, title = "Reproductor" }: Props) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [videoRatio, setVideoRatio] = useState(4 / 3);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      document.body.style.overflow = "hidden";
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = "";
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }, 220);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-6 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "rgba(2,6,20,0.72)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      {/* Compact floating close button */}
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white transition-all"
      >
        <X className="w-4 h-4" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative max-w-[90vw] transition-all duration-250 ease-out ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div
          className="relative overflow-hidden rounded-lg bg-transparent"
          style={{
            border: "1px solid rgba(255,150,150,0.35)",
            boxShadow:
              "0 0 0 1px rgba(220,38,38,0.18) inset, 0 10px 40px -8px rgba(220,38,38,0.45), 0 20px 60px rgba(0,0,0,0.55)",
          }}
        >
          <video
            ref={videoRef}
            src={src}
            controls
            autoPlay
            playsInline
            onLoadedMetadata={(event) => {
              const { videoWidth, videoHeight } = event.currentTarget;
              if (videoWidth > 0 && videoHeight > 0) setVideoRatio(videoWidth / videoHeight);
            }}
            className="block h-auto max-h-[82vh] max-w-[90vw]"
            style={{
              width: `min(90vw, ${Math.round(82 * videoRatio)}vh, 720px)`,
              aspectRatio: videoRatio,
            }}
          />
        </div>

        {title && (
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-white/60">
            {title}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoModal;
