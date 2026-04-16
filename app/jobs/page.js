"use client";

import { useEffect, useState } from 'react';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [shipFilter, setShipFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modal State
  const [selectedJob, setSelectedJob] = useState(null);

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

  const filteredJobs = jobs.filter(job => {
    const term = search.toLowerCase();
    const shipName = `${job.ship?.shipClass} ${job.ship?.hullNumber}`.toLowerCase();
    
    // Check search term
    const matchesSearch = !search || 
      job.jobDescription.toLowerCase().includes(term) || 
      shipName.includes(term) ||
      (job.notes && job.notes.toLowerCase().includes(term));
      
    const matchesShip = !shipFilter || `${job.ship?.shipClass} ${job.ship?.hullNumber}` === shipFilter;
    const matchesDept = !deptFilter || job.department === deptFilter;

    return matchesSearch && matchesShip && matchesDept;
  });

  const uniqueShips = Array.from(new Set(jobs.map(j => `${j.ship?.shipClass} ${j.ship?.hullNumber}`)));
  const uniqueDepts = Array.from(new Set(jobs.map(j => j.department)));

  return (
    <div className="page-container animate-fade-in">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Job Tickets</h1>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>Browse, filter, and review granular shipyard tickets.</p>
      
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px' }}>
          <input 
            type="text" 
            placeholder="Search descriptions or notes..." 
            className="form-control"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: '0 0 200px' }}>
          <select className="form-control" value={shipFilter} onChange={e => setShipFilter(e.target.value)}>
             <option value="">All Ships</option>
             {uniqueShips.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 0 200px' }}>
          <select className="form-control" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
             <option value="">All Departments</option>
             {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

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
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>{job.ship?.shipClass} {job.ship?.hullNumber}</td>
                  <td style={{ padding: '1rem' }}>{job.department}</td>
                  <td style={{ padding: '1rem' }}>{job.jobDescription}</td>
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
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => setSelectedJob(job)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>View Details</button>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No job entries found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', width: '100%', position: 'relative' }}>
             <button 
               onClick={() => setSelectedJob(null)}
               style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
             >✕</button>
             <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Job Details</h2>
             
             <div className="modal-grid" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                   <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Target Vessel</p>
                   <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedJob.ship?.shipClass} {selectedJob.ship?.hullNumber}</p>
                </div>
                <div>
                   <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Department</p>
                   <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>{selectedJob.department}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                   <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Description</p>
                   <p style={{ fontSize: '1.1rem' }}>{selectedJob.jobDescription}</p>
                </div>
                <div>
                   <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Allocated Hours</p>
                   <p style={{ fontSize: '1.2rem' }}>{selectedJob.allocatedHours}</p>
                </div>
                <div>
                   <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Actual Hours</p>
                   <p style={{ fontSize: '1.2rem', color: (selectedJob.actualHours || 0) > selectedJob.allocatedHours ? '#ef4444' : '#10b981' }}>{selectedJob.actualHours || 'Not Recorded'}</p>
                </div>
                <div>
                   <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Material Cost</p>
                   <p style={{ fontSize: '1.2rem' }}>{selectedJob.materialCost ? `$${selectedJob.materialCost.toLocaleString()}` : '-'}</p>
                </div>
                <div>
                   <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Status</p>
                   <p style={{ fontSize: '1.2rem', color: selectedJob.status === 'COMPLETED' ? '#10b981' : '#3b82f6' }}>{selectedJob.status}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                   <p style={{ opacity: 0.6, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Notes</p>
                   <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', minHeight: '60px' }}>
                     {selectedJob.notes || <span style={{ opacity: 0.4 }}>No specialized notes provided for this job.</span>}
                   </div>
                </div>
             </div>
             
             <button className="btn-primary" style={{ width: '100%' }} onClick={() => setSelectedJob(null)}>Close Viewer</button>
          </div>
        </div>
      )}
    </div>
  );
}
