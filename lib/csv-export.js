/** CSV helpers for Power BI / Excel import (UTF-8 with BOM). */

export function csvEscapeCell(val) {
  const s = val === null || val === undefined ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers, rows) {
  const lines = [headers.map(csvEscapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvEscapeCell).join(","));
  }
  return `\ufeff${lines.join("\r\n")}`;
}
