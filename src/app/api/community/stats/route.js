// // src/app/api/community/stats/route.js

// import { prisma } from "../../../../lib/db";
// import { clerkClient } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     const now = new Date();
//     const weekAgo = new Date(now);
//     weekAgo.setDate(now.getDate() - 7);

//     const [
//       totalApps,
//       weeklyApps,
//       statusCounts,
//       platformRows,
//       roleRows,
//       offerJourneys,
//       activeUsersWeek,
//       allUsersAppCounts,
//     ] = await Promise.all([
//       prisma.application.count(),
//       prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
//       prisma.application.groupBy({ by: ["status"], _count: { id: true } }),
//       prisma.application.groupBy({
//         by: ["platform"],
//         _count: { id: true },
//         where: { platform: { not: null } },
//       }),
//       prisma.application.groupBy({
//         by: ["role"],
//         _count: { id: true },
//         orderBy: { _count: { id: "desc" } },
//         take: 8,
//       }),
//       prisma.application.findMany({
//         where: { status: "Offer" },
//         select: { clerkUserId: true, dateApplied: true, createdAt: true },
//       }),
//       prisma.application.findMany({
//         where: { createdAt: { gte: weekAgo } },
//         select: { clerkUserId: true },
//         distinct: ["clerkUserId"],
//       }),
//       prisma.application.groupBy({
//         by: ["clerkUserId"],
//         _count: { id: true },
//         orderBy: { _count: { id: "desc" } },
//       }),
//     ]);

//     // ── Platform callback rates ──────────────────────────────────────────────
//     const platformCallbacks = await prisma.application.groupBy({
//       by: ["platform"],
//       _count: { id: true },
//       where: { platform: { not: null }, status: { in: ["Interview", "Offer"] } },
//     });

//     const callbackMap = {};
//     platformCallbacks.forEach((r) => {
//       if (r.platform) callbackMap[r.platform] = r._count.id;
//     });

//     const platforms = platformRows
//       .filter((r) => r.platform && r._count.id >= 1)
//       .map((r) => {
//         const total = r._count.id;
//         const callbacks = callbackMap[r.platform] || 0;
//         const rate = total > 0 ? Math.round((callbacks / total) * 100) : 0;
//         return { name: r.platform, apps: total, callbackRate: rate };
//       })
//       .sort((a, b) => b.apps - a.apps)
//       .slice(0, 6);

//     // ── Status funnel ────────────────────────────────────────────────────────
//     const statusMap = {};
//     statusCounts.forEach((s) => { statusMap[s.status] = s._count.id; });

//     const totalOffers = statusMap["Offer"] || 0;
//     const totalInterviews = (statusMap["Interview"] || 0) + totalOffers;
//     const totalRejected = statusMap["Rejected"] || 0;
//     const totalApplied = statusMap["Applied"] || 0;
//     const callbackRate =
//       totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0;

//     // ── Ghosting analytics ───────────────────────────────────────────────────
//     // "Ghosted" = Applied status with no follow-up response (no status change)
//     // Approximate: apps still in "Applied" after 14+ days
//     const fourteenDaysAgo = new Date(now);
//     fourteenDaysAgo.setDate(now.getDate() - 14);

//     const ghostedApps = await prisma.application.count({
//       where: {
//         status: "Applied",
//         createdAt: { lte: fourteenDaysAgo },
//       },
//     });

//     // Most ghosted platform
//     const ghostedByPlatform = await prisma.application.groupBy({
//       by: ["platform"],
//       _count: { id: true },
//       where: {
//         status: "Applied",
//         createdAt: { lte: fourteenDaysAgo },
//         platform: { not: null },
//       },
//       orderBy: { _count: { id: "desc" } },
//       take: 1,
//     });

//     const mostGhostedPlatform = ghostedByPlatform[0]?.platform || "N/A";
//     const ghostRate = totalApps > 0 ? Math.round((ghostedApps / totalApps) * 100) : 0;

//     // ── Rejection stage breakdown ─────────────────────────────────────────────
//     // Using statusHistory to find at what stage rejections happen
//     const rejectedApps = await prisma.application.findMany({
//       where: { status: "Rejected" },
//       select: { statusHistory: true },
//     });

