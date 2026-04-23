import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toCsv } from "@/lib/csv-export";

export async function GET() {
  try {
    const rows = await prisma.metric.findMany({
      include: { ship: true },
      orderBy: [{ shipId: "asc" }, { department: "asc" }, { category: "asc" }],
    });

    const headers = [
      "metric_id",
      "ship_id",
      "ship_class",
      "hull_number",
      "display_label",
      "department",
      "metric_category",
      "value",
      "date_recorded_iso",
    ];

    const csvRows = rows.map((m) => [
      m.id,
      m.shipId,
      m.ship.shipClass,
      m.ship.hullNumber,
      m.ship.displayLabel ?? "",
      m.department ?? "",
      m.category,
      m.value,
      m.dateRecorded instanceof Date
        ? m.dateRecorded.toISOString()
        : String(m.dateRecorded),
    ]);

    const body = toCsv(headers, csvRows);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="hullboard-metrics-powerbi.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
