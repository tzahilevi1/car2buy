// Car2Buy CRM — AI assistant backed by Claude (Anthropic).
// Deploy as a Supabase Edge Function named "ai-assistant".
// Secrets required: ANTHROPIC_API_KEY. (SUPABASE_URL / SUPABASE_ANON_KEY are auto-provided.)
// Only authenticated CRM users may call it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Models tried in order — the first one your account accepts is used.
const MODELS = ["claude-sonnet-5", "claude-sonnet-4-5", "claude-3-7-sonnet-latest", "claude-3-5-sonnet-latest"];
const SYSTEM =
  "אתה עוזר AI בכיר ומנוסה למנהלי סוכנות רכב ישראלית בשם Car2Buy (ליסינג מימוני פרטי, עבודה מול כל היבואנים בישראל, מימון עד 100%, טרייד-אין, מעטפת מלאה). " +
  "אתה מקבל תקציר נתוני CRM אמיתיים (לידים, אחוז סגירה, זמן תגובה, מקורות, כספים, שלבי תיקים). " +
  "ענה תמיד בעברית תקנית, בצורה תמציתית וברורה, ומבוססת אך ורק על הנתונים שקיבלת. " +
  "ספק תובנות, זהה מגמות ובעיות, ותן 2-4 המלצות פעולה קונקרטיות וישימות. " +
  "אם נתון מסוים חסר או לא ניתן להסיק אותו מהנתונים — אמור זאת במפורש ואל תמציא מספרים. דיוק לפני הכל.";

async function callClaude(key: string, system: string, prompt: string) {
  let lastErr = "";
  for (const model of MODELS) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 1500, system, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) {
      const text = data?.content?.map((b: any) => b?.text || "").join("").trim();
      if (text) return { text, model };
      lastErr = "Claude החזיר תשובה ריקה (" + model + ")";
      continue;
    }
    const msg = data?.error?.message || ("שגיאת Claude " + resp.status);
    // if the model name is the problem, try the next one; otherwise stop.
    if (resp.status === 404 || /model/i.test(msg)) { lastErr = msg; continue; }
    return { error: msg };
  }
  return { error: lastErr || "לא התקבלה תשובה מ-Claude" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "חסר מפתח ANTHROPIC_API_KEY ב-Secrets" }, 200);

    const { prompt, system } = await req.json().catch(() => ({}));
    if (!prompt) return json({ error: "missing prompt" }, 400);

    const out = await callClaude(key, system || SYSTEM, String(prompt).slice(0, 24000));
    return json(out);
  } catch (e) {
    return json({ error: "שגיאת שרת: " + String(e) }, 200);
  }
});