//     const rejectionStages = { "Resume screening": 0, "OA/Test round": 0, "Interview": 0, "Other": 0 };
//     rejectedApps.forEach((app) => {
//       const history = Array.isArray(app.statusHistory) ? app.statusHistory : [];
//       const hadInterview = history.some((h) => h.status === "Interview");
//       const hadOA = history.some((h) => h.status === "OA" || h.status === "Online Assessment");
//       if (hadInterview) {
//         rejectionStages["Interview"]++;
//       } else if (hadOA) {
//         rejectionStages["OA/Test round"]++;
//       } else if (history.length <= 1) {
//         rejectionStages["Resume screening"]++;
//       } else {
//         rejectionStages["Other"]++;
//       }
//     });

//     // ── Journey averages ─────────────────────────────────────────────────────
//     let avgAppsBeforeOffer = 64;
//     let avgDaysToOffer = 29;

//     if (offerJourneys.length > 0) {
//       const userIds = [...new Set(offerJourneys.map((o) => o.clerkUserId))];
//       const userAppCounts = await prisma.application.groupBy({
//         by: ["clerkUserId"],
//         _count: { id: true },
//         where: { clerkUserId: { in: userIds } },
//       });
//       const userAppMap = {};
//       userAppCounts.forEach((u) => { userAppMap[u.clerkUserId] = u._count.id; });

//       const appCounts = offerJourneys.map((o) => userAppMap[o.clerkUserId] || 1);
//       avgAppsBeforeOffer = Math.round(appCounts.reduce((a, b) => a + b, 0) / appCounts.length);

//       const firstAppDates = await prisma.application.groupBy({
//         by: ["clerkUserId"],
//         _min: { createdAt: true },
//         where: { clerkUserId: { in: userIds } },
//       });
//       const firstAppMap = {};
//       firstAppDates.forEach((u) => { firstAppMap[u.clerkUserId] = u._min.createdAt; });

//       const daysList = offerJourneys
//         .map((o) => {
//           const first = firstAppMap[o.clerkUserId];
//           if (!first) return null;
//           return Math.round(
//             (new Date(o.createdAt).getTime() - new Date(first).getTime()) / (1000 * 60 * 60 * 24)
//           );
//         })
//         .filter((d) => d !== null && d >= 0);

//       if (daysList.length > 0) {
//         avgDaysToOffer = Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length);
//       }
//     }

//     // ── Role heatmap ─────────────────────────────────────────────────────────
//     const roleCallbackCounts = await prisma.application.groupBy({
//       by: ["role"],
//       _count: { id: true },
//       where: { status: { in: ["Interview", "Offer"] } },
//     });
//     const roleCallbackMap = {};
//     roleCallbackCounts.forEach((r) => { roleCallbackMap[r.role] = r._count.id; });

//     const topTotal = roleRows[0]?._count?.id || 1;
//     const roles = roleRows.map((r) => {
//       const total = r._count.id;
//       const cb = roleCallbackMap[r.role] || 0;
//       return {
//         role: r.role,
//         volume: Math.round((total / topTotal) * 100),
//         apps: total,
//         callbackRate: total > 0 ? Math.round((cb / total) * 100) : 0,
//       };
//     });

//     // ── Leaderboard with real Clerk usernames ────────────────────────────────
//     const top5 = allUsersAppCounts.slice(0, 5);
//     const clerkIds = top5.map((u) => u.clerkUserId);

//     let streakLeaders = [];
//     try {
//       const clerk = await clerkClient();
//       const usersResponse = await clerk.users.getUserList({ userId: clerkIds });
//       const users = usersResponse.data ?? usersResponse; // handle both shapes

//       const userMap = {};
//       users.forEach((u) => {
//         userMap[u.id] = u.username || u.firstName || u.emailAddresses?.[0]?.emailAddress?.split("@")[0] || u.id;
//       });

