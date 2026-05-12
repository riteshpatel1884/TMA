// src/app/api/admin/send/route.js
// POST — send custom email to selected users
// Protected by ADMIN_SECRET header

import { NextResponse } from "next/server";
import { sendEmail } from "../../../../lib/emails/sendEmail";

function isAdmin(req) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function POST(req) {
  if (!isAdmin(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { emails, subject, body, fromName } = await req.json();

  if (!emails?.length)
    return NextResponse.json({ error: "No recipients" }, { status: 400 });
  if (!subject?.trim())
    return NextResponse.json({ error: "Subject required" }, { status: 400 });
  if (!body?.trim())
    return NextResponse.json({ error: "Body required" }, { status: 400 });

  const html = buildHtml({ subject, body, fromName: fromName || "LeaderLab" });

  const results = { sent: [], failed: [] };

  for (const email of emails) {
    const result = await sendEmail({ to: email, subject, html });
    if (result.success) results.sent.push(email);
    else results.failed.push({ email, error: result.error });
  }

  return NextResponse.json({
    ok: true,
    sentCount: results.sent.length,
    failedCount: results.failed.length,
    results,
  });
}

function buildHtml({ subject, body, fromName }) {
  const formatted = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <tr><td style="padding-bottom:16px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:13px;font-weight:700;color:#6366f1;letter-spacing:1.5px;text-transform:uppercase;">LEADERLAB</td>
        <td style="text-align:right;font-size:12px;color:#9ca3af;">Message from the team</td>
      </tr>
      <tr><td colspan="2" style="padding-top:8px;">
        <div style="height:2px;background:linear-gradient(90deg,#6366f1,#a5b4fc);border-radius:2px;"></div>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px 32px 24px;">
        <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111827;line-height:1.3;">${subject}</h1>
        <div style="font-size:14px;color:#374151;line-height:1.8;">${formatted}</div>
      </td></tr>
      <tr><td style="padding:0 32px 28px;">
        <div style="height:1px;background:#f3f4f6;margin-bottom:20px;"></div>
        <a href="https://leaderlab.in" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;">
          Go to LeaderLab →
        </a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="text-align:center;padding:20px 0 8px;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">
      ${fromName} · <a href="https://leaderlab.in" style="color:#6366f1;text-decoration:none;">leaderlab.in</a>
      &nbsp;·&nbsp; You're receiving this as a LeaderLab user.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}