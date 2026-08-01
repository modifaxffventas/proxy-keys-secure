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

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: adminId, text }),
  });
  const out = await res.json();

  return new Response(JSON.stringify(out), {
    status: res.ok ? 200 : res.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
