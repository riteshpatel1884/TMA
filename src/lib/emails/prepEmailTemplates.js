const MOTIVATIONAL_QUOTES = [
  "Don't watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Stay focused. Extra mile is never crowded.",
  "Discipline is choosing between what you want now and what you want most.",
  "Every expert was once a beginner. Keep going.",
];

function getQuote(seed) {
  return MOTIVATIONAL_QUOTES[seed % MOTIVATIONAL_QUOTES.length];
}

function getMilestone(progressPct) {
  if (progressPct === 100) return { emoji: "🏆", label: "FULLY PREPPED" };
  if (progressPct >= 75)  return { emoji: "⚡", label: "ALMOST THERE" };
  if (progressPct >= 50)  return { emoji: "⚡", label: "HALFWAY DONE" };
  if (progressPct >= 25)  return { emoji: "💪", label: "BUILDING MOMENTUM" };
  return                         { emoji: "🚀", label: "GREAT START" };
}

function getBarColor(pct) {
  if (pct === 100) return "#16a34a";
  if (pct > 50)   return "#4f46e5";
  return                 "#d97706";
}

function getDaysColor(days) {
  if (days === null) return "#374151";
  if (days <= 2) return "#dc2626";
  if (days <= 5) return "#d97706";
  return "#374151";
}

