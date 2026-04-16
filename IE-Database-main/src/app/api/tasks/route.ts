import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.canonicalTask.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { code, title, scopeUnit } = body as {
    code: string;
    title: string;
    scopeUnit?: string | null;
  };

  if (!code || !title) {
    return NextResponse.json(
      { error: "code and title are required" },
      { status: 400 },
    );
  }

  const task = await prisma.canonicalTask.create({
    data: {
      code: code.trim(),
      title: title.trim(),
      scopeUnit: scopeUnit?.trim() || null,
    },
  });

  return NextResponse.json(task);
}
