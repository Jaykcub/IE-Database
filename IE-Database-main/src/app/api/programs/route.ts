import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const programs = await prisma.program.findMany({
    orderBy: { code: "asc" },
    include: {
      ships: { orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json(programs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { code, name } = body as { code: string; name: string };

  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json(
      { error: "code and name are required" },
      { status: 400 },
    );
  }

  const program = await prisma.program.create({
    data: { code: code.trim().toUpperCase(), name: name.trim() },
  });

  return NextResponse.json(program);
}
