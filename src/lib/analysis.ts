import type { PrismaClient } from "@prisma/client";

/** Minimum hours on a hull before variance flags apply (reduces noise). */
const MIN_HOURS_FOR_VARIANCE = 8;
/** Flag when actual hours exceed prior hull by at least this fraction. */
const VARIANCE_PCT_THRESHOLD = 0.2;
/** Also flag absolute hour increase when pct is borderline. */
const VARIANCE_ABS_HOURS_THRESHOLD = 15;
/** Hours-per-scope above this multiple of program median → mismatch flag. */
const SCOPE_MISMATCH_MULTIPLIER = 2.25;

export async function runHullToHullAnalysis(prisma: PrismaClient) {
  await prisma.analysisFlag.deleteMany({
    where: { type: "HULL_TO_HULL_VARIANCE" },
  });

  const programs = await prisma.program.findMany({
    include: {
      ships: { orderBy: { sortOrder: "asc" } },
    },
  });

  let created = 0;

  for (const program of programs) {
    const ships = program.ships;
    for (let i = 1; i < ships.length; i++) {
      const prev = ships[i - 1];
      const curr = ships[i];

      const prevTasks = await prisma.taskInstance.findMany({
        where: { shipId: prev.id },
        include: { canonicalTask: true },
      });
      const currTasks = await prisma.taskInstance.findMany({
        where: { shipId: curr.id },
        include: { canonicalTask: true },
      });

      const currByTask = new Map(currTasks.map((t) => [t.canonicalTaskId, t]));

      for (const p of prevTasks) {
        const c = currByTask.get(p.canonicalTaskId);
        if (!c) continue;
        if (p.phase !== c.phase) continue;

        const base = p.actualHours;
        const next = c.actualHours;
        if (base < MIN_HOURS_FOR_VARIANCE) continue;

        const pct = (next - base) / base;
        const abs = next - base;
        if (pct >= VARIANCE_PCT_THRESHOLD || abs >= VARIANCE_ABS_HOURS_THRESHOLD) {
          await prisma.analysisFlag.create({
            data: {
              taskInstanceId: c.id,
              type: "HULL_TO_HULL_VARIANCE",
              severity:
                pct >= 0.5 || abs >= 40 ? "HIGH" : pct >= 0.35 ? "MEDIUM" : "LOW",
              message: `${c.canonicalTask.title}: ${curr.displayName} used ${next.toFixed(1)}h vs ${prev.displayName} ${base.toFixed(1)}h (${(pct * 100).toFixed(0)}% change).`,
              baselineShipId: prev.id,
              baselineHours: base,
              comparedHours: next,
              pctChange: pct * 100,
            },
          });
          created++;
        }
      }
    }
  }

  return { flagsCreated: created };
}

export async function runScopeMismatchAnalysis(prisma: PrismaClient) {
  await prisma.analysisFlag.deleteMany({
    where: { type: "SCOPE_HOURS_MISMATCH" },
  });

  const instances = await prisma.taskInstance.findMany({
    where: { scopeQuantity: { gt: 0 } },
    include: { canonicalTask: true, ship: { include: { program: true } } },
  });

  const byProgram = new Map<string, typeof instances>();
  for (const row of instances) {
    const pid = row.ship.programId;
    const list = byProgram.get(pid) ?? [];
    list.push(row);
    byProgram.set(pid, list);
  }

  let created = 0;

  for (const [, rows] of byProgram) {
    const ratios = rows
      .map((r) => r.actualHours / (r.scopeQuantity ?? 1))
      .filter((x) => Number.isFinite(x));
    if (!ratios.length) continue;
    ratios.sort((a, b) => a - b);
    const median = ratios[Math.floor(ratios.length / 2)];

    for (const r of rows) {
      const qty = r.scopeQuantity ?? 1;
      const hPer = r.actualHours / qty;
      if (!Number.isFinite(hPer) || median <= 0) continue;
      if (hPer >= median * SCOPE_MISMATCH_MULTIPLIER) {
        await prisma.analysisFlag.create({
          data: {
            taskInstanceId: r.id,
            type: "SCOPE_HOURS_MISMATCH",
            severity: hPer >= median * 3 ? "HIGH" : "MEDIUM",
            message: `${r.canonicalTask.title} on ${r.ship.displayName}: ${hPer.toFixed(2)}h per ${r.canonicalTask.scopeUnit ?? "unit"} vs program median ~${median.toFixed(2)}h — check scope or productivity.`,
            comparedHours: r.actualHours,
            pctChange: ((hPer / median) - 1) * 100,
          },
        });
        created++;
      }
    }
  }

  return { flagsCreated: created };
}

export async function runAllAnalysis(prisma: PrismaClient) {
  const a = await runHullToHullAnalysis(prisma);
  const b = await runScopeMismatchAnalysis(prisma);
  return {
    hullToHull: a.flagsCreated,
    scopeMismatch: b.flagsCreated,
    total: a.flagsCreated + b.flagsCreated,
  };
}
