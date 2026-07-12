// ============================================================
//  Car2Buy — Edge Function: notify-appointment
//  Triggered by a Database Webhook on INSERT into public.appointments.
//  Emails the business OWNER on every new appointment.
//
//  Setup:
//    supabase secrets set RESEND_API_KEY=re_xxx
//    supabase secrets set WEBHOOK_SECRET=<a long random string>
//    (optional) supabase secrets set SEND_CLIENT_EMAIL=true  ← only AFTER
//      verifying a sending domain in Resend (needed to email arbitrary clients)
//    Then create a Database Webhook: table=appointments, event=INSERT,
//    type=Supabase Edge Function → notify-appointment, and add an HTTP header
//    Authorization: Bearer <the same WEBHOOK_SECRET>.
// ============================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const SEND_CLIENT_EMAIL = (Deno.env.get("SEND_CLIENT_EMAIL") ?? "").toLowerCase() === "true";
const OWNER_EMAIL = "zahcilevi111@gmail.com";
const FROM = "Car2Buy <onboarding@resend.dev>"; // switch to a verified domain to email clients

// strip all HTML metacharacters from user-controlled text (emails are plain content)
function clean(s: unknown): string {
  return String(s ?? "").replace(/[<>&"'`]/g, " ").slice(0, 400);
}
function validEmail(s: unknown): string | null {
  const v = String(s ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  return { status: res.status };
}

Deno.serve(async (req) => {
  // 1) authenticate the webhook — reject any direct/forged invocation
  const auth = req.headers.get("Authorization") ?? "";
  if (!WEBHOOK_SECRET || auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }

  try {
    const payload = await req.json();
    const a = payload.record ?? payload;

    const rows = [
      ["שם", clean(a.name)], ["טלפון", clean(a.phone)], ["אימייל", clean(a.email)],
      ["מועד", clean(a.appt_date) + " " + clean(a.appt_time)], ["סניף", clean(a.branch)],
      ["סוג", clean(a.type)], ["הערה", clean(a.note)],
    ].map(([k, v]) => `<tr><td style="padding:4px 10px;color:#888">${k}</td><td style="padding:4px 10px">${v}</td></tr>`).join("");
    const details = `<table dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;color:#222">${rows}</table>`;

    const results: Record<string, unknown> = {};

    // 2) owner alert (always)
    results.owner = await sendEmail(
      OWNER_EMAIL,
      `📅 פגישה חדשה מהאתר — ${clean(a.name)}`,
      `<div dir="rtl" style="font-family:Arial,sans-serif"><h2 style="color:#F5691E">פגישה חדשה נקבעה באתר</h2>${details}</div>`,
    );

    // 3) client confirmation — OFF unless a verified domain is configured.
    //    (prevents abuse of the public insert path to email arbitrary recipients)
    const clientEmail = validEmail(a.email);
    if (SEND_CLIENT_EMAIL && clientEmail) {
      results.client = await sendEmail(
        clientEmail,
        `אישור בקשת פגישה — Car2Buy`,
        `<div dir="rtl" style="font-family:Arial,sans-serif">
           <h2 style="color:#F5691E">קיבלנו את בקשת הפגישה שלך 🎉</h2>
           <p>היי ${clean(a.name)}, תודה שפנית ל-Car2Buy. יועץ אישי יחזור אליך לאישור סופי:</p>
           ${details}
           <p style="color:#888;font-size:13px">לשאלות: 054-470-0706 · Car2Buy</p>
         </div>`,
      );
    }

    return new Response(JSON.stringify({ ok: true, results }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
