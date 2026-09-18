import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoModal from "@/components/VideoModal";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Globe, User, KeyRound, PlayCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { activateKey, isUserBlocked } from "@/lib/keys";
import { EXAMPLE_VIDEO, TITLE_LOGO, LOGIN_PROFILE_VIDEO } from "@/lib/assets";
import { useI18n, LANGUAGES } from "@/lib/i18n";


const Login = () => {
  const { t, lang, setLang } = useI18n();
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
    <div className="relative min-h-[100dvh] overflow-x-hidden flex flex-col items-center justify-center px-4 py-5 sm:py-8">
      <VideoBackground />
      <div className="relative z-10 w-full max-w-[390px] animate-card-in">
        <form onSubmit={onSubmit} className="relative overflow-hidden rounded-[28px] border border-brand/35 bg-glass/90 px-5 pb-5 pt-4 shadow-brand backdrop-blur-2xl sm:px-6">
          <div aria-hidden className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-brand-soft to-transparent" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="animate-profile-glow relative h-[68px] w-[68px] shrink-0 rounded-full border border-brand-soft/60 bg-brand-deep p-1">
                <div className="h-full w-full overflow-hidden rounded-full bg-background">
                  <video src={LOGIN_PROFILE_VIDEO} autoPlay loop muted playsInline preload="auto" disablePictureInPicture aria-label="Boykaffx7" className="h-full w-full object-cover pointer-events-none" />
                </div>
                <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-glass bg-success" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <img src={TITLE_LOGO} alt="Boykaffx7" className="max-h-10 w-[150px] max-w-full object-contain object-left" draggable={false} />
                  <VerifiedBadge size={18} />
                </div>
                <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">{t("secureGateway")}</p>
              </div>
            </div>
            <div className="relative shrink-0">
              <Globe className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-soft" />
              <select aria-label={t("language")} value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="h-9 w-9 appearance-none rounded-full border border-brand/30 bg-secondary/70 pl-8 text-transparent outline-none focus:ring-2 focus:ring-brand/40">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code} className="bg-background text-foreground">{l.label}</option>)}
              </select>
            </div>
          </div>

          <div className="my-4 flex items-center justify-between gap-2 border-y border-border/60 py-2.5">
            <div>
              <p className="text-xs font-semibold text-foreground">{t("secureAccess")}</p>
              <p className="text-[9px] text-muted-foreground">{t("enterCreds")}</p>
            </div>
            <div className="flex gap-1.5">
              {[{ icon: Shield, label: t("aes") }, { icon: Lock, label: t("tls") }, { icon: Globe, label: t("auth") }].map(({ icon: Icon, label }) => (
                <span key={label} title={label} className="flex h-7 w-7 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-brand-soft"><Icon className="h-3.5 w-3.5" /></span>
              ))}
            </div>
          </div>

          {error && (
            <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">{error}</p>
          )}

          <div className="space-y-3.5">
          <div>
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium mb-1 block">{t("user")}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("userPlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-border bg-secondary/45 pl-10 pr-4 text-base text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium mb-1 block">{t("accessKey")}</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("keyPlaceholder")}
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-border bg-secondary/45 pl-10 pr-4 text-base font-mono text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-brand text-brand-foreground shadow-brand hover:bg-brand/90 active:scale-[0.98]">
            {loading ? t("verifying") : t("enter")} {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            <Button type="button" variant="outline" onClick={() => setVideoOpen(true)} className="h-11 rounded-xl border-brand/30 bg-brand/10 text-foreground hover:bg-brand/20 hover:text-foreground">
              <PlayCircle /> <span className="truncate">{t("seeDemo")}</span>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-xl border-border bg-secondary/60 text-foreground hover:bg-secondary hover:text-foreground"
            >
              <a href="https://t.me/wildzinv_bot" target="_blank" rel="noopener noreferrer">
                <ShoppingBag />
                <span className="truncate">Comprar</span>
              </a>
            </Button>
          </div>
          </div>
          </form>

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
