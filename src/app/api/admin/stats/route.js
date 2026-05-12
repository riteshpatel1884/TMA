// src/app/api/admin/stats/route.js
// GET — aggregate mail stats (total users, avg progress, top companies)
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
      companyName: true,
      totalTopics: true,
      doneTopics: true,
      createdAt: true,
    },
  });

  const emailSet = new Set(trackers.map(t => t.notifyEmail));
  const totalUsers = emailSet.size;

  // company frequency
  const companyCount = {};
  for (const t of trackers) {
    companyCount[t.companyName] = (companyCount[t.companyName] || 0) + 1;
  }
  const topCompanies = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // avg progress per user
  const userMap = new Map();
  for (const t of trackers) {
    const e = t.notifyEmail;
    if (!userMap.has(e)) userMap.set(e, { total: 0, done: 0 });
    userMap.get(e).total += t.totalTopics;
    userMap.get(e).done  += t.doneTopics;
  }
  const progValues = [...userMap.values()].map(u =>
    u.total ? Math.round((u.done / u.total) * 100) : 0
  );
  const avgProgress = progValues.length
    ? Math.round(progValues.reduce((a, b) => a + b, 0) / progValues.length)
    : 0;

  // signups in last 7 days
  const week = new Date(Date.now() - 7 * 86400000);
  const recentEmails = new Set(
    trackers.filter(t => new Date(t.createdAt) > week).map(t => t.notifyEmail)
  );

  return NextResponse.json({
    totalUsers,
    avgProgress,
    topCompanies,
    recentSignups: recentEmails.size,
  });
}