// src/app/api/prep/[id]/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { distributeTopics, daysUntil } from "../../../../../lib/scheduleTopics";

// ─── GET /api/prep/[id] ───────────────────────────────────────────────────────
export async function GET(req, { params }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tracker = await prisma.prepTracker.findFirst({
    where: { id, clerkUserId: userId },
    include: {
      application: { select: { id: true, company: true, role: true } },
      topics: {
        orderBy: [{ daySlot: "asc" }, { order: "asc" }],
        include: { dailyLogs: true },
      },
    },
  });

  if (!tracker)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ tracker });
}

// ─── PATCH /api/prep/[id] ─────────────────────────────────────────────────────
// Update tracker metadata (roundDate, roundName, notes, applicationId, companyName).
// Optionally pass redistribute: true to re-assign daySlots based on new date/days.
export async function PATCH(req, { params }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.prepTracker.findFirst({
    where: { id, clerkUserId: userId },
    include: { topics: { orderBy: [{ daySlot: "asc" }, { order: "asc" }] } },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    companyName,
    applicationId,
    roundName,
    roundDate,
    daysManual,
    notes,
    redistribute = false,
  } = body;

  const updatedTracker = await prisma.prepTracker.update({
    where: { id },
    data: {
      ...(companyName !== undefined && { companyName }),
      ...(applicationId !== undefined && { applicationId: applicationId ?? null }),
      ...(roundName !== undefined && { roundName }),
      ...(roundDate !== undefined && { roundDate: roundDate ? new Date(roundDate) : null }),
      ...(notes !== undefined && { notes }),
    },
  });

  // If caller wants topics re-distributed with the new date
  if (redistribute && existing.topics.length > 0) {
    const newRoundDate = roundDate ?? existing.roundDate;
    const totalDays =
      daysManual && daysManual > 0
        ? Math.floor(daysManual)
        : newRoundDate
        ? daysUntil(newRoundDate)
        : 1;

    const scheduled = distributeTopics(existing.topics, totalDays);

    // Batch update day slots
    await Promise.all(
      scheduled.map((t) =>
        prisma.prepTopic.update({
          where: { id: t.id },
          data: { daySlot: t.daySlot },
        })
      )
    );
  }

  // Return fresh tracker with topics
  const fresh = await prisma.prepTracker.findUnique({
    where: { id },
    include: {
      application: { select: { id: true, company: true, role: true } },
      topics: {
        orderBy: [{ daySlot: "asc" }, { order: "asc" }],
        include: { dailyLogs: true },
      },
    },
  });

  return NextResponse.json({ tracker: fresh });
}

// ─── DELETE /api/prep/[id] ────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.prepTracker.deleteMany({
    where: { id, clerkUserId: userId },
  });

  return NextResponse.json({ ok: true });
}