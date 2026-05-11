// src/app/api/prep/log/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// ─── POST /api/prep/log ───────────────────────────────────────────────────────
// Toggle a topic as complete/incomplete for a given date.
// Body: { topicId: string, logDate: "YYYY-MM-DD", completed: boolean }
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

  // Verify the topic belongs to this user
  const topic = await prisma.prepTopic.findFirst({
    where: {
      id: topicId,
      tracker: { clerkUserId: userId },
    },
    include: { tracker: true },
  });

  if (!topic)
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  const date = new Date(logDate);
  date.setHours(0, 0, 0, 0);

  // Upsert the log (toggle)
  const log = await prisma.dailyTopicLog.upsert({
    where: { topicId_logDate: { topicId, logDate: date } },
    update: { completed },
    create: { topicId, logDate: date, completed },
  });

  // Sync doneTopics count on the tracker
  const doneCount = await prisma.dailyTopicLog.count({
    where: {
      completed: true,
      topic: { trackerId: topic.trackerId },
    },
  });

  // De-duplicate: count distinct topicIds that have at least one completed log
  const distinctDone = await prisma.dailyTopicLog.findMany({
    where: {
      completed: true,
      topic: { trackerId: topic.trackerId },
    },
    distinct: ["topicId"],
    select: { topicId: true },
  });

  await prisma.prepTracker.update({
    where: { id: topic.trackerId },
    data: { doneTopics: distinctDone.length },
  });

  return NextResponse.json({ log, doneTopics: distinctDone.length });
}

// ─── GET /api/prep/log?trackerId=xxx&date=YYYY-MM-DD ─────────────────────────
// Get all logs for a tracker on a specific date (for rendering the day view).
export async function GET(req) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const trackerId = searchParams.get("trackerId");
  const dateParam = searchParams.get("date");

  if (!trackerId)
    return NextResponse.json({ error: "trackerId required" }, { status: 400 });

  // Verify ownership
  const tracker = await prisma.prepTracker.findFirst({
    where: { id: trackerId, clerkUserId: userId },
  });
  if (!tracker)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const whereDate = dateParam
    ? (() => {
        const d = new Date(dateParam);
        d.setHours(0, 0, 0, 0);
        return { logDate: d };
      })()
    : {};

  const logs = await prisma.dailyTopicLog.findMany({
    where: {
      ...whereDate,
      topic: { trackerId },
    },
    include: { topic: true },
  });

  return NextResponse.json({ logs });
}