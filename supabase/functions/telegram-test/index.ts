// Envía un mensaje de prueba al admin por Telegram.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const adminId = Deno.env.get("TELEGRAM_ADMIN_ID");
  if (!token) {
    return new Response(JSON.stringify({ error: "Falta TELEGRAM_BOT_TOKEN" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let text = "Bot activo — mensaje de prueba (Boykaffx7)";
  try {
    const body = await req.json();
    if (body?.text) text = String(body.text).slice(0, 3000);
  } catch { /* sin body */ }

  // Destinatarios: TELEGRAM_ADMIN_ID si existe, si no todas las sesiones admin del bot.
  let targets: string[] = adminId ? [adminId] : [];
  if (targets.length === 0) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const r = await fetch(`${supabaseUrl}/rest/v1/telegram_admin_sessions?select=chat_id`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const rows = await r.json().catch(() => []);
    targets = Array.isArray(rows) ? rows.map((x: any) => String(x.chat_id)) : [];
  }

  const results: any[] = [];
  for (const chatId of targets) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    results.push({ chat_id: chatId, result: await res.json() });
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
