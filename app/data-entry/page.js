"use client";

import { useEffect, useState } from 'react';

export default function DataEntry() {
  const [ships, setShips] = useState([]);
  
  // Ship State
  const [shipClass, setShipClass] = useState('DDG');
  const [hullNumber, setHullNumber] = useState('');
  const [addingShip, setAddingShip] = useState(false);
  
  // Metric State
  const [shipId, setShipId] = useState('');
  const [metricDept, setMetricDept] = useState('Engineering');
  const [category, setCategory] = useState('Labor Hours');
  const [value, setValue] = useState('');

  // Job State
  const [jobShipId, setJobShipId] = useState('');
  const [jobDept, setJobDept] = useState('Electrical');
  const [jobDesc, setJobDesc] = useState('');
  const [jobAlloc, setJobAlloc] = useState('');
  const [jobActual, setJobActual] = useState('');
  const [jobCost, setJobCost] = useState('');
  const [jobNotes, setJobNotes] = useState('');
  
  useEffect(() => {
    fetch('/api/ships')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setShips(data);
        else console.error('Failed to load ships:', data);
      })
      .catch(console.error);
  }, []);

  const handleAddShip = async (e) => {
    e.preventDefault();
    setAddingShip(true);
    const res = await fetch('/api/ships', {
      method: 'POST',
      body: JSON.stringify({ shipClass, hullNumber })
    });
    const newShip = await res.json();
    setShips([...ships, newShip]);
    setShipId(newShip.id);
    setJobShipId(newShip.id);
    setHullNumber('');
    setAddingShip(false);
  };

  const handleAddMetric = async (e) => {
    e.preventDefault();
    await fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify({ shipId, department: metricDept, category, value })
    });
    setValue('');
    alert('Metric added successfully!');
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    await fetch('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ 
        shipId: jobShipId, 
        department: jobDept, 
        jobDescription: jobDesc, 
        allocatedHours: jobAlloc,
        actualHours: jobActual,
        materialCost: jobCost,
        notes: jobNotes
      })
    });
    setJobDesc('');
    setJobAlloc('');
    setJobActual('');
    setJobCost('');
    setJobNotes('');
    alert('Job Ticket logged successfully!');
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Data Management</h1>
      
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Create Job Ticket</h2>
          <form onSubmit={handleAddJob}>
            <div className="form-group">
              <label className="form-label">Target Ship</label>
              <select className="form-control" value={jobShipId} onChange={e => setJobShipId(e.target.value)} required>
                <option value="">Select a ship...</option>
                {ships.map(s => <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" value={jobDept} onChange={e => setJobDept(e.target.value)} required>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Pipefitting">Pipefitting</option>
                <option value="Welding">Welding</option>
                <option value="Paint">Paint</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Job Description</label>
              <input type="text" className="form-control" value={jobDesc} onChange={e => setJobDesc(e.target.value)} required placeholder="e.g. Aft bulk head welding" />
            </div>
            <div className="form-group">
              <label className="form-label">Allocated Hours</label>
              <input type="number" step="0.1" className="form-control" value={jobAlloc} onChange={e => setJobAlloc(e.target.value)} required placeholder="Target hours..." />
            </div>
            <div className="form-group">
              <label className="form-label">Actual Hours (Optional)</label>
              <input type="number" step="0.1" className="form-control" value={jobActual} onChange={e => setJobActual(e.target.value)} placeholder="Actual hours spent..." />
            </div>
            <div className="form-group">
              <label className="form-label">Material Cost (Optional)</label>
              <input type="number" step="0.01" className="form-control" value={jobCost} onChange={e => setJobCost(e.target.value)} placeholder="Material spend..." />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea className="form-control" value={jobNotes} onChange={e => setJobNotes(e.target.value)} placeholder="Attach any department notes or observations here..." rows="3" style={{ resize: 'vertical' }}></textarea>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={!jobShipId || !jobDesc || !jobAlloc}>
              Submit Job Ticket
            </button>
          </form>
        </div>

        <div>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Record Specific Metric</h2>
            <form onSubmit={handleAddMetric}>
              <div className="form-group">
                <label className="form-label">Target Ship</label>
                <select className="form-control" value={shipId} onChange={e => setShipId(e.target.value)} required>
                  <option value="">Select a ship...</option>
                  {ships.map(s => <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={metricDept} onChange={e => setMetricDept(e.target.value)} required>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Pipefitting">Pipefitting</option>
                  <option value="Welding">Welding</option>
                  <option value="Paint">Paint</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Metric Category</label>
                <select className="form-control" value={category} onChange={e => setCategory(e.target.value)} required>
                  <option value="Labor Hours">Labor Hours</option>
                  <option value="Cost Variance">Cost Variance</option>
                  <option value="Schedule Variance">Schedule Variance</option>
                  <option value="Defect Rate">Defect Rate</option>
                  <option value="Material Spend">Material Spend</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Metric Value</label>
                <input type="number" step="0.01" className="form-control" value={value} onChange={e => setValue(e.target.value)} required placeholder="Enter numeric value..." />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={!shipId || !value}>
                Submit Metric
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Register New Ship</h2>
            <form onSubmit={handleAddShip}>
              <div className="form-group">
                <label className="form-label">Ship Class</label>
                <select className="form-control" value={shipClass} onChange={e => setShipClass(e.target.value)} required>
                  <option value="DDG">DDG</option>
                  <option value="DDGX">DDGX</option>
                  <option value="LPD">LPD</option>
                  <option value="LHA">LHA</option>
                  <option value="CVN">CVN</option>
                  <option value="SSN">SSN</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hull Number</label>
                <input type="number" className="form-control" value={hullNumber} onChange={e => setHullNumber(e.target.value)} required placeholder="e.g. 128" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={addingShip || !hullNumber}>
                {addingShip ? 'Registering...' : 'Register Ship'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
