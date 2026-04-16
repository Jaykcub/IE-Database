import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const ships = await prisma.ship.findMany({
      orderBy: [
        { shipClass: 'asc' },
        { hullNumber: 'asc' }
      ]
    });
    return NextResponse.json(ships);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { shipClass, hullNumber } = await request.json();
    const newShip = await prisma.ship.create({
      data: {
        shipClass,
        hullNumber: parseInt(hullNumber)
      }
    });
    return NextResponse.json(newShip);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
