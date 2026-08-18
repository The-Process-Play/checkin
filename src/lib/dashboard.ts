import { prisma } from "@/lib/prisma";
import { currentPeriodStart } from "@/lib/period";

const AT_RISK_MOOD_THRESHOLD = 2.5;
const MOOD_LOOKBACK_CHECKINS = 2;
const MISSED_PERIODS_THRESHOLD = 2;

export type TeamMemberStatus = {
  id: string;
  name: string | null;
  email: string;
  submittedThisPeriod: boolean;
  latestMoodScore: number | null;
  recentAvgMood: number | null;
  consecutiveMissedPeriods: number;
  atRisk: boolean;
};

export async function getTeamStatus(userIds: string[]): Promise<TeamMemberStatus[]> {
  const periodStart = currentPeriodStart();
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, isActive: true },
    select: { id: true, name: true, email: true },
  });

  const results: TeamMemberStatus[] = [];
  for (const user of users) {
    const recentCheckIns = await prisma.checkIn.findMany({
      where: { authorId: user.id },
      orderBy: { periodStart: "desc" },
      take: Math.max(MOOD_LOOKBACK_CHECKINS, MISSED_PERIODS_THRESHOLD + 1),
    });

    const submittedThisPeriod = recentCheckIns.some(
      (c) => c.periodStart.getTime() === periodStart.getTime()
    );

    const moodValues = recentCheckIns
      .slice(0, MOOD_LOOKBACK_CHECKINS)
      .map((c) => c.moodScore)
      .filter((m): m is number => m != null);
    const recentAvgMood = moodValues.length
      ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length
      : null;

    let consecutiveMissedPeriods = 0;
    for (let weeksAgo = 0; weeksAgo < MISSED_PERIODS_THRESHOLD + 1; weeksAgo++) {
      const expected = new Date(periodStart);
      expected.setUTCDate(expected.getUTCDate() - weeksAgo * 7);
      const hasCheckIn = recentCheckIns.some((c) => c.periodStart.getTime() === expected.getTime());
      if (hasCheckIn) break;
      consecutiveMissedPeriods++;
    }

    const atRisk =
      (recentAvgMood != null && recentAvgMood < AT_RISK_MOOD_THRESHOLD) ||
      consecutiveMissedPeriods >= MISSED_PERIODS_THRESHOLD;

    results.push({
      id: user.id,
      name: user.name,
      email: user.email,
      submittedThisPeriod,
      latestMoodScore: recentCheckIns[0]?.moodScore ?? null,
      recentAvgMood,
      consecutiveMissedPeriods,
      atRisk,
    });
  }

  return results;
}

export async function getCompletionRate(userIds: string[]) {
  const periodStart = currentPeriodStart();
  const submittedCount = await prisma.checkIn.count({
    where: { authorId: { in: userIds }, periodStart },
  });
  return { submitted: submittedCount, total: userIds.length };
}

export async function getMoodTrend(userIds: string[], weeks = 6) {
  const periodStart = currentPeriodStart();
  const since = new Date(periodStart);
  since.setUTCDate(since.getUTCDate() - (weeks - 1) * 7);

  const checkIns = await prisma.checkIn.findMany({
    where: { authorId: { in: userIds }, periodStart: { gte: since } },
    select: { periodStart: true, moodScore: true, energyScore: true },
  });

  const byWeek = new Map<string, { moodSum: number; moodCount: number; energySum: number; energyCount: number }>();
  for (const c of checkIns) {
    const key = c.periodStart.toISOString();
    const bucket = byWeek.get(key) ?? { moodSum: 0, moodCount: 0, energySum: 0, energyCount: 0 };
    if (c.moodScore != null) {
      bucket.moodSum += c.moodScore;
      bucket.moodCount++;
    }
    if (c.energyScore != null) {
      bucket.energySum += c.energyScore;
      bucket.energyCount++;
    }
    byWeek.set(key, bucket);
  }

  return Array.from(byWeek.entries())
    .map(([periodStartIso, b]) => ({
      periodStart: new Date(periodStartIso),
      avgMood: b.moodCount ? b.moodSum / b.moodCount : null,
      avgEnergy: b.energyCount ? b.energySum / b.energyCount : null,
    }))
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
}
