import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: { ship: true },
      orderBy: { dateCreated: 'desc' }
    });
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const newJob = await prisma.job.create({
      data: {
        shipId: parseInt(data.shipId),
        department: data.department,
        jobDescription: data.jobDescription,
        allocatedHours: parseFloat(data.allocatedHours),
        actualHours: data.actualHours ? parseFloat(data.actualHours) : null,
        materialCost: data.materialCost ? parseFloat(data.materialCost) : null,
        status: data.status || 'OPEN'
      }
    });
    return NextResponse.json(newJob);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
