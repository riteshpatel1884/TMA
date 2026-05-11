import { NextResponse } from "next/server";
import { sendEmail } from "../../../lib/emails/sendEmail";
import { dayCompleteEmail, reminderEmail } from "../../../lib/emails/prepEmailTemplates";

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "day";
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Pass ?to=your@email.com in the URL" }, { status: 400 });
  }

  let subject, html;

  if (type === "day") {
    ({ subject, html } = dayCompleteEmail({
      userName: "Ritesh",
      companyName: "TCS",
      roundName: "Aptitude",
      daySlot: 2,
      topicsCompleted: 5,
      totalTopics: 20,
      doneTopics: 10,
      roundDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      progressPct: 50,
    }));
  } else if (type === "reminder") {
    ({ subject, html } = reminderEmail({
      userName: "Ritesh",
      companyName: "Infosys",
      roundName: "Reasoning",
      roundDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      daysLeft: 3,
      doneTopics: 8,
      totalTopics: 25,
      progressPct: 32,
      pendingTopicsToday: [
        { name: "Blood Relations", category: "Logical" },
        { name: "Syllogisms", category: "Logical" },
        { name: "Seating Arrangement", category: "Logical" },
      ],
    }));
  } else {
    return NextResponse.json({ error: "type must be 'day' or 'reminder'" }, { status: 400 });
  }

  const result = await sendEmail({ to, subject, html });
  return NextResponse.json(result);
};