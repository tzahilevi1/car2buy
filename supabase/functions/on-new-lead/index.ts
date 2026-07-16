// Car2Buy — send a welcome+tips email to every new lead (any source, incl. public forms).
// Deploy as Supabase Edge Function "on-new-lead" and wire a Database Webhook:
//   Database → Webhooks → new → table: leads · event: INSERT · type: Edge Function → on-new-lead
//   add HTTP header  x-webhook-secret: <same value as the WEBHOOK_SECRET function secret>
// Secrets: RESEND_API_KEY (+ optional RESEND_FROM, WEBHOOK_SECRET).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    // optional shared-secret check so only the Supabase webhook can trigger this
    const secret = Deno.env.get("WEBHOOK_SECRET");
    if (secret && req.headers.get("x-webhook-secret") !== secret) return json({ error: "forbidden" }, 403);

    const payload = await req.json().catch(() => ({}));
    const rec = payload?.record || payload || {};   // Supabase webhook wraps the row in .record
    const email = rec?.email;
    if (!email) return json({ ok: true, skipped: "no email" });

    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return json({ error: "missing RESEND_API_KEY" }, 200);
    const from = Deno.env.get("RESEND_FROM") || "Car2Buy <onboarding@resend.dev>";
    const name = rec?.name || "";
    const car = rec?.car || "";

    const text =
      "שלום " + name + ",\n" +
      "תודה שבחרת ב-Car2Buy! 🚗 קיבלנו את פנייתך" + (car ? " לגבי " + car : "") +
      " ואנחנו כבר עובדים על ההצעה המשתלמת ביותר עבורך.\n\n" +
      "3 טיפים שיחסכו לך כסף:\n" +
      "1. החזר חודשי נמוך לא תמיד = עסקה זולה — תמיד בדקו את העלות הכוללת.\n" +
      "2. יש רכב ישן? טרייד-אין מקזז ישירות מההחזר החודשי.\n" +
      "3. מקדמה גמישה (גם 0 ₪) — נתאים לכם בדיוק.\n\n" +
      "יועץ אישי יחזור אליך בהקדם.\nצוות Car2Buy";

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: "קיבלנו את פנייתך — Car2Buy 🚗", text }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: d?.message || ("Resend " + r.status) }, 200);
    return json({ ok: true, id: d?.id });
  } catch (e) {
    return json({ error: String(e) }, 200);
  }
});
