"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [ships, setShips] = useState([]);
  const [ship1, setShip1] = useState('');
  const [ship2, setShip2] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/ships')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setShips(data);
        } else {
          console.error('Failed to load ships:', data);
          setShips([]);
        }
      })
      .catch(err => {
        console.error('Network or parsing error:', err);
        setShips([]);
      });
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
      
      const res = await fetch(`/api/metrics?${params.toString()}`);
      const data = await res.json();
      setMetrics(data);
      setLoading(false);
    }
    loadMetrics();
  }, [ship1, ship2]);

  // Process metrics data for recharts
  const chartData = {};
  metrics.forEach(m => {
    if (!chartData[m.category]) {
      chartData[m.category] = { category: m.category };
    }
    const shipKey = `Ship ${m.ship.shipClass}-${m.ship.hullNumber}`;
    chartData[m.category][shipKey] = m.value;
  });

  const finalData = Object.values(chartData);

  // Extract unique ship keys for the bars
  const keys = Array.from(new Set(metrics.map(m => `Ship ${m.ship.shipClass}-${m.ship.hullNumber}`)));
  const colors = ['#3b82f6', '#8b5cf6'];

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>IE Performance Overview</h1>
          <p style={{ opacity: 0.8 }}>Compare Industrial Engineering metrics across hull numbers.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Primary Ship (Baseline)</label>
            <select className="form-control" value={ship1} onChange={e => setShip1(e.target.value)}>
              <option value="">Select a ship...</option>
              {ships.map(s => (
                <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Comparison Ship</label>
            <select className="form-control" value={ship2} onChange={e => setShip2(e.target.value)}>
              <option value="">Select a comparison ship...</option>
              {ships.map(s => (
                <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', height: '500px' }}>
        {loading ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <p>Loading metrics...</p>
          </div>
        ) : finalData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="category" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              {keys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ opacity: 0.5 }}>Select a ship to view its metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
