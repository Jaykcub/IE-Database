"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MetricsPage() {
  const [ships, setShips] = useState([]);
  const [ship1, setShip1] = useState('');
  const [ship2, setShip2] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState('');

  useEffect(() => {
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
      if (ship1) params.append('shipId', ship1);
      if (ship2) params.append('shipId', ship2);
      if (department) params.append('department', department);
      
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

  const chartData = {};
  metrics.forEach(m => {
    if (!chartData[m.category]) {
      chartData[m.category] = { category: m.category };
    }
    const shipKey = `Ship ${m.ship.shipClass}-${m.ship.hullNumber}`;
    if (chartData[m.category][shipKey]) {
      chartData[m.category][shipKey] += m.value;
    } else {
      chartData[m.category][shipKey] = m.value;
    }
  });

  const finalData = Object.values(chartData);
  const keys = Array.from(new Set(metrics.map(m => `Ship ${m.ship.shipClass}-${m.ship.hullNumber}`)));
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  const formatTooltip = (value, name, props) => {
    const isDollar = props.payload.category.includes('Cost') || props.payload.category.includes('Spend');
    const roundedValue = Math.round(value);
    return [isDollar ? `$${roundedValue.toLocaleString()}` : roundedValue.toLocaleString(), name];
  };

  const formatYAxis = (val) => {
    return Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val);
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Variance & Analytics</h1>
        <p style={{ opacity: 0.8 }}>Compare metrics and visualize variances across hulls (optionally by department).</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Primary Ship</label>
            <select className="form-control" value={ship1} onChange={e => setShip1(e.target.value)}>
              <option value="">Select a ship...</option>
              {ships.map(s => <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Comparison Ship</label>
            <select className="form-control" value={ship2} onChange={e => setShip2(e.target.value)}>
              <option value="">Select a comparison ship...</option>
              {ships.map(s => <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Filter Department</label>
            <select className="form-control" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All Departments (Aggregated)</option>
              <option value="Electrical">Electrical</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Pipefitting">Pipefitting</option>
              <option value="Welding">Welding</option>
              <option value="Paint">Paint</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', height: '500px' }}>
        {loading ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><p>Loading metrics...</p></div>
        ) : finalData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="category" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={formatYAxis} />
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              {keys.map((key, index) => <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />)}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><p style={{ opacity: 0.5 }}>Select a ship to visualize its metrics.</p></div>
        )}
      </div>
    </div>
  );
}
