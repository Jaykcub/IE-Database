import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toCsv } from "@/lib/csv-export";

export async function GET() {
  try {
    const rows = await prisma.job.findMany({
      include: { ship: true },
      orderBy: [{ shipId: "asc" }, { id: "asc" }],
    });

    const headers = [
      "job_id",
      "wo_number",
      "ship_id",
      "ship_class",
      "hull_number",
      "department",
      "work_center_code",
      "phase",
      "status",
      "allocated_hours",
      "actual_hours",
      "material_cost",
      "work_package_code",
      "drawing_ref",
      "zone",
      "schedule_code",
      "date_created_iso",
      "completed_at_iso",
    ];

    const csvRows = rows.map((j) => [
      j.id,
      j.woNumber,
      j.shipId,
      j.ship.shipClass,
      j.ship.hullNumber,
      j.department,
      j.workCenterCode ?? "",
      j.phase ?? "",
      j.status,
      j.allocatedHours,
      j.actualHours ?? "",
      j.materialCost ?? "",
      j.workPackageCode ?? "",
      j.drawingRef ?? "",
      j.zone ?? "",
      j.scheduleCode ?? "",
      j.dateCreated instanceof Date
        ? j.dateCreated.toISOString()
        : String(j.dateCreated),
      j.completedAt
        ? j.completedAt instanceof Date
          ? j.completedAt.toISOString()
          : String(j.completedAt)
        : "",
    ]);

    const body = toCsv(headers, csvRows);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="hullboard-jobs-powerbi.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
