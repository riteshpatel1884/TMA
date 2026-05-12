// src/app/api/admin/users/route.js
// GET — fetch all unique notifyEmails with stats
// Protected by ADMIN_SECRET header

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

function isAdmin(req) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req) {
  if (!isAdmin(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trackers = await prisma.prepTracker.findMany({
    where: { notifyEmail: { not: null } },
    select: {
      notifyEmail: true,
      clerkUserId: true,
      companyName: true,
      roundName: true,
      roundDate: true,
      totalTopics: true,
      doneTopics: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const emailMap = new Map();
  for (const t of trackers) {
    const email = t.notifyEmail;
    if (!emailMap.has(email)) {
      emailMap.set(email, {
        email,
        clerkUserId: t.clerkUserId,
        trackerCount: 0,
        totalTopics: 0,
        doneTopics: 0,
        companies: [],
        lastActive: t.createdAt,
        joinedAt: t.createdAt,
      });
    }
    const u = emailMap.get(email);
    u.trackerCount++;
    u.totalTopics += t.totalTopics;
    u.doneTopics  += t.doneTopics;
    u.companies.push(t.companyName);
    if (new Date(t.createdAt) > new Date(u.lastActive)) u.lastActive = t.createdAt;
    if (new Date(t.createdAt) < new Date(u.joinedAt))   u.joinedAt   = t.createdAt;
  }

  const users = [...emailMap.values()].map(u => ({
    ...u,
    companies: [...new Set(u.companies)],
    progressPct: u.totalTopics
      ? Math.round((u.doneTopics / u.totalTopics) * 100)
      : 0,
  }));

  return NextResponse.json({ users, total: users.length });
}