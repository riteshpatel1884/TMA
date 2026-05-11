// src/app/api/cron/prep-reminders/route.js
// Triggered daily by Vercel Cron at 7:00 AM UTC
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { sendEmail } from "../../../../lib/emails/sendEmail";
import { reminderEmail } from "../../../../lib/emails/prepEmailTemplates";

const REMINDER_DAYS = [7, 3, 2, 1, 0];

export const GET = async (req) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only trackers that have a notifyEmail set and upcoming roundDate
  const trackers = await prisma.prepTracker.findMany({
    where: {
      notifyEmail: { not: null },
      roundDate: { gte: today },
    },
    include: {
      topics: { include: { dailyLogs: true } },
    },
  });

  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const tracker of trackers) {
    const roundDate = new Date(tracker.roundDate);
    roundDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((roundDate - today) / (1000 * 60 * 60 * 24));

    if (!REMINDER_DAYS.includes(daysLeft)) {
      results.skipped++;
      continue;
    }

    const totalTopics = tracker.topics.length;
    const doneTopics = tracker.topics.filter((t) =>
      t.dailyLogs.some((l) => l.completed)
    ).length;
    const progressPct = totalTopics
      ? Math.round((doneTopics / totalTopics) * 100)
      : 0;

    const todayDaySlot = getTodayDaySlot(tracker.roundDate, totalTopics);
    const pendingTopicsToday = todayDaySlot
      ? tracker.topics.filter(
          (t) =>
            t.daySlot === todayDaySlot &&
            !t.dailyLogs.some((l) => l.completed)
        )
      : [];

    const { subject, html } = reminderEmail({
      userName: null,
      companyName: tracker.companyName,
      roundName: tracker.roundName,
      roundDate: tracker.roundDate,
      daysLeft,
      doneTopics,
      totalTopics,
      progressPct,
      pendingTopicsToday,
    });

    const result = await sendEmail({ to: tracker.notifyEmail, subject, html });

    if (result.success) {
      results.sent++;
    } else {
      results.errors++;
      console.error(`[cron] Failed for ${tracker.notifyEmail}:`, result.error);
    }
  }

  console.log("[cron/prep-reminders]", results);
  return NextResponse.json({ ok: true, ...results });
};

function getTodayDaySlot(roundDate, totalDays) {
  if (!roundDate || !totalDays) return null;
  const exam = new Date(roundDate);
  exam.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  const slot = totalDays - daysUntilExam + 1;
  return slot >= 1 && slot <= totalDays ? slot : null;
}