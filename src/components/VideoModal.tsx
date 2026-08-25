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

        <div className="mt-3 max-h-[22vh] overflow-y-auto rounded-xl border border-red-400/30 bg-black/50 p-3 backdrop-blur-md">
          <p className="text-center text-[13px] font-semibold leading-snug text-white">
            𝐁𝐨𝐲𝐤𝐚𝐟𝐟𝐱𝟕 — 𝐄𝐥 𝐦𝐞𝐣𝐨𝐫 𝐚𝐮𝐱𝐢𝐥𝐢𝐚𝐫 𝐝𝐞 𝐦𝐢𝐫𝐚
          </p>
          <p className="mt-1.5 text-center text-[11px] leading-relaxed text-white/70">
            𝐌𝐞𝐣𝐨𝐫𝐚 𝐭𝐮 𝐩𝐫𝐞𝐜𝐢𝐬𝐢ó𝐧 𝐲 𝐥𝐥𝐞𝐯𝐚 𝐭𝐮 𝐞𝐱𝐩𝐞𝐫𝐢𝐞𝐧𝐜𝐢𝐚 𝐚𝐥 𝐬𝐢𝐠𝐮𝐢𝐞𝐧𝐭𝐞 𝐧𝐢𝐯𝐞𝐥.
          </p>
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-white/50">
            𝐂𝐨𝐦𝐩𝐫𝐚 𝐭𝐮 𝐜𝐨𝐧𝐭𝐫𝐚𝐬𝐞ñ𝐚 𝐚𝐪𝐮í
          </p>
          <a
            href="https://reesendshop.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[12px] font-semibold text-white transition-transform active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #3a0606 0%, #8f1010 55%, #e11d1d 100%)",
              border: "1px solid rgba(255,150,150,0.55)",
              boxShadow: "0 8px 22px -10px rgba(220,38,38,0.75)",
            }}
          >
            reesendshop.vercel.app
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
