import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
};

const ADMIN_PASSWORDS = ["rave117", "boyka117", "117"];

const DURATION_MS: Record<string, number> = {
  "1 Día": 24 * 60 * 60 * 1000,
  "7 Días": 7 * 24 * 60 * 60 * 1000,
  "30 Días": 30 * 24 * 60 * 60 * 1000,
};

const BTN_GEN = "🏦 Generate License";
const BTN_ACCOUNT = "*️⃣ Account";
const BTN_STATS = "⏺️ Statistics";

const MAIN_KEYBOARD = {
  keyboard: [[{ text: BTN_GEN }], [{ text: BTN_ACCOUNT }, { text: BTN_STATS }]],
  resize_keyboard: true,
  is_persistent: true,
};

const NAV_ROW = [
  { text: "🔙 Atrás", callback_data: "nav:back" },
  { text: "🏠 Inicio", callback_data: "nav:home" },
];

const PAGE_SIZE = 6;

async function tg(method: string, body: any) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not configured");
    return null;
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) console.error("tg api error", method, response.status, await response.text());
    return response;
  } catch (e) {
    console.error("tg error", method, e);
    return null;
  }
}

const reply = (chat_id: number, text: string, extra: any = {}) =>
  tg("sendMessage", { chat_id, text, parse_mode: "HTML", reply_markup: MAIN_KEYBOARD, ...extra });

const send = (chat_id: number, text: string, inline: any[][]) =>
  tg("sendMessage", {
    chat_id,
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: inline },
  });

const edit = (chat_id: number, message_id: number, text: string, inline: any[][]) =>
  tg("editMessageText", {
    chat_id,
    message_id,
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: inline },
  });

const ack = (id: string, text = "") =>
  tg("answerCallbackQuery", { callback_query_id: id, text });

// ---------- session / pending state ----------
async function getPending(supabase: any, chatId: number): Promise<any> {
  const { data } = await supabase
    .from("telegram_admin_sessions")
    .select("pending")
    .eq("chat_id", String(chatId))
    .maybeSingle();
  return data?.pending ?? null;
}
async function setPending(supabase: any, chatId: number, value: any) {
  await supabase.from("telegram_admin_sessions").upsert(
    { chat_id: String(chatId), pending: value, last_seen_at: new Date().toISOString() },
    { onConflict: "chat_id" },
  );
}
async function clearPending(supabase: any, chatId: number) {
  await supabase.from("telegram_admin_sessions").update({ pending: null }).eq("chat_id", String(chatId));
}

function isAllowedAdmin(chatId: number, adminId: string): boolean {
  return !adminId || String(chatId) === String(adminId);
}

async function isAuthed(supabase: any, chatId: number, adminId: string): Promise<boolean> {
  if (!isAllowedAdmin(chatId, adminId)) return false;
  const { data } = await supabase
    .from("telegram_admin_sessions")
    .select("chat_id, authenticated_at")
    .eq("chat_id", String(chatId))
    .maybeSingle();
  return !!data?.authenticated_at;
}

async function saveAuth(supabase: any, chatId: number) {
  await supabase.from("telegram_admin_sessions").upsert(
    {
      chat_id: String(chatId),
      authenticated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      pending: null,
    },
    { onConflict: "chat_id" },
  );
}

// ---------- keys ----------
function genKey(): string {
  let k = String(1 + Math.floor(Math.random() * 9));
  for (let i = 0; i < 9; i++) k += String(Math.floor(Math.random() * 10));
  return k;
}

