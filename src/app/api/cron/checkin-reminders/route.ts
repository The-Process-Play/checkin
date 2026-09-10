import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { currentPeriodStart } from "@/lib/period";

type Stage = "reminder" | "chaser";

const MESSAGES: Record<Stage, { subject: string; body: (name: string) => string }> = {
  reminder: {
    subject: "Reminder: your check-in is due today",
    body: (name) =>
      `Hi ${name},\n\nYour check-in for this week is due today. Please take a few minutes to fill it out.\n\n— TPP Check-In`,
  },
  chaser: {
    subject: "Still missing: this week's check-in",
    body: (name) =>
      `Hi ${name},\n\nYou still haven't submitted your check-in for this week. Please fill it out before the week wraps up.\n\n— TPP Check-In`,
  },
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stageParam = request.nextUrl.searchParams.get("stage");
  const stage: Stage = stageParam === "chaser" ? "chaser" : "reminder";

  const periodStart = currentPeriodStart();

  const activeUsers = await prisma.user.findMany({
    where: { isActive: true, notifyCheckInReminders: true },
    select: { id: true, email: true, name: true },
  });

  const submitted = await prisma.checkIn.findMany({
    where: { periodStart, authorId: { in: activeUsers.map((u) => u.id) } },
    select: { authorId: true },
  });
  const submittedIds = new Set(submitted.map((c) => c.authorId));

  const missing = activeUsers.filter((u) => !submittedIds.has(u.id));

  if (missing.length === 0) {
    return NextResponse.json({ stage, sent: 0, missing: 0 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      stage,
      sent: 0,
      missing: missing.length,
      note: "RESEND_API_KEY not configured — reminders logged but not sent",
      recipients: missing.map((u) => u.email),
    });
  }

  const { subject, body } = MESSAGES[stage];
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const user of missing) {
    await resend.emails.send({
      from: "TPP Check-In <checkin@theprocessplay.com>",
      to: user.email,
      subject,
      text: body(user.name ?? ""),
    });
    sent++;
  }

  return NextResponse.json({ stage, sent, missing: missing.length });
}