//       streakLeaders = top5.map((u) => ({
//         username: userMap[u.clerkUserId] || u.clerkUserId,
//         clerkUserId: u.clerkUserId,
//         totalApps: u._count.id,
//       }));
//     } catch (clerkErr) {
//       // Fallback if Clerk lookup fails
//       console.warn("[community/stats] Clerk lookup failed:", clerkErr.message);
//       streakLeaders = top5.map((u, i) => ({
//         username: `User${String.fromCharCode(65 + i)}`,
//         clerkUserId: u.clerkUserId,
//         totalApps: u._count.id,
//       }));
//     }

//     // ── Community mood this week ─────────────────────────────────────────────
//     const communityMood = {
//       ghostedPct: ghostRate,
//       interviewPct: totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0,
//       offerPct: totalApps > 0 ? Math.round((totalOffers / totalApps) * 100) : 0,
//     };

//     // ── Top platform by callback rate ────────────────────────────────────────
//     const topPlatform =
//       platforms.length > 0
//         ? [...platforms].sort((a, b) => b.callbackRate - a.callbackRate)[0]?.name || "N/A"
//         : "N/A";

//     // ── Most applied role this week ──────────────────────────────────────────
//     const weeklyRoles = await prisma.application.groupBy({
//       by: ["role"],
//       _count: { id: true },
//       where: { createdAt: { gte: weekAgo } },
//       orderBy: { _count: { id: "desc" } },
//       take: 1,
//     });
//     const trendingRole = weeklyRoles[0]?.role || "N/A";

//     return NextResponse.json({
//       totalApps,
//       weeklyApps,
//       callbackRate,
//       avgAppsBeforeOffer,
//       avgDaysToOffer,
//       avgInterviewsBeforeOffer:
//         totalApps > 0 ? Math.round(totalInterviews / Math.max(totalOffers, 1)) : 4,
//       activeUsers: activeUsersWeek.length,
//       topPlatform,
//       trendingRole,
//       statusMap,
//       platforms,
//       roles,
//       streakLeaders,
//       ghosting: {
//         ghostedApps,
//         ghostRate,
//         mostGhostedPlatform,
//         avgGhostDays: 14, // threshold used
//       },
//       rejectionStages,
//       communityMood,
//     });
//   } catch (err) {
//     console.error("[community/stats]", err);
//     return NextResponse.json({ error: "Failed to compute community stats" }, { status: 500 });
//   } finally {
//     await prisma.$disconnect();
//   }
// }



// src/app/api/community/stats/route.js

