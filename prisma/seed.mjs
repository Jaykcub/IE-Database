import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { buildJobsForShip } from "../lib/job-templates.js";
import {
  METRIC_CATEGORIES,
  METRIC_DEPARTMENTS,
} from "../lib/metric-catalog.js";

dotenv.config({ override: true });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    "Seeding Hullboard — writing users, ships, jobs, and metrics into Postgres…",
  );

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

    let deptIdx = 0;
    for (const dept of METRIC_DEPARTMENTS) {
      let mi = 0;
      const deptFactor = 1 + deptIdx * 0.06 + (ship.id % 4) * 0.015;
      for (const cat of METRIC_CATEGORIES) {
        let value = (10000 + ship.id * 1000 + mi) * deptFactor;
        if (cat === "Labor Hours") {
          value = (14000 + ship.id * 800 + deptIdx * 120) * deptFactor;
        } else if (cat === "Cost Variance") {
          value = ((mi % 5) * 0.35 - 0.4 + deptIdx * 0.02) * (0.92 + (ship.id % 3) * 0.04);
        } else if (cat === "Schedule Variance") {
          value = ((mi % 4) * 0.25 - 0.3 + deptIdx * 0.015) * (0.92 + (ship.id % 3) * 0.04);
        } else if (cat === "Defect Rate") {
          value = (0.9 + (mi % 3) * 0.12 + deptIdx * 0.008) * (0.98 + (ship.id % 2) * 0.02);
        } else if (cat === "Material Spend") {
          value = (220000 + ship.id * 15000 + deptIdx * 8000) * deptFactor;
        }

        await prisma.metric.create({
          data: {
            shipId: ship.id,
            department: dept,
            category: cat,
            value: Math.round(value * 100) / 100,
          },
        });
        mi += 1;
      }
      deptIdx += 1;
    }
  }

  /* Demo: one assistance request + one engineering call for narrative */
  const firstJob = await prisma.job.findFirst({
    where: {
      OR: [
        { woNumber: { contains: "DDG129" } },
        { woNumber: { contains: "DDG-129" } },
      ],
    },
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
