import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { buildJobsForShip } from "../lib/job-templates.js";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const METRIC_CATEGORIES = [
  "Labor Hours",
  "Cost Variance",
  "Schedule Variance",
  "Defect Rate",
  "Material Spend",
];

async function main() {
  console.log("Seeding Hullboard — users, hull-specific jobs, demo metrics…");

  await prisma.callBoardEntry.deleteMany();
  await prisma.assistanceRequest.deleteMany();
  await prisma.workSession.deleteMany();
  await prisma.job.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.ship.deleteMany();
  await prisma.user.deleteMany();

  const users = await prisma.user.createMany({
    data: [
      {
        name: "Alex Rivera",
        role: "TECHNICIAN",
        departmentScope: "Pipe Fabrication & Installation",
        title: "Pipefitter A",
      },
      {
        name: "Jordan Mills",
        role: "TECHNICIAN",
        departmentScope: "Welding Production",
        title: "Welder B",
      },
      {
        name: "Sam Okonkwo",
        role: "FOREMAN",
        departmentScope: "Pipe Fabrication & Installation",
        title: "Pipe Shop Foreman",
      },
      {
        name: "Riley Nguyen",
        role: "FOREMAN",
        departmentScope: "Electrical & Shipboard Cable",
        title: "Electrical Foreman",
      },
      {
        name: "Dr. Casey Lin",
        role: "ENGINEER",
        departmentScope: null,
        title: "Hull Mechanical Engineer",
      },
      {
        name: "Morgan Stiles",
        role: "IE",
        departmentScope: null,
        title: "Industrial Engineer",
      },
      {
        name: "Admin Demo",
        role: "ADMIN",
        departmentScope: null,
        title: "Yard Administrator",
      },
    ],
  });

  console.log(`Created ${users.count} yard identities.`);

  const shipDefs = [
    { shipClass: "DDG", hullNumber: 129, displayLabel: "DDG 129 (demo build band)" },
    { shipClass: "DDG", hullNumber: 128, displayLabel: "DDG 128" },
    { shipClass: "LHA", hullNumber: 8, displayLabel: "LHA 8" },
    { shipClass: "LPD", hullNumber: 28, displayLabel: "LPD 28" },
    { shipClass: "DDGX", hullNumber: 3, displayLabel: "DDGX 3 (technology demonstrator)" },
  ];

  for (const def of shipDefs) {
    const ship = await prisma.ship.create({
      data: {
        shipClass: def.shipClass,
        hullNumber: def.hullNumber,
        displayLabel: def.displayLabel,
      },
    });

    const jobs = buildJobsForShip(ship);
    for (const j of jobs) {
      await prisma.job.create({
        data: { shipId: ship.id, ...j },
      });
    }

    let mi = 0;
    for (const cat of METRIC_CATEGORIES) {
      let value = 10000 + ship.id * 1000 + mi;
      if (cat === "Labor Hours") value = 14000 + ship.id * 800;
      if (cat === "Cost Variance") value = (mi % 5) * 0.35 - 0.4;
      if (cat === "Schedule Variance") value = (mi % 4) * 0.25 - 0.3;
      if (cat === "Defect Rate") value = 0.9 + (mi % 3) * 0.12;
      if (cat === "Material Spend") value = 220000 + ship.id * 15000;

      await prisma.metric.create({
        data: {
          shipId: ship.id,
          department: "Planning Yard",
          category: cat,
          value: Math.round(value * 100) / 100,
        },
      });
      mi += 1;
    }
  }

  /* Demo: one assistance request + one engineering call for narrative */
  const firstJob = await prisma.job.findFirst({
    where: { woNumber: { contains: "DDG-129" } },
    orderBy: { id: "asc" },
  });
  const alex = await prisma.user.findFirst({ where: { name: "Alex Rivera" } });
  const casey = await prisma.user.findFirst({ where: { name: "Dr. Casey Lin" } });

  if (firstJob && alex) {
    await prisma.assistanceRequest.create({
      data: {
        jobId: firstJob.id,
        fromUserId: alex.id,
        message:
          "Need foreman eyes on JP-5 loop torque sequence — interference with adjacent cable tray.",
      },
    });
  }

  if (firstJob && casey) {
    await prisma.callBoardEntry.create({
      data: {
        jobId: firstJob.id,
        openedById: alex.id,
        category: "ENGINEERING",
        description:
          "Request EC review for routing clip spacing vs shock qualification margin.",
        engineerId: casey.id,
        engineerResponse:
          "Approved alternate clip pattern per sketch SK-4412 rev C — update traveler before hydro.",
        resolutionNote: "IE notified for standard hours adjustment (+4h planning).",
        status: "CLOSED",
        closedAt: new Date(),
      },
    });
    await prisma.job.update({
      where: { id: firstJob.id },
      data: { status: "OPEN" },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
