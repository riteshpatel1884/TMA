// src/app/api/prep/log/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { sendEmail } from "../../../../lib/emails/sendEmail";
import { dayCompleteEmail } from "../../../../lib/emails/prepEmailTemplates";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topicId, logDate, completed = true } = await req.json();

  if (!topicId || !logDate)
    return NextResponse.json(
      { error: "topicId and logDate are required" },
      { status: 400 }
    );

  const topic = await prisma.prepTopic.findFirst({
    where: { id: topicId, tracker: { clerkUserId: userId } },
    include: { tracker: true },
  });

  if (!topic)
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  const date = new Date(logDate);
  date.setHours(0, 0, 0, 0);

  const log = await prisma.dailyTopicLog.upsert({
    where: { topicId_logDate: { topicId, logDate: date } },
    update: { completed },
    create: { topicId, logDate: date, completed },
  });

  const distinctDone = await prisma.dailyTopicLog.findMany({
    where: { completed: true, topic: { trackerId: topic.trackerId } },
    distinct: ["topicId"],
    select: { topicId: true },
  });

  await prisma.prepTracker.update({
    where: { id: topic.trackerId },
    data: { doneTopics: distinctDone.length },
  });

  // ── Day-complete email ────────────────────────────────────────────────────
  if (completed && topic.daySlot != null && topic.tracker.notifyEmail) {
    try {
      const siblingsInDay = await prisma.prepTopic.findMany({
        where: { trackerId: topic.trackerId, daySlot: topic.daySlot },
        include: { dailyLogs: { where: { completed: true } } },
      });

      const allDone = siblingsInDay.every(
        (t) => t.id === topicId || t.dailyLogs.length > 0
      );

      if (allDone) {
        const tracker = await prisma.prepTracker.findUnique({
          where: { id: topic.trackerId },
          select: {
            companyName: true,
            roundName: true,
            roundDate: true,
            totalTopics: true,
            notifyEmail: true,
          },
        });

        const progressPct = tracker.totalTopics
          ? Math.round((distinctDone.length / tracker.totalTopics) * 100)
          : 0;

        // Fetch next day's topics
        const nextDaySlot = topic.daySlot + 1;
        const nextDayTopics = await prisma.prepTopic.findMany({
          where: { trackerId: topic.trackerId, daySlot: nextDaySlot },
          select: { name: true, category: true },
          orderBy: { order: "asc" },
        });

        const { subject, html } = dayCompleteEmail({
          userName: null,
          companyName: tracker.companyName,
          roundName: tracker.roundName,
          daySlot: topic.daySlot,
          topicsCompleted: siblingsInDay.length,
          totalTopics: tracker.totalTopics,
          doneTopics: distinctDone.length,
          roundDate: tracker.roundDate,
          progressPct,
          nextDayTopics,        // ← tomorrow's topics
          nextDaySlot,          // ← next day number
        });

        sendEmail({ to: tracker.notifyEmail, subject, html }).catch(console.error);
      }
    } catch (emailErr) {
      console.error("[prep/log] Email error:", emailErr);
    }
  }

  return NextResponse.json({ log, doneTopics: distinctDone.length });
}

export async function GET(req) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const trackerId = searchParams.get("trackerId");
  const dateParam = searchParams.get("date");

  if (!trackerId)
    return NextResponse.json({ error: "trackerId required" }, { status: 400 });

  const tracker = await prisma.prepTracker.findFirst({
    where: { id: trackerId, clerkUserId: userId },
  });
  if (!tracker)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const whereDate = dateParam
    ? (() => { const d = new Date(dateParam); d.setHours(0,0,0,0); return { logDate: d }; })()
    : {};

  const logs = await prisma.dailyTopicLog.findMany({
    where: { ...whereDate, topic: { trackerId } },
    include: { topic: true },
  });

  return NextResponse.json({ logs });
}