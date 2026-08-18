import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { currentPeriodStart } from "@/lib/period";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodStart = currentPeriodStart();

  const activeUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, email: true, name: true },
  });

  const submitted = await prisma.checkIn.findMany({
    where: { periodStart, authorId: { in: activeUsers.map((u) => u.id) } },
    select: { authorId: true },
  });
  const submittedIds = new Set(submitted.map((c) => c.authorId));

  const missing = activeUsers.filter((u) => !submittedIds.has(u.id));

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
      subject: "Reminder: submit this week's check-in",
      text: `Hi ${user.name ?? ""},\n\nYou haven't submitted your check-in for this week yet. Please take a few minutes to fill it out.\n\n— TPP Check-In`,
    });
    sent++;
  }

  return NextResponse.json({ sent, missing: missing.length });
}
