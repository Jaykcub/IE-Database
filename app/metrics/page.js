"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { METRIC_DEPARTMENTS } from "@/lib/metric-catalog";

export default function MetricsPage() {
  const [actor, setActor] = useState(null);
  const [ships, setShips] = useState([]);
  const [ship1, setShip1] = useState("");
  const [ship2, setShip2] = useState("");
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState("");

  useEffect(() => {
    fetch("/api/session", { credentials: "include" })
      .then((res) => res.json())
      .then((d) => setActor(d?.user ?? null))
      .catch(() => setActor(null));

    fetch("/api/ships", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setShips(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    async function loadMetrics() {
      if (!ship1 && !ship2) {
        setMetrics([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams();
      if (ship1) params.append("shipId", ship1);
      if (ship2) params.append("shipId", ship2);
      if (department) params.append("department", department);

      try {
        const res = await fetch(`/api/metrics?${params.toString()}`, {
          credentials: "include",
        });
        const data = await res.json();
        setMetrics(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setMetrics([]);
      }
      setLoading(false);
    }
    loadMetrics();
  }, [ship1, ship2, department]);

  const chartFromMetrics = useMemo(() => {
    const tally = {};
    metrics.forEach((m) => {
      const shipKey = `Ship ${m.ship.shipClass}-${m.ship.hullNumber}`;
      if (!tally[m.category]) tally[m.category] = {};
      const cur = tally[m.category][shipKey];
      tally[m.category][shipKey] = cur
        ? { sum: cur.sum + m.value, count: cur.count + 1 }
        : { sum: m.value, count: 1 };
    });

    const rows = [];
    Object.keys(tally).forEach((category) => {
      const row = { category };
      Object.entries(tally[category]).forEach(([shipKey, cell]) => {
        row[shipKey] =
          department === ""
            ? Math.round((cell.sum / cell.count) * 10000) / 10000
            : cell.sum;
      });
      rows.push(row);
    });

    const keysSet = new Set(
      metrics.map((m) => `Ship ${m.ship.shipClass}-${m.ship.hullNumber}`),
    );

    return { rows, keys: Array.from(keysSet) };
  }, [metrics, department]);

  const finalData = chartFromMetrics.rows;
  const keys = chartFromMetrics.keys;
  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

  const formatTooltip = (value, name, props) => {
    const isDollar =
      props.payload.category.includes("Cost") ||
      props.payload.category.includes("Spend");
    const roundedValue = Math.round(value);
    return [
      isDollar
        ? `$${roundedValue.toLocaleString()}`
        : roundedValue.toLocaleString(),
      name,
    ];
  };

  const formatYAxis = (val) => {
    return Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(val);
  };

  if (actor?.role === "TECHNICIAN") {
    return (
      <div className="page-container animate-fade-in">
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h1 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>
            Metrics Hidden for Technician Role
          </h1>
          <p style={{ opacity: 0.85 }}>
            This view is available to foreman and above. Technician mode is focused on job execution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          Variance &amp; Analytics
        </h1>
        <p style={{ opacity: 0.8 }}>
          Compare metrics from your database across hulls (optionally by department).
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div className="form-group">
            <label className="form-label">Primary Ship</label>
            <select
              className="form-control"
              value={ship1}
              onChange={(e) => setShip1(e.target.value)}
            >
              <option value="">Select a ship...</option>
              {ships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shipClass} {s.hullNumber}
                  {s.displayLabel ? ` · ${s.displayLabel}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Comparison Ship</label>
            <select
              className="form-control"
              value={ship2}
              onChange={(e) => setShip2(e.target.value)}
            >
              <option value="">Select a comparison ship...</option>
              {ships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shipClass} {s.hullNumber}
                  {s.displayLabel ? ` · ${s.displayLabel}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Filter Department</label>
            <select
              className="form-control"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">
                All departments (chart = average across shops)
              </option>
              {METRIC_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {ships.length === 0 ? (
        <p
          style={{
            opacity: 0.75,
            marginBottom: "1rem",
            fontSize: "0.95rem",
          }}
        >
          No ships in the database yet — run{" "}
          <code className="jobs-code">pnpm db:sync</code> (or seed) so hulls and metrics
          are stored in Postgres.
        </p>
      ) : null}

      <div className="glass-panel" style={{ padding: "2rem", height: "500px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p>Loading metrics…</p>
          </div>
        ) : finalData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={finalData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="category" stroke="rgba(255,255,255,0.5)" />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                tickFormatter={formatYAxis}
              />
              <Tooltip
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend />
              {keys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              display: "flex",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 1rem",
            }}
          >
            <p
              style={{
                opacity: 0.55,
                maxWidth: "28rem",
                lineHeight: 1.6,
              }}
            >
              {ship1 || ship2
                ? "No metric rows returned for this selection — confirm ships are seeded or adjust department filter."
                : "Select a primary ship to load metrics from the database."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