async function createKeys(supabase: any, duration: string, quantity: number): Promise<string[]> {
  const count = Math.max(1, Math.min(100, Number(quantity) || 1));
  const durationMs = DURATION_MS[duration] || 0;
  const rows = Array.from({ length: count }, () => ({
    key: genKey(),
    type: "Normal",
    status: "Activa",
    duration,
    duration_ms: durationMs,
    created_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("proxy_keys").insert(rows);
  if (error) throw new Error(`createKeys failed: ${error.message}`);
  return rows.map((r) => r.key);
}

function timeLeft(expiresAt?: string): string {
  if (!expiresAt) return "—";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirada";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------- screens ----------
function durationScreen() {
  return {
    text: "❇️ <b>Selecciona la duración</b>",
    inline: [
      [{ text: "🛍️ 1 Día", callback_data: "dur:1 Día" }],
      [{ text: "🛍️ 7 Días", callback_data: "dur:7 Días" }],
      [{ text: "🛍️ 30 Días", callback_data: "dur:30 Días" }],
      NAV_ROW,
    ],
  };
}

function countScreen(duration: string) {
  return {
    text: `❇️ <b>Password Count</b>\n\nDuración: ${duration}\nEnvía la cantidad (1-100).`,
    inline: [NAV_ROW],
  };
}

function resultScreen(keys: string[]) {
  return {
    text:
      `*️⃣ <b>Generated Passwords: ${keys.length}</b>\n\n` +
      keys.map((k) => `<code>${k}</code>`).join("\n"),
    inline: [[{ text: "Copy Passwords", callback_data: "copy:x" }], NAV_ROW],
  };
}

async function usersScreen(supabase: any, page: number) {
  const from = page * PAGE_SIZE;
  const { data, count } = await supabase
    .from("active_users")
    .select("*", { count: "exact" })
    .order("login_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const rows = (data || []).map((u: any) => [
    { text: u.name, callback_data: `user:${u.key}` },
  ]);
  const total = count ?? 0;
  const nav: any[] = [];
  if (page > 0) nav.push({ text: "🔙 Back", callback_data: `upage:${page - 1}` });
  if (from + PAGE_SIZE < total) nav.push({ text: "Next 🔜", callback_data: `upage:${page + 1}` });
  if (!nav.length) nav.push(...NAV_ROW);
  return {
    text: rows.length
      ? `❇️ <b>Usuarios Activos</b> (${total})`
      : "❇️ <b>Usuarios Activos</b>\n\nSin sesiones activas.",
    inline: [...rows, nav],
  };
}

async function userDetailScreen(supabase: any, key: string) {
  const { data: u } = await supabase.from("active_users").select("*").eq("key", key).maybeSingle();
  if (!u) return { text: "Usuario no encontrado.", inline: [NAV_ROW] };
  const { data: k } = await supabase
    .from("proxy_keys")
    .select("duration,expires_at,status")
    .eq("key", key)
    .maybeSingle();
  const expired = u.expires_at && new Date(u.expires_at).getTime() <= Date.now();
  const estado = u.blocked ? "Bloqueado" : expired ? "Expirado" : "Activo";
  return {
    text:
      `✴️ <b>${u.name}</b>\n\n` +
      `Estado: ${estado}\n` +
      `Password Duration: ${k?.duration || "—"}\n` +
      `Restante: ${timeLeft(u.expires_at)}\n` +
      `Key: <code>${u.key}</code>`,
    inline: [NAV_ROW],
  };
}

async function statsScreen(supabase: any) {
  const [{ data: keyRows }, { data: userRows }] = await Promise.all([
    supabase.from("proxy_keys").select("status,expires_at"),
    supabase.from("active_users").select("blocked,expires_at"),
  ]);
  const keys = keyRows || [];
  const users = userRows || [];
  const now = Date.now();
  const expired = keys.filter(
    (k: any) => k.status === "Expirada" || (k.expires_at && new Date(k.expires_at).getTime() <= now),
  ).length;
  const used = keys.filter((k: any) => k.status === "Usada").length;
  const active = users.filter(
    (u: any) => !u.blocked && (!u.expires_at || new Date(u.expires_at).getTime() > now),
  ).length;
  return {
    text:
      `*️⃣ <b>Full Statistics</b>\n\n` +
      `Active Users: ${active}\n` +
      `Total Generated Passwords: ${keys.length}\n` +
      `Expired Passwords: ${expired}\n` +
      `Used Passwords: ${used}`,
    inline: [NAV_ROW],
  };
}

function homeText() {
  return "<b>Boykaffx7 — Panel</b>\n\nUsa la barra inferior.";
}

// ---------- text handler ----------
async function handleText(supabase: any, chat_id: number, text: string, adminId: string) {
  const trimmed = text.trim();

  if (!isAllowedAdmin(chat_id, adminId)) {
    await tg("sendMessage", { chat_id, text: "Acceso denegado.", reply_markup: { remove_keyboard: true } });
    return;
  }

  const authed = await isAuthed(supabase, chat_id, adminId);
  if (!authed) {
    if (ADMIN_PASSWORDS.includes(trimmed.toLowerCase())) {
      await saveAuth(supabase, chat_id);
      await reply(chat_id, "<b>Acceso concedido</b>\n\n" + homeText());
      return;
    }
    await tg("sendMessage", {
      chat_id,
      parse_mode: "HTML",
      text: "<b>Boykaffx7 Admin</b>\nIngresa la contraseña secreta para continuar:",
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  if (trimmed === "/start" || trimmed === "/inicio") {
    await clearPending(supabase, chat_id);
    await reply(chat_id, homeText());
    return;
  }

  if (trimmed === BTN_GEN || trimmed.toLowerCase() === "/generar") {
    const s = durationScreen();
    const r = await send(chat_id, s.text, s.inline);
    const j = r ? await r.json().catch(() => null) : null;
    await setPending(supabase, chat_id, {
      screen: "duration",
      message_id: j?.result?.message_id ?? null,
    });
    return;
  }

  if (trimmed === BTN_ACCOUNT || trimmed.toLowerCase() === "/usuarios") {
    const s = await usersScreen(supabase, 0);
    const r = await send(chat_id, s.text, s.inline);
    const j = r ? await r.json().catch(() => null) : null;
    await setPending(supabase, chat_id, { screen: "users", page: 0, message_id: j?.result?.message_id ?? null });
    return;
  }

  if (trimmed === BTN_STATS || trimmed.toLowerCase() === "/stats") {
    const s = await statsScreen(supabase);
    const r = await send(chat_id, s.text, s.inline);
    const j = r ? await r.json().catch(() => null) : null;
    await setPending(supabase, chat_id, { screen: "stats", message_id: j?.result?.message_id ?? null });
    return;
  }

  // Password count input
  const p = await getPending(supabase, chat_id);
  if (p?.screen === "count" && p.message_id) {
    const quantity = Number(trimmed);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      await edit(chat_id, p.message_id, "❇️ <b>Password Count</b>\n\nCantidad inválida. Envía un número entre 1 y 100.", [NAV_ROW]);
      return;
    }
    const keys = await createKeys(supabase, p.duration, quantity);
    const s = resultScreen(keys);
    await edit(chat_id, p.message_id, s.text, s.inline);
    await setPending(supabase, chat_id, {
      screen: "result",
      message_id: p.message_id,
      duration: p.duration,
      keys,
    });
    
    return;
  }

  await reply(chat_id, homeText());
}

// ---------- callback handler ----------
async function handleCallback(supabase: any, cb: any, adminId: string) {
  const chat_id = Number(cb.message?.chat?.id);
  const message_id = Number(cb.message?.message_id);
  const data: string = cb.data || "";
  const [action, rest] = [data.split(":")[0], data.slice(data.indexOf(":") + 1)];

  if (!(await isAuthed(supabase, chat_id, adminId))) {
    await ack(cb.id, "Envía /start y autentícate.");
    return;
  }

  const p = (await getPending(supabase, chat_id)) || {};

  if (action === "nav") {
    if (rest === "home") {
      await ack(cb.id);
      await edit(chat_id, message_id, homeText(), []);
      await clearPending(supabase, chat_id);
      return;
    }
    // back
    await ack(cb.id);
    if (p.screen === "count") {
      const s = durationScreen();
      await edit(chat_id, message_id, s.text, s.inline);
      await setPending(supabase, chat_id, { screen: "duration", message_id });
      return;
    }
    if (p.screen === "result") {
      const s = countScreen(p.duration || "");
      await edit(chat_id, message_id, s.text, s.inline);
      await setPending(supabase, chat_id, { screen: "count", message_id, duration: p.duration });
      return;
    }
    if (p.screen === "user") {
      const s = await usersScreen(supabase, p.page || 0);
      await edit(chat_id, message_id, s.text, s.inline);
      await setPending(supabase, chat_id, { screen: "users", page: p.page || 0, message_id });
      return;
    }
    await edit(chat_id, message_id, homeText(), []);
    await clearPending(supabase, chat_id);
    return;
  }

  if (action === "dur") {
    const s = countScreen(rest);
    await ack(cb.id, rest);
    await edit(chat_id, message_id, s.text, s.inline);
    await setPending(supabase, chat_id, { screen: "count", message_id, duration: rest });
    return;
  }

  if (action === "copy") {
    await ack(cb.id, "Copiado");
    const keys: string[] = p.keys || [];
    if (keys.length) {
      await tg("sendMessage", { chat_id, text: keys.join("\n") });
    }
    return;
  }

  if (action === "upage") {
    const page = Number(rest) || 0;
    const s = await usersScreen(supabase, page);
    await ack(cb.id);
    await edit(chat_id, message_id, s.text, s.inline);
    await setPending(supabase, chat_id, { screen: "users", page, message_id });
    return;
  }

  if (action === "user") {
    const s = await userDetailScreen(supabase, rest);
    await ack(cb.id);
    await edit(chat_id, message_id, s.text, s.inline);
    await setPending(supabase, chat_id, { screen: "user", page: p.page || 0, message_id });
    return;
  }

  await ack(cb.id);
}

async function deriveSecret(token: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${token}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  const expected = token ? await deriveSecret(token) : "";
  const got = req.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!expected || got !== expected) {
    console.error("Invalid Telegram webhook secret");
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  let update: any;
  try { update = await req.json(); } catch { return new Response("ok", { headers: corsHeaders }); }

  const adminId = Deno.env.get("TELEGRAM_ADMIN_ID") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const process = async () => {
    const supabase = createClient(supabaseUrl, serviceKey);
    try {
      if (update.message?.text) {
        await handleText(supabase, update.message.chat.id, update.message.text, adminId);
      } else if (update.callback_query) {
        await handleCallback(supabase, update.callback_query, adminId);
      }
    } catch (e) {
      console.error("process error", e);
      try {
        const cid = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
        if (cid) await reply(Number(cid), "Ocurrió un error. Intenta de nuevo.");
      } catch {}
    }
  };

  // @ts-ignore EdgeRuntime is available in Supabase edge functions
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(process());
  else await process();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
