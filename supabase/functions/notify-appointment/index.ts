// ============================================================
//  Car2Buy — Edge Function: notify-appointment
//  Triggered by a Database Webhook on INSERT into public.appointments.
//  Sends two emails via Resend: (1) confirmation to the client,
//  (2) alert to the business owner.
//
//  Setup:
//    supabase secrets set RESEND_API_KEY=re_xxx   (or set in Dashboard)
//    Deploy, then create a Database Webhook: table=appointments,
//    event=INSERT, type=Supabase Edge Function → notify-appointment.
// ============================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const OWNER_EMAIL = "zahcilevi111@gmail.com";
// Until a custom domain is verified in Resend, use their shared sender.
// NOTE: with the shared sender you can reliably email the OWNER; emailing
// arbitrary CLIENTS requires a verified domain in Resend.
const FROM = "Car2Buy <onboarding@resend.dev>";

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  return { status: res.status, body: await res.text() };
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const a = payload.record ?? payload; // webhook wraps the row in `record`

    const when = `${esc(a.appt_date)} ${esc(a.appt_time)}`;
    const details = `
      <table style="font-family:Arial,sans-serif;font-size:15px;color:#222" dir="rtl">
        <tr><td style="padding:4px 10px;color:#888">שם</td><td style="padding:4px 10px"><b>${esc(a.name)}</b></td></tr>
        <tr><td style="padding:4px 10px;color:#888">טלפון</td><td style="padding:4px 10px">${esc(a.phone)}</td></tr>
        <tr><td style="padding:4px 10px;color:#888">אימייל</td><td style="padding:4px 10px">${esc(a.email)}</td></tr>
        <tr><td style="padding:4px 10px;color:#888">מועד</td><td style="padding:4px 10px">${when}</td></tr>
        <tr><td style="padding:4px 10px;color:#888">סניף</td><td style="padding:4px 10px">${esc(a.branch)}</td></tr>
        <tr><td style="padding:4px 10px;color:#888">סוג</td><td style="padding:4px 10px">${esc(a.type)}</td></tr>
        <tr><td style="padding:4px 10px;color:#888">הערה</td><td style="padding:4px 10px">${esc(a.note)}</td></tr>
      </table>`;

    const results: Record<string, unknown> = {};

    // 1) owner alert
    results.owner = await sendEmail(
      OWNER_EMAIL,
      `📅 פגישה חדשה מהאתר — ${esc(a.name)}`,
      `<div dir="rtl" style="font-family:Arial,sans-serif"><h2 style="color:#F5691E">פגישה חדשה נקבעה באתר</h2>${details}</div>`,
    );

    // 2) client confirmation (requires a verified sending domain in Resend)
    if (a.email) {
      results.client = await sendEmail(
        String(a.email),
        `אישור בקשת פגישה — Car2Buy`,
        `<div dir="rtl" style="font-family:Arial,sans-serif">
           <h2 style="color:#F5691E">קיבלנו את בקשת הפגישה שלך 🎉</h2>
           <p>היי ${esc(a.name)}, תודה שפנית ל-Car2Buy. להלן פרטי הבקשה — יועץ אישי יחזור אליך לאישור סופי:</p>
           ${details}
           <p style="color:#888;font-size:13px">לשאלות: 054-470-0706 · Car2Buy</p>
         </div>`,
      );
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
