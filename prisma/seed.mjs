import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with expanded Job and Metric structures...');

  const shipsToCreate = [
    { shipClass: 'DDG', hullNumber: 128 },
    { shipClass: 'DDG', hullNumber: 129 },
    { shipClass: 'LPD', hullNumber: 29 },
    { shipClass: 'LPD', hullNumber: 30 },
    { shipClass: 'DDGX', hullNumber: 1 },
  ];

  const categories = ['Labor Hours', 'Cost Variance', 'Schedule Variance', 'Defect Rate', 'Material Spend'];
  const departments = ['Electrical', 'Mechanical', 'Pipefitting', 'Welding', 'Paint'];

  for (const s of shipsToCreate) {
    let ship = await prisma.ship.findUnique({
      where: { hullNumber: s.hullNumber }
    });
    
    if (!ship) {
      ship = await prisma.ship.create({ data: s });
      console.log(`Created Ship ${s.shipClass} ${s.hullNumber}`);
    }

    // Generate discrete Job Entries
    for (const dept of departments) {
      const numJobs = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numJobs; i++) {
        const allocated = 100 + Math.random() * 900;
        await prisma.job.create({
          data: {
            shipId: ship.id,
            department: dept,
            jobDescription: `Routine ${dept} Outfitting Phase ${i + 1}`,
            allocatedHours: parseFloat(allocated.toFixed(1)),
            actualHours: parseFloat((allocated + (Math.random() * 40 - 15)).toFixed(1)),
            materialCost: parseFloat((5000 + Math.random() * 20000).toFixed(2)),
            status: Math.random() > 0.5 ? 'COMPLETED' : 'IN_PROGRESS'
          }
        });
      }
    }

    // Generate departmental legacy metrics
    for (const cat of categories) {
      for (const dept of departments) {
        let value = 0;
        if (cat === 'Labor Hours') value = 15000 + Math.random() * 5000;
        if (cat === 'Cost Variance') value = Math.random() * 5 - 1; 
        if (cat === 'Schedule Variance') value = Math.random() * 4 - 1; 
        if (cat === 'Defect Rate') value = 1 + Math.random() * 2; 
        if (cat === 'Material Spend') value = 250000 + Math.random() * 50000;

        await prisma.metric.create({
          data: {
            shipId: ship.id,
            department: dept,
            category: cat,
            value: parseFloat(value.toFixed(2))
          }
        });
      }
    }
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
