import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function PATCH(req, { params }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const updates = await req.json();

  const existing = await prisma.application.findFirst({
    where: { id, clerkUserId: userId },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const application = await prisma.application.update({
    where: { id },
    data: {
      ...(updates.company !== undefined && { company: updates.company }),
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.jobType !== undefined && { jobType: updates.jobType }),
      ...(updates.applyType !== undefined && { applyType: updates.applyType }),
      ...(updates.platform !== undefined && { platform: updates.platform }),
      ...(updates.jobLink !== undefined && { jobLink: updates.jobLink }),
      ...(updates.dateApplied !== undefined && {
        dateApplied: updates.dateApplied ? new Date(updates.dateApplied) : null,
      }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.workType !== undefined && { workType: updates.workType }),
      ...(updates.followUpDate !== undefined && {
        followUpDate: updates.followUpDate
          ? new Date(updates.followUpDate)
          : null,
      }),
      ...(updates.salary !== undefined && { salary: updates.salary }),
      ...(updates.resumeVersion !== undefined && {
        resumeVersion: updates.resumeVersion,
      }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.rejectionReason !== undefined && {
        rejectionReason: updates.rejectionReason || null,
      }),
      ...(updates.statusHistory !== undefined && {
        statusHistory: updates.statusHistory,
      }),
    },
  });

  return NextResponse.json({ application });
}

export async function DELETE(req, { params }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  await prisma.application.deleteMany({
    where: { id, clerkUserId: userId },
  });

  return NextResponse.json({ ok: true });
}