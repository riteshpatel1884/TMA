import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await prisma.application.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const application = await prisma.application.create({
    data: {
      id: body.id,
      clerkUserId: userId,
      company: body.company,
      role: body.role,
      jobType: body.jobType ?? "Job",
      applyType: body.applyType ?? "Direct Apply",
      platform: body.platform || null,
      jobLink: body.jobLink || null,
      dateApplied: body.dateApplied ? new Date(body.dateApplied) : null,
      status: body.status ?? "Applied",
      workType: body.workType ?? "Onsite",
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      salary: body.salary || null,
      resumeVersion: body.resumeVersion || null,
      notes: body.notes || null,
      rejectionReason: body.rejectionReason || null,
      statusHistory: body.statusHistory ?? [],
      createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
    },
  });

  return NextResponse.json({ application });
}