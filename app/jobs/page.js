"use client";

import { useEffect, useState } from 'react';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Job Tickets</h1>
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading jobs...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Hull/Class</th>
                <th style={{ padding: '1rem' }}>Department</th>
                <th style={{ padding: '1rem' }}>Description</th>
                <th style={{ padding: '1rem' }}>Allocated (hrs)</th>
                <th style={{ padding: '1rem' }}>Actual (hrs)</th>
                <th style={{ padding: '1rem' }}>Material Cost</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>{job.ship?.shipClass} {job.ship?.hullNumber}</td>
                  <td style={{ padding: '1rem' }}>{job.department}</td>
                  <td style={{ padding: '1rem' }}>{job.jobDescription}</td>
                  <td style={{ padding: '1rem' }}>{job.allocatedHours}</td>
                  <td style={{ padding: '1rem', color: (job.actualHours || 0) > job.allocatedHours ? '#ef4444' : '#10b981' }}>{job.actualHours || '-'}</td>
                  <td style={{ padding: '1rem' }}>${job.materialCost?.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: job.status === 'COMPLETED' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                      color: job.status === 'COMPLETED' ? '#10b981' : '#3b82f6'
                    }}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No job entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
