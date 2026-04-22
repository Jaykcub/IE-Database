"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [ships, setShips] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch("/api/ships", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setShips(data);
      })
      .catch(console.error);

    fetch("/api/jobs", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(console.error);
  }, []);

  const totalAllocated = jobs.reduce((sum, j) => sum + j.allocatedHours, 0);
  const totalActual = jobs.reduce((sum, j) => sum + (j.actualHours || 0), 0);

  return (
    <div className="page-container animate-fade-in">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Hullboard</h1>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>High-level overview of tracking & variance.</p>
      
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '0.5rem' }}>Active Vessels</h2>
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#3b82f6' }}>{ships.length}</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '0.5rem' }}>Total Job Tickets</h2>
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#8b5cf6' }}>{jobs.length}</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '0.5rem' }}>Net Allocated Hours</h2>
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#10b981' }}>{totalAllocated.toLocaleString()}</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '0.5rem' }}>Net Expended Hours</h2>
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#ef4444' }}>{totalActual.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <Link href="/metrics" className="btn-primary">View Detailed Metrics</Link>
        <Link href="/jobs" className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)' }}>Browse Job Entries</Link>
      </div>
    </div>
  );
}
