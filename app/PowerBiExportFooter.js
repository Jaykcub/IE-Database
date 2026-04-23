"use client";

async function downloadCsv(url, filename) {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch {
    /* ignore */
  }
}

export default function PowerBiExportFooter() {
  return (
    <footer className="hb-export-footer" aria-label="Power BI and Excel export">
      <div className="hb-export-inner">
        <div className="hb-export-copy">
          <strong className="hb-export-title">Export for Power BI / Excel</strong>
          <p className="hb-export-desc">
            UTF-8 CSV with BOM — in Power BI Desktop choose <em>Get data</em> →{" "}
            <em>Text/CSV</em> (or folder). Refresh after seeding or recording labor.
          </p>
        </div>
        <div className="hb-export-actions">
          <button
            type="button"
            className="hb-export-btn"
            onClick={() =>
              downloadCsv("/api/export/metrics", "hullboard-metrics-powerbi.csv")
            }
          >
            Metrics CSV
          </button>
          <button
            type="button"
            className="hb-export-btn"
            onClick={() =>
              downloadCsv("/api/export/jobs", "hullboard-jobs-powerbi.csv")
            }
          >
            Jobs CSV
          </button>
          <button
            type="button"
            className="hb-export-btn"
            onClick={() =>
              downloadCsv(
                "/api/export/work-sessions",
                "hullboard-work-sessions-powerbi.csv",
              )
            }
          >
            Work sessions CSV
          </button>
        </div>
      </div>
    </footer>
  );
}
