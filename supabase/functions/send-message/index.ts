// Car2Buy — send a real message to a customer (email via Resend, WhatsApp via Meta Cloud API).
// Deploy as Supabase Edge Function "send-message". Called by the CRM automation engine.
// Secrets: RESEND_API_KEY (+ optional RESEND_FROM), META_WA_TOKEN, META_WA_PHONE_ID.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    // only signed-in CRM users may trigger sends
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const { channel, to, subject, text } = await req.json().catch(() => ({}));
    if (!to || !text) return json({ error: "missing to/text" }, 400);

    if (channel === "email") {
      const key = Deno.env.get("RESEND_API_KEY");
      if (!key) return json({ error: "missing RESEND_API_KEY" }, 200);
      const from = Deno.env.get("RESEND_FROM") || "Car2Buy <onboarding@resend.dev>";
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject: subject || "Car2Buy", text }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: d?.message || ("Resend " + r.status) }, 200);
      return json({ ok: true, id: d?.id });
    }

    if (channel === "whatsapp") {
      const token = Deno.env.get("META_WA_TOKEN"), phoneId = Deno.env.get("META_WA_PHONE_ID");
      if (!token || !phoneId) return json({ error: "missing META_WA_TOKEN / META_WA_PHONE_ID" }, 200);
      const num = String(to).replace(/\D/g, "").replace(/^0/, "972");
      const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        // NOTE: free-form text only works within 24h of the customer's last message;
        // cold outreach requires a pre-approved WhatsApp template.
        body: JSON.stringify({ messaging_product: "whatsapp", to: num, type: "text", text: { body: text } }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: d?.error?.message || ("Meta " + r.status) }, 200);
      return json({ ok: true });
    }

    return json({ error: "unknown channel" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 200);
  }
});