import { prisma } from "../../../../lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId: currentUserId } = await auth();
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const [
      totalApps,
      weeklyApps,
      statusCounts,
      platformRows,
      roleRows,
      offerJourneys,
      activeUsersWeek,
      allUsersAppCounts,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.application.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.application.groupBy({
        by: ["platform"],
        _count: { id: true },
        where: { platform: { not: null } },
      }),
      prisma.application.groupBy({
        by: ["role"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
      prisma.application.findMany({
        where: { status: "Offer" },
        select: { clerkUserId: true, dateApplied: true, createdAt: true },
      }),
      prisma.application.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { clerkUserId: true },
        distinct: ["clerkUserId"],
      }),
      // Get ALL users with their app counts for full leaderboard
      prisma.application.groupBy({
        by: ["clerkUserId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // ── Platform callback rates ──────────────────────────────────────────────
    const platformCallbacks = await prisma.application.groupBy({
      by: ["platform"],
      _count: { id: true },
      where: { platform: { not: null }, status: { in: ["Interview", "Offer"] } },
    });
    const callbackMap = {};
    platformCallbacks.forEach((r) => { if (r.platform) callbackMap[r.platform] = r._count.id; });

    const platforms = platformRows
      .filter((r) => r.platform && r._count.id >= 1)
      .map((r) => {
        const total = r._count.id;
        const callbacks = callbackMap[r.platform] || 0;
        return { name: r.platform, apps: total, callbackRate: total > 0 ? Math.round((callbacks / total) * 100) : 0 };
      })
      .sort((a, b) => b.apps - a.apps)
      .slice(0, 6);

    // ── Status funnel ────────────────────────────────────────────────────────
    const statusMap = {};
    statusCounts.forEach((s) => { statusMap[s.status] = s._count.id; });
    const totalOffers = statusMap["Offer"] || 0;
    const totalInterviews = (statusMap["Interview"] || 0) + totalOffers;
    const callbackRate = totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0;

    // ── Streak (active days) per user ────────────────────────────────────────
    // Count distinct dateApplied dates per user as "active days"
    const allUserIds = allUsersAppCounts.map((u) => u.clerkUserId);

    const allAppsForStreak = await prisma.application.findMany({
      where: { clerkUserId: { in: allUserIds } },
      select: { clerkUserId: true, dateApplied: true, createdAt: true },
    });

    // Build streak map: count distinct apply dates per user
    const userActiveDays = {};
    allAppsForStreak.forEach((app) => {
      const uid = app.clerkUserId;
      const dateStr = (app.dateApplied || app.createdAt)?.toISOString?.().slice(0, 10);
      if (!dateStr) return;
      if (!userActiveDays[uid]) userActiveDays[uid] = new Set();
      userActiveDays[uid].add(dateStr);
    });

    // ── Ghosting ─────────────────────────────────────────────────────────────
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);
    const ghostedApps = await prisma.application.count({
      where: { status: "Applied", createdAt: { lte: fourteenDaysAgo } },
    });
    const ghostedByPlatform = await prisma.application.groupBy({
      by: ["platform"],
      _count: { id: true },
      where: { status: "Applied", createdAt: { lte: fourteenDaysAgo }, platform: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    });
    const mostGhostedPlatform = ghostedByPlatform[0]?.platform || "N/A";
    const ghostRate = totalApps > 0 ? Math.round((ghostedApps / totalApps) * 100) : 0;

    // ── Rejection stages ──────────────────────────────────────────────────────
    const rejectedApps = await prisma.application.findMany({
      where: { status: "Rejected" },
      select: { statusHistory: true },
    });
    const rejectionStages = { "Resume screening": 0, "OA/Test round": 0, "Interview": 0, "Other": 0 };
    rejectedApps.forEach((app) => {
      const history = Array.isArray(app.statusHistory) ? app.statusHistory : [];
      const hadInterview = history.some((h) => h.status === "Interview");
      const hadOA = history.some((h) => h.status === "OA" || h.status === "Online Assessment");
      if (hadInterview) rejectionStages["Interview"]++;
      else if (hadOA) rejectionStages["OA/Test round"]++;
      else if (history.length <= 1) rejectionStages["Resume screening"]++;
      else rejectionStages["Other"]++;
    });

    // ── Journey averages ──────────────────────────────────────────────────────
    let avgAppsBeforeOffer = 64, avgDaysToOffer = 29;
    if (offerJourneys.length > 0) {
      const userIds = [...new Set(offerJourneys.map((o) => o.clerkUserId))];
      const userAppCounts = await prisma.application.groupBy({
        by: ["clerkUserId"], _count: { id: true },
        where: { clerkUserId: { in: userIds } },
      });
      const userAppMap = {};
      userAppCounts.forEach((u) => { userAppMap[u.clerkUserId] = u._count.id; });
      const appCounts = offerJourneys.map((o) => userAppMap[o.clerkUserId] || 1);
      avgAppsBeforeOffer = Math.round(appCounts.reduce((a, b) => a + b, 0) / appCounts.length);

      const firstAppDates = await prisma.application.groupBy({
        by: ["clerkUserId"], _min: { createdAt: true },
        where: { clerkUserId: { in: userIds } },
      });
      const firstAppMap = {};
      firstAppDates.forEach((u) => { firstAppMap[u.clerkUserId] = u._min.createdAt; });
      const daysList = offerJourneys
        .map((o) => {
          const first = firstAppMap[o.clerkUserId];
          if (!first) return null;
          return Math.round((new Date(o.createdAt) - new Date(first)) / (1000 * 60 * 60 * 24));
        })
        .filter((d) => d !== null && d >= 0);
      if (daysList.length > 0) avgDaysToOffer = Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length);
    }

    // ── Role heatmap ──────────────────────────────────────────────────────────
    const roleCallbackCounts = await prisma.application.groupBy({
      by: ["role"], _count: { id: true },
      where: { status: { in: ["Interview", "Offer"] } },
    });
    const roleCallbackMap = {};
    roleCallbackCounts.forEach((r) => { roleCallbackMap[r.role] = r._count.id; });
    const topTotal = roleRows[0]?._count?.id || 1;
    const roles = roleRows.map((r) => {
      const total = r._count.id;
      const cb = roleCallbackMap[r.role] || 0;
      return {
        role: r.role,
        volume: Math.round((total / topTotal) * 100),
        apps: total,
        callbackRate: total > 0 ? Math.round((cb / total) * 100) : 0,
      };
    });

    // ── Full leaderboard with Clerk usernames ─────────────────────────────────
    const clerkIds = allUsersAppCounts.map((u) => u.clerkUserId);
    let userNameMap = {};
    try {
      const clerk = await clerkClient();
      // Fetch in batches of 100 (Clerk limit)
      const batchSize = 100;
      for (let i = 0; i < clerkIds.length; i += batchSize) {
        const batch = clerkIds.slice(i, i + batchSize);
        const res = await clerk.users.getUserList({ userId: batch });
        const users = res.data ?? res;
        users.forEach((u) => {
          userNameMap[u.id] =
            u.username ||
            u.firstName ||
            u.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
            "User";
        });
      }
    } catch (clerkErr) {
      console.warn("[community/stats] Clerk lookup failed:", clerkErr.message);
      allUsersAppCounts.forEach((u, i) => {
        userNameMap[u.clerkUserId] = `User${i + 1}`;
      });
    }

    // Build full ranked list
    const leaderboard = allUsersAppCounts.map((u, i) => ({
      rank: i + 1,
      clerkUserId: u.clerkUserId,
      username: userNameMap[u.clerkUserId] || "User",
      totalApps: u._count.id,
      activeDays: userActiveDays[u.clerkUserId]?.size || 0,
      isCurrentUser: u.clerkUserId === currentUserId,
    }));

    // ── Current user rank & percentile ────────────────────────────────────────
    const totalUsers = leaderboard.length;
    const currentUserEntry = leaderboard.find((u) => u.clerkUserId === currentUserId);
    const currentUserRank = currentUserEntry?.rank ?? null;
    // "ahead of X%" = users ranked below them / total
    const percentileAhead = currentUserRank
      ? Math.round(((totalUsers - currentUserRank) / Math.max(totalUsers - 1, 1)) * 100)
      : null;

    // ── Misc ──────────────────────────────────────────────────────────────────
    const topPlatform = platforms.length > 0
      ? [...platforms].sort((a, b) => b.callbackRate - a.callbackRate)[0]?.name || "N/A"
      : "N/A";
    const weeklyRoles = await prisma.application.groupBy({
      by: ["role"], _count: { id: true },
      where: { createdAt: { gte: weekAgo } },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    });
    const trendingRole = weeklyRoles[0]?.role || "N/A";

    const communityMood = {
      ghostedPct: ghostRate,
      interviewPct: totalApps > 0 ? Math.round((totalInterviews / totalApps) * 100) : 0,
      offerPct: totalApps > 0 ? Math.round((totalOffers / totalApps) * 100) : 0,
    };

    return NextResponse.json({
      totalApps,
      weeklyApps,
      callbackRate,
      avgAppsBeforeOffer,
      avgDaysToOffer,
      avgInterviewsBeforeOffer: totalApps > 0 ? Math.round(totalInterviews / Math.max(totalOffers, 1)) : 4,
      activeUsers: activeUsersWeek.length,
      topPlatform,
      trendingRole,
      statusMap,
      platforms,
      roles,
      // Leaderboard
      leaderboard,
      totalUsers,
      currentUserRank,
      percentileAhead,
      // Legacy (kept for pulse banner)
      streakLeaders: leaderboard.slice(0, 5),
      ghosting: { ghostedApps, ghostRate, mostGhostedPlatform, avgGhostDays: 14 },
      rejectionStages,
      communityMood,
    });
  } catch (err) {
    console.error("[community/stats]", err);
    return NextResponse.json({ error: "Failed to compute community stats" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}