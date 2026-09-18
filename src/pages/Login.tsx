import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoModal from "@/components/VideoModal";
import { Button } from "@/components/ui/button";
import { Shield, Lock, User, KeyRound, PlayCircle, ArrowRight } from "lucide-react";
import { activateKey, isUserBlocked } from "@/lib/keys";
import { EXAMPLE_VIDEO, TITLE_LOGO, LOGIN_PROFILE_VIDEO } from "@/lib/assets";
import { useI18n } from "@/lib/i18n";

const CornerBrackets = () => (
  <span aria-hidden className="pointer-events-none absolute inset-0">
    <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-brand" />
    <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-brand" />
    <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-brand" />
    <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-brand" />
  </span>
);

const Login = () => {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("proxy_session");
    if (!raw) return;
    try {
      const session = JSON.parse(raw);
      if (session?.expiresAt && new Date(session.expiresAt).getTime() > Date.now()) navigate("/proxy", { replace: true });
      else localStorage.removeItem("proxy_session");
    } catch {
      localStorage.removeItem("proxy_session");
    }
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanName = name.trim();
    const cleanKey = key.replace(/[\u200B-\u200D\uFEFF\s]/g, '').trim().toUpperCase();
    if (!cleanName) { setError(t("errUser")); return; }
    if (!cleanKey) { setError(t("errKey")); return; }

    setLoading(true);
    try {
      if (await isUserBlocked(cleanKey)) {
        setError(t("errBlocked"));
        setLoading(false);
        return;
      }
      const k = await activateKey(cleanKey, cleanName);
      if (!k) {
        setError(t("errInvalid"));
        setLoading(false);
        return;
      }
      localStorage.setItem("proxy_session", JSON.stringify({
        name: cleanName,
        key: k.key,
        type: k.type,
        expiresAt: k.expiresAt,
        duration: k.duration,
      }));
      navigate("/proxy");
    } catch {
      setError(t("errConn"));
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden flex flex-col items-center justify-center px-3 py-5 sm:py-8">
      <VideoBackground />
      <div className="relative z-10 w-full max-w-[380px] animate-card-in">

        {/* Chamfered tactical frame: gradient skin acts as the 1px border */}
        <div className="clip-panel bg-gradient-to-br from-brand/60 via-border/40 to-brand/25 p-px shadow-brand">
          <div className="clip-panel relative bg-glass/95 px-5 pb-5 pt-4 backdrop-blur-2xl">
            <CornerBrackets />

            {/* Status strip */}
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="animate-blink-dot h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success))]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{t("secureGateway")}</span>
              </div>
              <span className="font-mono text-[9px] tracking-[0.18em] text-brand-soft/80">BKF-07</span>
            </div>

            {/* Centered identity block */}
            <div className="flex flex-col items-center">
              <div className="animate-profile-glow relative h-[74px] w-[74px] shrink-0 rounded-full border border-brand-soft/60 bg-brand-deep p-1">
                <div className="h-full w-full overflow-hidden rounded-full bg-background">
                  <video src={LOGIN_PROFILE_VIDEO} autoPlay loop muted playsInline preload="auto" disablePictureInPicture aria-label="Boykaffx7" className="h-full w-full object-cover pointer-events-none" />
                </div>
                <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-glass bg-success" />
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <img src={TITLE_LOGO} alt="Boykaffx7" className="max-h-9 w-[150px] max-w-full object-contain" draggable={false} />
                <VerifiedBadge size={18} />
              </div>
            </div>

            {/* Security chips */}
            <div className="my-4 flex items-center justify-center gap-2 border-y border-border/60 py-2.5">
              {[{ icon: Shield, label: t("aes") }, { icon: Lock, label: t("tls") }, { icon: User, label: t("auth") }].map(({ icon: Icon, label }) => (
                <span key={label} title={label} className="flex h-7 w-7 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-brand-soft"><Icon className="h-3.5 w-3.5" /></span>
              ))}
            </div>

            {error && (
              <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">{error}</p>
            )}

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">{t("user")}</label>
                <div className="relative">
                  <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-brand/70" />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("userPlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="username"
                    className="h-12 w-full rounded-lg border border-border bg-secondary/45 pl-10 pr-4 text-base text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">{t("accessKey")}</label>
                <div className="relative">
                  <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-brand/70" />
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("keyPlaceholder")}
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                    autoComplete="off"
                    className="h-12 w-full rounded-lg border border-border bg-secondary/45 pl-10 pr-4 text-base font-mono text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="clip-notch-btn h-12 w-full rounded-none bg-brand text-brand-foreground shadow-brand hover:bg-brand/90 active:scale-[0.98]">
                {loading ? t("verifying") : t("enter")} {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>

              <Button type="button" variant="outline" onClick={() => setVideoOpen(true)} className="h-11 w-full rounded-lg border-brand/30 bg-brand/10 text-foreground hover:bg-brand/20 hover:text-foreground">
                <PlayCircle /> <span className="truncate">{t("seeDemo")}</span>
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-3 text-center">
          <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
            {t("footer")}
            <br />{t("footer2")}
          </p>
        </div>
      </div>

      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        src={EXAMPLE_VIDEO}
        title={t("demo")}
      />
    </div>
  );
};

export default Login;
