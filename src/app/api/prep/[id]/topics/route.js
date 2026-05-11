// src/app/api/prep/[id]/topics/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { distributeTopics, daysUntil } from "../../../../../lib/scheduleTopics";

// ─── POST /api/prep/[id]/topics ───────────────────────────────────────────────
// Add one or more topics to an existing tracker and re-distribute day slots.
// Body: { topics: [{ name, category }] }
export async function POST(req, { params }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { topics: newTopics = [] } = await req.json();

  const tracker = await prisma.prepTracker.findFirst({
    where: { id, clerkUserId: userId },
    include: { topics: { orderBy: [{ daySlot: "asc" }, { order: "asc" }] } },
  });
  if (!tracker)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!newTopics.length)
    return NextResponse.json({ error: "No topics provided" }, { status: 400 });

  // Create new topics (unscheduled for now)
  const startOrder = tracker.topics.length;
  await prisma.prepTopic.createMany({
    data: newTopics.map((t, i) => ({
      trackerId: id,
      name: t.name,
      category: t.category ?? "Custom",
      isCustom: true,
      order: startOrder + i,
      daySlot: null,
    })),
  });

  // Re-fetch all topics and redistribute
  const allTopics = await prisma.prepTopic.findMany({
    where: { trackerId: id },
    orderBy: [{ order: "asc" }],
  });

  const totalDays = tracker.roundDate ? daysUntil(tracker.roundDate) : 1;
  const scheduled = distributeTopics(allTopics, totalDays);

  await Promise.all(
    scheduled.map((t) =>
      prisma.prepTopic.update({
        where: { id: t.id },
        data: { daySlot: t.daySlot },
      })
    )
  );

  // Update totalTopics count on tracker
  await prisma.prepTracker.update({
    where: { id },
    data: { totalTopics: allTopics.length },
  });

  const fresh = await prisma.prepTracker.findUnique({
    where: { id },
    include: {
      topics: {
        orderBy: [{ daySlot: "asc" }, { order: "asc" }],
        include: { dailyLogs: true },
      },
    },
  });

  return NextResponse.json({ tracker: fresh }, { status: 201 });
}

// ─── DELETE /api/prep/[id]/topics ─────────────────────────────────────────────
// Delete specific topics by id and redistribute.
// Body: { topicIds: string[] }
export async function DELETE(req, { params }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { topicIds = [] } = await req.json();

  const tracker = await prisma.prepTracker.findFirst({
    where: { id, clerkUserId: userId },
  });
  if (!tracker)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.prepTopic.deleteMany({
    where: { id: { in: topicIds }, trackerId: id },
  });

  // Re-fetch remaining and redistribute
  const remaining = await prisma.prepTopic.findMany({
    where: { trackerId: id },
    orderBy: [{ order: "asc" }],
  });

  const totalDays = tracker.roundDate ? daysUntil(tracker.roundDate) : 1;
  const scheduled = distributeTopics(remaining, totalDays);

  await Promise.all(
    scheduled.map((t, i) =>
      prisma.prepTopic.update({
        where: { id: t.id },
        data: { daySlot: t.daySlot, order: i },
      })
    )
  );

  await prisma.prepTracker.update({
    where: { id },
    data: { totalTopics: remaining.length },
  });

  return NextResponse.json({ ok: true, remaining: remaining.length });
}