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
    const body = await request.json();
    const { shipClass, hullNumber } = body;
    const displayLabel =
      body.displayLabel || `${shipClass} ${parseInt(hullNumber, 10)}`;
    const newShip = await prisma.ship.create({
      data: {
        shipClass,
        hullNumber: parseInt(hullNumber, 10),
        displayLabel,
      },
    });
    return NextResponse.json(newShip);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
