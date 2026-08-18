import { PrismaClient, QuestionType, GoalType, GoalStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function isoWeekStart(weeksAgo: number): Date {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const thisMonday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1)
  );
  thisMonday.setUTCDate(thisMonday.getUTCDate() - weeksAgo * 7);
  return thisMonday;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  console.log("Seeding database...");

  const template = await prisma.checkInTemplate.upsert({
    where: { id: "default-template" },
    update: {},
    create: {
      id: "default-template",
      name: "Weekly Check-In",
      questions: {
        create: [
          { prompt: "What went well this week?", type: QuestionType.TEXT, order: 1 },
          { prompt: "What's blocking you, if anything?", type: QuestionType.TEXT, order: 2 },
          { prompt: "How was your mood this week?", type: QuestionType.SCALE, order: 3 },
          { prompt: "How was your energy this week?", type: QuestionType.SCALE, order: 4 },
        ],
      },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@theprocessplay.com" },
    update: {},
    create: {
      email: "admin@theprocessplay.com",
      name: "Ada Admin",
      role: "ADMIN",
      title: "Operations Lead",
    },
  });

  const managerAlex = await prisma.user.upsert({
    where: { email: "alex.manager@theprocessplay.com" },
    update: {},
    create: {
      email: "alex.manager@theprocessplay.com",
      name: "Alex Rivera",
      role: "MANAGER",
      title: "Engineering Manager",
    },
  });

  const managerJordan = await prisma.user.upsert({
    where: { email: "jordan.manager@theprocessplay.com" },
    update: {},
    create: {
      email: "jordan.manager@theprocessplay.com",
      name: "Jordan Blake",
      role: "MANAGER",
      title: "Design Manager",
    },
  });

  const employees = await Promise.all(
    [
      { email: "sam.employee@theprocessplay.com", name: "Sam Lee", managerId: managerAlex.id, title: "Software Engineer" },
      { email: "taylor.employee@theprocessplay.com", name: "Taylor Kim", managerId: managerAlex.id, title: "Software Engineer" },
      { email: "morgan.employee@theprocessplay.com", name: "Morgan Diaz", managerId: managerAlex.id, title: "QA Engineer" },
      { email: "casey.employee@theprocessplay.com", name: "Casey Nguyen", managerId: managerJordan.id, title: "Product Designer" },
      { email: "riley.employee@theprocessplay.com", name: "Riley Chen", managerId: managerJordan.id, title: "Product Designer" },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { email: u.email, name: u.name, managerId: u.managerId, title: u.title, role: "EMPLOYEE" },
      })
    )
  );

  const allStaff = [admin, managerAlex, managerJordan, ...employees];

  // Backdated check-ins for the last 3 weeks so dashboards have trend data immediately.
  const moodByPersonWeek: Record<string, number[]> = {
    [managerAlex.id]: [4, 4, 5],
    [managerJordan.id]: [3, 4, 4],
    [employees[0].id]: [4, 5, 4], // Sam
    [employees[1].id]: [2, 2, 2], // Taylor - trending at-risk
    [employees[2].id]: [3, 3, 4], // Morgan
    [employees[3].id]: [5, 4, 5], // Casey
    // Riley (employees[4]) intentionally has no check-ins yet - shows up as missing
  };

  for (const [userId, moods] of Object.entries(moodByPersonWeek)) {
    // moods[0] = oldest week, moods[last] = current week
    for (let weeksAgo = moods.length - 1; weeksAgo >= 0; weeksAgo--) {
      const periodStart = isoWeekStart(weeksAgo);
      const mood = moods[moods.length - 1 - weeksAgo];
      const checkIn = await prisma.checkIn.upsert({
        where: { authorId_periodStart: { authorId: userId, periodStart } },
        update: {},
        create: {
          authorId: userId,
          templateId: template.id,
          periodStart,
          periodEnd: addDays(periodStart, 6),
          moodScore: mood,
          energyScore: Math.max(1, mood - 1),
          submittedAt: addDays(periodStart, 2),
        },
      });

      await prisma.checkInResponse.upsert({
        where: { checkInId_questionId: { checkInId: checkIn.id, questionId: template.questions[0].id } },
        update: {},
        create: {
          checkInId: checkIn.id,
          questionId: template.questions[0].id,
          textValue: "Shipped a solid chunk of work and had a good pairing session.",
        },
      });
    }
  }

  // A couple of sample goals.
  const samGoal = await prisma.goal.upsert({
    where: { id: "seed-goal-sam" },
    update: {},
    create: {
      id: "seed-goal-sam",
      title: "Ship the check-in reminder cron job",
      description: "Build and deploy the weekly reminder email flow.",
      type: GoalType.INDIVIDUAL,
      status: GoalStatus.ON_TRACK,
      ownerId: employees[0].id,
      progress: 60,
      startDate: isoWeekStart(3),
      targetDate: addDays(isoWeekStart(0), 21),
    },
  });

  await prisma.goalUpdate.upsert({
    where: { id: "seed-goal-update-sam-1" },
    update: {},
    create: {
      id: "seed-goal-update-sam-1",
      goalId: samGoal.id,
      authorId: employees[0].id,
      progress: 60,
      note: "Cron endpoint scaffolded, wiring up Resend next.",
    },
  });

  console.log(`Seeded ${allStaff.length} users, 1 template, check-ins, and 1 goal.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
