import { NextResponse } from "next/server";
import { runAllAnalysis } from "@/lib/analysis";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const summary = await runAllAnalysis(prisma);
  return NextResponse.json(summary);
}
