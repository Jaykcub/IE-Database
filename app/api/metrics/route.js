import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shipIds = searchParams.getAll('shipId'); 
    const category = searchParams.get('category');
    const department = searchParams.get('department');
    
    const whereClause = {};
    if (shipIds.length > 0) {
      whereClause.shipId = { in: shipIds.map(id => parseInt(id)) };
    }
    if (category) {
      whereClause.category = category;
    }
    if (department) {
      whereClause.department = department;
    }

    const metrics = await prisma.metric.findMany({
      where: whereClause,
      include: { ship: true },
      orderBy: { dateRecorded: 'asc' }
    });

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { shipId, department, category, value, dateRecorded } = await request.json();
    const newMetric = await prisma.metric.create({
      data: {
        shipId: parseInt(shipId),
        department: department || null,
        category,
        value: parseFloat(value),
        dateRecorded: dateRecorded ? new Date(dateRecorded) : new Date()
      }
    });
    return NextResponse.json(newMetric);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
