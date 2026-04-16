import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shipIds = searchParams.getAll('shipId'); 
    const category = searchParams.get('category');
    
    const whereClause = {};
    if (shipIds.length > 0) {
      whereClause.shipId = { in: shipIds.map(id => parseInt(id)) };
    }
    if (category) {
      whereClause.category = category;
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
    const { shipId, category, value, dateRecorded } = await request.json();
    const newMetric = await prisma.metric.create({
      data: {
        shipId: parseInt(shipId),
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
