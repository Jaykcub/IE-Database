"use client";

import { useMemo } from "react";
import { buildHiiWorkOrderDocument, HII_WO_DISCLAIMER } from "@/lib/hii-work-order-document";

export default function HiiWorkOrderSheet({ job }) {
  const doc = useMemo(() => buildHiiWorkOrderDocument(job), [job]);

  return (
    <article className="wo-sheet" aria-label="Illustrative work order routing sheet">
      <p className="wo-sheet-disclaimer">{HII_WO_DISCLAIMER}</p>

      <header className="wo-sheet-mast">
        <div className="wo-sheet-brand">
          <span className="wo-sheet-brand-title">Industrial operations routing (demo)</span>
          <span className="wo-sheet-brand-sub">
            Ingalls Shipbuilding-style training layout — Pascagoula, MS (illustrative)
          </span>
        </div>
        <div className="wo-sheet-doc-id">
          <span className="wo-sheet-doc-label">Work order</span>
          <span className="wo-sheet-mono">{doc.woNumber}</span>
        </div>
      </header>

      <div className="wo-sheet-meta-grid">
        <div className="wo-sheet-field">
          <span className="wo-sheet-label">Revision</span>
          <span className="wo-sheet-val wo-sheet-mono">{doc.revision}</span>
        </div>
        <div className="wo-sheet-field">
          <span className="wo-sheet-label">Issued</span>
          <span className="wo-sheet-val">{doc.issuedDate}</span>
        </div>
        <div className="wo-sheet-field wo-sheet-field--wide">
          <span className="wo-sheet-label">Program / context</span>
          <span className="wo-sheet-val">{doc.programLine}</span>
        </div>
        <div className="wo-sheet-field">
          <span className="wo-sheet-label">Hull</span>
          <span className="wo-sheet-val">{doc.ship}</span>
        </div>
        <div className="wo-sheet-field">
          <span className="wo-sheet-label">Phase</span>
          <span className="wo-sheet-val">{doc.phase}</span>
        </div>
        <div className="wo-sheet-field wo-sheet-field--wide">
          <span className="wo-sheet-label">Shop / area</span>
          <span className="wo-sheet-val">
            {doc.workCenterName} ({doc.workCenterCode})
          </span>
        </div>
      </div>

      <section className="wo-sheet-section">
        <h4 className="wo-sheet-h">References &amp; location</h4>
        <dl className="wo-sheet-dl">
          <div>
            <dt>Work package</dt>
            <dd className="wo-sheet-mono">{doc.workPackageCode}</dd>
          </div>
          <div>
            <dt>Drawing / index</dt>
            <dd className="wo-sheet-mono">{doc.drawingRef}</dd>
          </div>
          <div>
            <dt>Zone / frame</dt>
            <dd>{doc.zone}</dd>
          </div>
          <div>
            <dt>Schedule bucket</dt>
            <dd className="wo-sheet-mono">{doc.scheduleCode}</dd>
          </div>
        </dl>
      </section>

      <section className="wo-sheet-section">
        <h4 className="wo-sheet-h">Scope of work</h4>
        <p className="wo-sheet-scope">{doc.scope}</p>
        {doc.notes ? (
          <p className="wo-sheet-notes">
            <strong>Planner notes:</strong> {doc.notes}
          </p>
        ) : null}
      </section>

      <section className="wo-sheet-section wo-sheet-split">
        <div>
          <h4 className="wo-sheet-h">Execution steps</h4>
          <ol className="wo-sheet-ol">
            {doc.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
        <div>
          <h4 className="wo-sheet-h">Material / kit (typical)</h4>
          <ul className="wo-sheet-ul">
            {doc.materials.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wo-sheet-section">
        <h4 className="wo-sheet-h">Quality hold points</h4>
        <ul className="wo-sheet-ul wo-sheet-ul--inline">
          {doc.qaHoldPoints.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      <section className="wo-sheet-section wo-sheet-labor">
        <h4 className="wo-sheet-h">Labor &amp; status</h4>
        <div className="wo-sheet-labor-grid">
          <div>
            <span className="wo-sheet-label">Planned hours</span>
            <span className="wo-sheet-val">{doc.plannedHours}</span>
          </div>
          <div>
            <span className="wo-sheet-label">Router status</span>
            <span className="wo-sheet-val wo-sheet-mono">{doc.status}</span>
          </div>
        </div>
      </section>

      <footer className="wo-sheet-footer">
        <div className="wo-sheet-sig">
          <span>Planner / PP&amp;S review</span>
          <span className="wo-sheet-sig-line" />
        </div>
        <div className="wo-sheet-sig">
          <span>Shop supervisor</span>
          <span className="wo-sheet-sig-line" />
        </div>
        <div className="wo-sheet-sig">
          <span>QC release</span>
          <span className="wo-sheet-sig-line" />
        </div>
      </footer>
    </article>
  );
}
