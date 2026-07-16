// Car2Buy CRM — AI assistant backed by Claude (Anthropic).
// Deploy as a Supabase Edge Function named "ai-assistant".
// Requires two secrets: ANTHROPIC_API_KEY (yours) and the auto-provided
// SUPABASE_URL / SUPABASE_ANON_KEY. Only authenticated CRM users may call it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// You can change the model here (e.g. claude-opus-4-8 for deeper analysis).
const MODEL = "claude-sonnet-5";
const SYSTEM =
  "אתה עוזר AI מנוסה למנהלי סוכנות רכב ישראלית בשם Car2Buy (ליסינג מימוני, עבודה מול כל היבואנים, טרייד-אין). " +
  "אתה מקבל תקציר נתוני CRM אמיתיים (לידים, אחוז סגירה, מקורות, כספים, שלבי תיקים). " +
  "ענה תמיד בעברית, בצורה תמציתית, מעשית ומבוססת-נתונים: תובנות, מגמות והמלצות פעולה קונקרטיות. " +
  "אם חסר מידע — אמור זאת בקצרה ואל תמציא מספרים.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    // require a signed-in CRM user (uses the caller's JWT)
    const authHeader = req.headers.get("Authorization") || "";
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "missing ANTHROPIC_API_KEY secret" }, 500);

    const { prompt, system } = await req.json().catch(() => ({}));
    if (!prompt) return json({ error: "missing prompt" }, 400);

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1400,
        system: system || SYSTEM,
        messages: [{ role: "user", content: String(prompt).slice(0, 20000) }],
      }),
    });
    const data = await resp.json();
    if (!resp.ok) return json({ error: data?.error?.message || `Anthropic error ${resp.status}` }, 200);
    const text = data?.content?.[0]?.text || "לא התקבלה תשובה.";
    return json({ text });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
