/**
 * Synthetic metric rows when the API returns none (offline / empty DB).
 * Shape matches GET /api/metrics payload for charts.
 */

import {
  METRIC_CATEGORIES,
  METRIC_DEPARTMENTS,
} from "@/lib/metric-catalog";

export const DEMO_SHIP_IDS = new Set([91001, 91002]);

/** Shown when /api/ships returns nothing — lets charts run without Postgres */
export const DEMO_FALLBACK_SHIPS = [
  {
    id: 91001,
    shipClass: "DDG",
    hullNumber: 129,
    displayLabel: "Demo hull (no database)",
  },
  {
    id: 91002,
    shipClass: "DDG",
    hullNumber: 128,
    displayLabel: "Demo hull (no database)",
  },
];

function valueFor(cat, mi, deptIdx, shipId) {
  const deptFactor = 1 + deptIdx * 0.06 + (shipId % 4) * 0.015;
  let value = (10000 + shipId * 1000 + mi) * deptFactor;
  if (cat === "Labor Hours") {
    value = (14000 + shipId * 800 + deptIdx * 120) * deptFactor;
  } else if (cat === "Cost Variance") {
    value =
      ((mi % 5) * 0.35 - 0.4 + deptIdx * 0.02) * (0.92 + (shipId % 3) * 0.04);
  } else if (cat === "Schedule Variance") {
    value =
      ((mi % 4) * 0.25 - 0.3 + deptIdx * 0.015) * (0.92 + (shipId % 3) * 0.04);
  } else if (cat === "Defect Rate") {
    value =
      (0.9 + (mi % 3) * 0.12 + deptIdx * 0.008) * (0.98 + (shipId % 2) * 0.02);
  } else if (cat === "Material Spend") {
    value = (220000 + shipId * 15000 + deptIdx * 8000) * deptFactor;
  }
  return Math.round(value * 100) / 100;
}

/**
 * @param {{ id: number, shipClass: string, hullNumber: number, displayLabel?: string|null }[]} ships
 * @param {string} shipId1
 * @param {string} shipId2
 * @param {string} departmentFilter — optional exact department name
 */
export function buildDemoMetricsForShips(
  ships,
  shipId1,
  shipId2,
  departmentFilter,
) {
  const ids = new Set(
    [shipId1, shipId2].filter(Boolean).map((x) => parseInt(x, 10)),
  );
  const chosen = ships.filter((s) => ids.has(s.id));
  if (chosen.length === 0) return [];

  const depts = departmentFilter
    ? METRIC_DEPARTMENTS.filter((d) => d === departmentFilter)
    : METRIC_DEPARTMENTS;

  if (depts.length === 0) return [];

  const out = [];
  for (const ship of chosen) {
    let deptIdx = 0;
    for (const dept of depts) {
      let mi = 0;
      for (const cat of METRIC_CATEGORIES) {
        out.push({
          id: `demo-${ship.id}-${dept}-${cat}`,
          shipId: ship.id,
          category: cat,
          department: dept,
          value: valueFor(cat, mi, deptIdx, ship.id),
          dateRecorded: new Date(Date.now() - deptIdx * 3600000).toISOString(),
          ship: {
            id: ship.id,
            shipClass: ship.shipClass,
            hullNumber: ship.hullNumber,
            displayLabel: ship.displayLabel ?? null,
          },
        });
        mi += 1;
      }
      deptIdx += 1;
    }
  }
  return out;
}
