import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.analysisFlag.deleteMany();
  await prisma.taskInstance.deleteMany();
  await prisma.ship.deleteMany();
  await prisma.canonicalTask.deleteMany();
  await prisma.program.deleteMany();

  const ddg = await prisma.program.create({
    data: { code: "DDG", name: "Arleigh Burke destroyer" },
  });
  const lha = await prisma.program.create({
    data: { code: "LHA", name: "Amphibious assault ship" },
  });
  const lpd = await prisma.program.create({
    data: { code: "LPD", name: "Landing platform dock" },
  });

  const ddg128 = await prisma.ship.create({
    data: {
      programId: ddg.id,
      hullNumber: "128",
      displayName: "DDG 128",
      sortOrder: 128,
    },
  });
  const ddg129 = await prisma.ship.create({
    data: {
      programId: ddg.id,
      hullNumber: "129",
      displayName: "DDG 129",
      sortOrder: 129,
    },
  });

  const lha8 = await prisma.ship.create({
    data: {
      programId: lha.id,
      hullNumber: "8",
      displayName: "LHA 8",
      sortOrder: 8,
    },
  });

  const lpd17 = await prisma.ship.create({
    data: {
      programId: lpd.id,
      hullNumber: "17",
      displayName: "LPD 17",
      sortOrder: 17,
    },
  });

  const tasks = await prisma.$transaction([
    prisma.canonicalTask.create({
      data: {
        code: "ENG-PROP-ALIGN",
        title: "Propulsion shaft alignment",
        scopeUnit: "shaft",
      },
    }),
    prisma.canonicalTask.create({
      data: {
        code: "OUTFIT-CIVS-01",
        title: "Berthing outfit installation",
        scopeUnit: "compartment",
      },
    }),
    prisma.canonicalTask.create({
      data: {
        code: "TEST-SEA-01",
        title: "Sea trials support block",
        scopeUnit: "event",
      },
    }),
  ]);

  const [tAlign, tBerth, tSea] = tasks;

  await prisma.taskInstance.createMany({
    data: [
      {
        shipId: ddg128.id,
        canonicalTaskId: tAlign.id,
        phase: "construction",
        plannedHours: 48,
        actualHours: 50,
        scopeQuantity: 4,
      },
      {
        shipId: ddg129.id,
        canonicalTaskId: tAlign.id,
        phase: "construction",
        plannedHours: 48,
        actualHours: 85,
        scopeQuantity: 4,
      },
      {
        shipId: ddg128.id,
        canonicalTaskId: tBerth.id,
        phase: "outfit",
        plannedHours: 120,
        actualHours: 118,
        scopeQuantity: 12,
      },
      {
        shipId: ddg129.id,
        canonicalTaskId: tBerth.id,
        phase: "outfit",
        plannedHours: 120,
        actualHours: 125,
        scopeQuantity: 12,
      },
      {
        shipId: ddg128.id,
        canonicalTaskId: tSea.id,
        phase: "test",
        plannedHours: 200,
        actualHours: 195,
        scopeQuantity: 1,
      },
      {
        shipId: ddg129.id,
        canonicalTaskId: tSea.id,
        phase: "test",
        plannedHours: 200,
        actualHours: 210,
        scopeQuantity: 1,
      },
      {
        shipId: lha8.id,
        canonicalTaskId: tBerth.id,
        phase: "outfit",
        plannedHours: 400,
        actualHours: 900,
        scopeQuantity: 20,
      },
      {
        shipId: lpd17.id,
        canonicalTaskId: tAlign.id,
        phase: "construction",
        plannedHours: 60,
        actualHours: 62,
        scopeQuantity: 2,
      },
    ],
  });

  console.log("Seed complete: programs, ships, tasks, instances.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
