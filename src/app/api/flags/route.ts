import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const flags = await prisma.analysisFlag.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      taskInstance: {
        include: {
          canonicalTask: true,
          ship: { include: { program: true } },
        },
      },
    },
    take: 200,
  });
  return NextResponse.json(flags);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, resolved } = body as { id: string; resolved: boolean };

  if (!id || typeof resolved !== "boolean") {
    return NextResponse.json(
      { error: "id and resolved are required" },
      { status: 400 },
    );
  }

  const flag = await prisma.analysisFlag.update({
    where: { id },
    data: { resolved },
  });

  return NextResponse.json(flag);
}
