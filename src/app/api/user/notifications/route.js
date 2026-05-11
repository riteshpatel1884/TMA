// app/api/user/notifications/route.js
// PATCH /api/user/notifications — toggle email notification preference

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { emailNotifications } = await req.json();

  await prisma.user.update({
    where: { clerkUserId: userId },
    data: { emailNotifications: Boolean(emailNotifications) },
  });

  return NextResponse.json({ success: true, emailNotifications });
}

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { emailNotifications: true },
  });

  return NextResponse.json({ emailNotifications: user?.emailNotifications ?? true });
}