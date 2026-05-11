// src/app/api/prep/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { DEFAULT_APTITUDE_TOPICS } from "../../../lib/defaultAptitudeTopics";
import { distributeTopics, daysUntil } from "../../../lib/scheduleTopics";

// ─── GET /api/prep ────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trackers = await prisma.prepTracker.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      application: { select: { id: true, company: true, role: true } },
      topics: {
        orderBy: [{ daySlot: "asc" }, { order: "asc" }],
        include: { dailyLogs: true },
      },
    },
  });

  return NextResponse.json({ trackers });
}

// ─── POST /api/prep ───────────────────────────────────────────────────────────
export async function POST(req) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const {
    companyName,
    applicationId,
    roundName = "Aptitude",
    roundDate,
    daysManual,
    useDefaultTopics = true,
    customTopics = [],
    notes,
    notifyEmail,          // ← new
    selectedCategories,   // ← from modal
  } = body;

  if (!companyName) {
    return NextResponse.json(
      { error: "companyName is required" },
      { status: 400 }
    );
  }

  // Calculate total days
  let totalDays = 1;
  if (daysManual && daysManual > 0) {
    totalDays = Math.floor(daysManual);
  } else if (roundDate) {
    totalDays = daysUntil(roundDate);
  }

  // Build full topic list — filter by selectedCategories if provided
  const defaultPool = useDefaultTopics ? DEFAULT_APTITUDE_TOPICS : [];
  const filteredDefaults = selectedCategories?.length
    ? defaultPool.filter((t) => selectedCategories.includes(t.category))
    : defaultPool;

  const customList = customTopics.map((t) => ({
    name: t.name,
    category: t.category ?? "Custom",
    isCustom: true,
  }));

  const allTopics = [
    ...filteredDefaults.map((t) => ({ ...t, isCustom: false })),
    ...customList,
  ];

  // Distribute topics across days
  const scheduled = distributeTopics(allTopics, totalDays);

  // Create tracker + topics
  const tracker = await prisma.prepTracker.create({
    data: {
      clerkUserId: userId,
      companyName,
      applicationId: applicationId ?? null,
      roundName,
      roundDate: roundDate ? new Date(roundDate) : null,
      notes: notes ?? null,
      notifyEmail: notifyEmail ?? null,   // ← save it
      totalTopics: scheduled.length,
      doneTopics: 0,
      topics: {
        create: scheduled.map((t, i) => ({
          name: t.name,
          category: t.category ?? null,
          isCustom: t.isCustom,
          order: i,
          daySlot: t.daySlot ?? null,
        })),
      },
    },
    include: {
      topics: {
        orderBy: [{ daySlot: "asc" }, { order: "asc" }],
        include: { dailyLogs: true },
      },
    },
  });

  return NextResponse.json({ tracker }, { status: 201 });
}