function accurateDaysLeft(roundDate) {
  if (!roundDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const exam  = new Date(roundDate); exam.setHours(0,0,0,0);
  return Math.ceil((exam - today) / (1000*60*60*24));
}

// ─── DAY COMPLETE EMAIL ───────────────────────────────────────────────────────
export function dayCompleteEmail({
  userName,
  companyName,
  roundName,
  daySlot,
  topicsCompleted,
  totalTopics,
  doneTopics,
  roundDate,
  progressPct,
  nextDayTopics = [],
  nextDaySlot = null,
}) {
  const daysLeft  = accurateDaysLeft(roundDate);
  const milestone = getMilestone(progressPct);
  const barColor  = getBarColor(progressPct);
  const daysColor = getDaysColor(daysLeft);
  const remaining = totalTopics - doneTopics;
  const quote     = getQuote(daySlot);

  const daysTag = daysLeft === null   ? ""
    : daysLeft <= 0  ? "Exam is today!"
    : daysLeft === 1 ? "1 day to exam"
    : `${daysLeft} days to exam`;

  const daysTagColor = daysLeft !== null && daysLeft <= 2 ? "#dc2626"
    : daysLeft !== null && daysLeft <= 5 ? "#d97706"
    : "#4f46e5";
  const daysTagBg = daysLeft !== null && daysLeft <= 2 ? "#fef2f2"
    : daysLeft !== null && daysLeft <= 5 ? "#fffbeb"
    : "#eef2ff";

  return {
    subject: `Day ${daySlot} complete — ${progressPct}% done | ${companyName} ${roundName}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- LOGO HEADER -->
  <tr><td style="padding-bottom:16px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:13px;font-weight:700;color:#6366f1;letter-spacing:1.5px;text-transform:uppercase;">LEADERLAB</td>
        <td style="text-align:right;font-size:12px;color:#9ca3af;">Prep Tracker</td>
      </tr>
    </table>
    <tr><td colspan="2" style="padding-top:8px;"><div style="height:2px;background:linear-gradient(90deg,#6366f1,#a5b4fc);border-radius:2px;"></div></td></tr>
  </td></tr>

  <!-- MAIN CARD -->
  <tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">

      <!-- Card header row -->
      <tr>
        <td style="padding:24px 28px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:11px;font-weight:700;color:#6366f1;background:#eef2ff;padding:4px 10px;border-radius:20px;letter-spacing:0.8px;text-transform:uppercase;">DAY ${daySlot} COMPLETE</span>
              </td>
              ${daysTag ? `<td style="text-align:right;">
                <span style="font-size:11px;font-weight:600;color:${daysTagColor};background:${daysTagBg};padding:4px 10px;border-radius:20px;">${daysTag}</span>
              </td>` : ""}
            </tr>
          </table>
        </td>
      </tr>

      <!-- Headline -->
      <tr><td style="padding:0 28px 6px;">
        <h1 style="margin:0;font-size:26px;font-weight:800;color:#111827;line-height:1.2;">
          ${milestone.emoji}&nbsp; ${milestone.label.charAt(0) + milestone.label.slice(1).toLowerCase().replace("done","Done").replace("there","There").replace("momentum","Momentum").replace("start","Start").replace("prepped","Prepped")}
        </h1>
      </td></tr>

      <!-- Subline -->
      <tr><td style="padding:4px 28px 20px;">
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
          Hi${userName ? ` <strong>${userName}</strong>` : ""} — you completed <strong>${topicsCompleted} topic${topicsCompleted !== 1 ? "s" : ""}</strong> for <strong>${companyName}</strong> · <strong>${roundName}</strong>.
        </p>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 28px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

      <!-- Progress section -->
      <tr><td style="padding:20px 28px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#6b7280;">Overall prep progress</td>
            <td style="text-align:right;font-size:12px;color:#6b7280;">${doneTopics} / ${totalTopics} topics</td>
          </tr>
        </table>
      </td></tr>

      <!-- Progress bar -->
      <tr><td style="padding:6px 28px 8px;">
        <div style="background:#e5e7eb;border-radius:100px;height:8px;overflow:hidden;">
          <div style="background:${barColor};width:${progressPct}%;height:8px;border-radius:100px;"></div>
        </div>
      </td></tr>

      <!-- Pct + remaining -->
      <tr><td style="padding:4px 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:20px;font-weight:800;color:${barColor};">${progressPct}% <span style="font-size:12px;font-weight:400;color:#9ca3af;">complete</span></td>
            <td style="text-align:right;font-size:12px;color:#9ca3af;">${remaining} remaining</td>
          </tr>
        </table>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 28px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

      <!-- Stats row -->
      <tr><td style="padding:20px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" style="text-align:center;border-right:1px solid #e5e7eb;padding:0 12px 0 0;">
              <div style="font-size:28px;font-weight:800;color:#111827;">${doneTopics}</div>
              <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-top:4px;">Topics Done</div>
            </td>
            <td width="33%" style="text-align:center;border-right:1px solid #e5e7eb;padding:0 12px;">
              <div style="font-size:28px;font-weight:800;color:#111827;">${remaining}</div>
              <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-top:4px;">Remaining</div>
            </td>
            <td width="33%" style="text-align:center;padding:0 0 0 12px;">
              <div style="font-size:28px;font-weight:800;color:${daysColor};">${daysLeft !== null ? daysLeft : "—"}</div>
              <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-top:4px;">Days to Exam</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Quote -->
      <tr><td style="padding:0 28px 24px;">
        <div style="border-left:3px solid #e5e7eb;padding:8px 14px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;font-style:italic;">"${quote}"</p>
        </div>
      </td></tr>

      ${progressPct === 100 ? `
      <!-- 100% banner -->
      <tr><td style="padding:0 28px 24px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;text-align:center;">
          <span style="font-size:13px;font-weight:700;color:#15803d;">🏆 All topics complete — you're fully prepped!</span>
        </div>
      </td></tr>` : ""}

    </table>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  ${nextDayTopics.length > 0 ? `
  <!-- NEXT DAY CARD -->
  <tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:16px 28px;border-bottom:1px solid #f3f4f6;">
        <span style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.8px;">
          📅 Up Next — Day ${nextDaySlot || daySlot + 1}
        </span>
        <span style="font-size:12px;color:#9ca3af;margin-left:8px;">Stay ahead of schedule</span>
      </td></tr>

      ${nextDayTopics.slice(0, 5).map(t => `
      <tr><td style="padding:10px 28px;border-bottom:1px solid #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="20"><div style="width:16px;height:16px;border:1.5px solid #d1d5db;border-radius:4px;"></div></td>
          <td style="padding-left:10px;font-size:13px;color:#374151;">${t.name}</td>
          ${t.category ? `<td style="text-align:right;"><span style="font-size:10px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:20px;">${t.category}</span></td>` : ""}
        </tr></table>
      </td></tr>`).join("")}

      ${nextDayTopics.length > 5 ? `
      <tr><td style="padding:10px 28px;">
        <span style="font-size:12px;color:#9ca3af;">+${nextDayTopics.length - 5} more topics on Day ${nextDaySlot || daySlot + 1}</span>
      </td></tr>` : ""}
    </table>
  </td></tr>
  <tr><td style="height:12px;"></td></tr>` : ""}

  <!-- CTA -->
  <tr><td>
    <a href="https://leaderlab.in/prep" style="display:block;background:#4f46e5;color:#ffffff;text-decoration:none;text-align:center;padding:16px 24px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px;">
      Continue on LeaderLab →
    </a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="text-align:center;padding:20px 0 8px;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">
      LeaderLab · <a href="https://leaderlab.in" style="color:#6366f1;text-decoration:none;">leaderlab.in</a>
      &nbsp;·&nbsp; You're receiving this because you enabled prep reminders.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  };
}

// ─── REMINDER EMAIL ───────────────────────────────────────────────────────────
export function reminderEmail({
  userName,
  companyName,
  roundName,
  roundDate,
  daysLeft: _daysLeft,
  doneTopics,
  totalTopics,
  progressPct,
  pendingTopicsToday = [],
}) {
  const daysLeft  = accurateDaysLeft(roundDate) ?? _daysLeft;
  const barColor  = getBarColor(progressPct);
  const remaining = totalTopics - doneTopics;
  const quote     = getQuote(daysLeft ?? 0);

  const urgentLevel = daysLeft <= 1 ? "urgent" : daysLeft <= 3 ? "warning" : "normal";
  const accentColor = urgentLevel === "urgent" ? "#dc2626" : urgentLevel === "warning" ? "#d97706" : "#4f46e5";
  const accentBg    = urgentLevel === "urgent" ? "#fef2f2" : urgentLevel === "warning" ? "#fffbeb" : "#eef2ff";

  const headline =
    daysLeft <= 0  ? `Exam Day — ${companyName}!`
    : daysLeft === 1 ? `Last day! Tomorrow — ${companyName}`
    : `${daysLeft} days left · ${companyName}`;

  const emoji = urgentLevel === "urgent" ? "🚨" : urgentLevel === "warning" ? "⚡" : "📅";

  const subline =
    daysLeft <= 0  ? "Today's the day. You've prepared for this. Go show them what you've got."
    : daysLeft === 1 ? "One more night. Review everything. You're ready."
    : `Keep the momentum going. ${remaining} topic${remaining !== 1 ? "s" : ""} left before exam day.`;

  const daysTag = daysLeft <= 0 ? "Exam today!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to exam`;

  return {
    subject: `${emoji} ${headline} · ${roundName}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- LOGO HEADER -->
  <tr><td style="padding-bottom:16px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:13px;font-weight:700;color:#6366f1;letter-spacing:1.5px;text-transform:uppercase;">LEADERLAB</td>
        <td style="text-align:right;font-size:12px;color:#9ca3af;">Prep Tracker</td>
      </tr>
      <tr><td colspan="2" style="padding-top:8px;"><div style="height:2px;background:linear-gradient(90deg,${accentColor},${accentColor}66);border-radius:2px;"></div></td></tr>
    </table>
  </td></tr>

  <!-- MAIN CARD -->
  <tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">

      <!-- Header row -->
      <tr><td style="padding:24px 28px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><span style="font-size:11px;font-weight:700;color:${accentColor};background:${accentBg};padding:4px 10px;border-radius:20px;letter-spacing:0.8px;text-transform:uppercase;">${emoji} REMINDER</span></td>
          <td style="text-align:right;"><span style="font-size:11px;font-weight:600;color:${accentColor};background:${accentBg};padding:4px 10px;border-radius:20px;">${daysTag}</span></td>
        </tr></table>
      </td></tr>

      <!-- Headline -->
      <tr><td style="padding:0 28px 6px;">
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;line-height:1.2;">${headline}</h1>
      </td></tr>

      <!-- Subline -->
      <tr><td style="padding:4px 28px 20px;">
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">${subline}</p>
      </td></tr>

      <tr><td style="padding:0 28px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

      <!-- Progress -->
      <tr><td style="padding:20px 28px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:12px;color:#6b7280;">Overall prep progress</td>
          <td style="text-align:right;font-size:12px;color:#6b7280;">${doneTopics} / ${totalTopics} topics</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:6px 28px 8px;">
        <div style="background:#e5e7eb;border-radius:100px;height:8px;overflow:hidden;">
          <div style="background:${barColor};width:${progressPct}%;height:8px;border-radius:100px;"></div>
        </div>
      </td></tr>

      <tr><td style="padding:4px 28px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:20px;font-weight:800;color:${barColor};">${progressPct}% <span style="font-size:12px;font-weight:400;color:#9ca3af;">complete</span></td>
          <td style="text-align:right;font-size:12px;color:#9ca3af;">${remaining} remaining</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:0 28px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

      <!-- Stats -->
      <tr><td style="padding:20px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="33%" style="text-align:center;border-right:1px solid #e5e7eb;padding-right:12px;">
            <div style="font-size:28px;font-weight:800;color:${accentColor};">${daysLeft <= 0 ? "📍" : daysLeft}</div>
            <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-top:4px;">Days to Exam</div>
          </td>
          <td width="33%" style="text-align:center;border-right:1px solid #e5e7eb;padding:0 12px;">
            <div style="font-size:28px;font-weight:800;color:#111827;">${progressPct}%</div>
            <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-top:4px;">Progress</div>
          </td>
          <td width="33%" style="text-align:center;padding-left:12px;">
            <div style="font-size:28px;font-weight:800;color:#111827;">${remaining}</div>
            <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-top:4px;">Topics Left</div>
          </td>
        </tr></table>
      </td></tr>

      <!-- Quote -->
      <tr><td style="padding:0 28px 24px;">
        <div style="border-left:3px solid #e5e7eb;padding:8px 14px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;font-style:italic;">"${quote}"</p>
        </div>
      </td></tr>

    </table>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  ${pendingTopicsToday.length > 0 ? `
  <!-- TODAY'S TOPICS CARD -->
  <tr><td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:16px 28px;border-bottom:1px solid #f3f4f6;">
        <span style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.8px;">📋 Today's Pending Topics</span>
      </td></tr>
      ${pendingTopicsToday.slice(0,6).map(t => `
      <tr><td style="padding:10px 28px;border-bottom:1px solid #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="20"><div style="width:16px;height:16px;border:1.5px solid #d1d5db;border-radius:4px;"></div></td>
          <td style="padding-left:10px;font-size:13px;color:#374151;">${t.name}</td>
          ${t.category ? `<td style="text-align:right;"><span style="font-size:10px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:20px;">${t.category}</span></td>` : ""}
        </tr></table>
      </td></tr>`).join("")}
      ${pendingTopicsToday.length > 6 ? `
      <tr><td style="padding:10px 28px;">
        <span style="font-size:12px;color:#9ca3af;">+${pendingTopicsToday.length-6} more topics pending today</span>
      </td></tr>` : ""}
    </table>
  </td></tr>
  <tr><td style="height:12px;"></td></tr>` : `
  <tr><td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 20px;text-align:center;">
    <span style="font-size:13px;font-weight:600;color:#15803d;">🎉 Today's topics are all done! Keep the streak alive tomorrow.</span>
  </td></tr>
  <tr><td style="height:12px;"></td></tr>`}

  <!-- CTA -->
  <tr><td>
    <a href="https://leaderlab.in/prep" style="display:block;background:${accentColor};color:#ffffff;text-decoration:none;text-align:center;padding:16px 24px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px;">
      ${daysLeft <= 0 ? "View Tracker — Best of luck! 🚀" : daysLeft === 1 ? "Do Final Revision →" : "Open Today's Topics →"}
    </a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="text-align:center;padding:20px 0 8px;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">
      LeaderLab · <a href="https://leaderlab.in" style="color:#6366f1;text-decoration:none;">leaderlab.in</a>
      &nbsp;·&nbsp; You're receiving this because you enabled prep reminders.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  };
}