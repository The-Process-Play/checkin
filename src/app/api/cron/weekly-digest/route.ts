import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getTeamStatus, getCompletionRate } from "@/lib/dashboard";

function digestBody(managerName: string, completion: { submitted: number; total: number }, atRisk: { name: string | null; email: string }[]) {
  const lines = [
    `Hi ${managerName},`,
    "",
    `Your team submitted ${completion.submitted} of ${completion.total} check-ins this week.`,
  ];

  if (atRisk.length > 0) {
    lines.push("", "At risk:", ...atRisk.map((u) => `- ${u.name ?? u.email}`));
  } else {
    lines.push("", "No one is currently flagged as at risk.");
  }

  lines.push("", "— TPP Check-In");
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", isActive: true, notifyWeeklyDigest: true },
    select: { id: true, name: true, email: true },
  });

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  let sent = 0;
  let skippedNoReports = 0;
  const wouldSendTo: string[] = [];

  for (const manager of managers) {
    const reports = await prisma.user.findMany({
      where: { managerId: manager.id, isActive: true },
      select: { id: true },
    });
    const reportIds = reports.map((r) => r.id);
    if (reportIds.length === 0) {
      skippedNoReports++;
      continue;
    }

    const [completion, statuses] = await Promise.all([
      getCompletionRate(reportIds),
      getTeamStatus(reportIds),
    ]);
    const atRisk = statuses.filter((s) => s.atRisk);

    if (!resend) {
      wouldSendTo.push(manager.email);
      continue;
    }

    await resend.emails.send({
      from: "TPP Check-In <checkin@theprocessplay.com>",
      to: manager.email,
      subject: "Your weekly team digest",
      text: digestBody(manager.name ?? "", completion, atRisk),
    });
    sent++;
  }

  if (!resend) {
    return NextResponse.json({
      sent: 0,
      note: "RESEND_API_KEY not configured — digests logged but not sent",
      recipients: wouldSendTo,
      skippedNoReports,
    });
  }

  return NextResponse.json({ sent, skippedNoReports });
}
