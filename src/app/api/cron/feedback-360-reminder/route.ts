import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

/** First moment (UTC) of the calendar quarter containing `date`. */
function currentQuarterStart(date: Date = new Date()): Date {
  const quarterMonth = Math.floor(date.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), quarterMonth, 1));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quarterStart = currentQuarterStart();

  const activeUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, email: true, name: true },
  });

  const requestedThisQuarter = await prisma.feedbackRequest.findMany({
    where: { subjectId: { in: activeUsers.map((u) => u.id) }, createdAt: { gte: quarterStart } },
    select: { subjectId: true },
  });
  const requestedIds = new Set(requestedThisQuarter.map((r) => r.subjectId));

  // Deliberately not gated by a per-user opt-out: this is meant to be a
  // mandatory quarterly nudge, per the feedback doc's "Alex is keen that this
  // be made mandatory each quarter" — unlike the weekly check-in reminders.
  const missing = activeUsers.filter((u) => !requestedIds.has(u.id));

  if (missing.length === 0) {
    return NextResponse.json({ sent: 0, missing: 0 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      sent: 0,
      missing: missing.length,
      note: "RESEND_API_KEY not configured — reminders logged but not sent",
      recipients: missing.map((u) => u.email),
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const user of missing) {
    await resend.emails.send({
      from: "TPP Check-In <checkin@theprocessplay.com>",
      to: user.email,
      subject: "Time to request your quarterly 360 feedback",
      text: `Hi ${user.name ?? ""},\n\nIt's a new quarter — please take a couple minutes to request 360 feedback from two colleagues.\n\n— TPP Check-In`,
    });
    sent++;
  }

  return NextResponse.json({ sent, missing: missing.length });
}
