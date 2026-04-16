"use client";

import { useEffect, useState } from 'react';

export default function DataEntry() {
  const [ships, setShips] = useState([]);
  const [shipClass, setShipClass] = useState('DDG');
  const [hullNumber, setHullNumber] = useState('');
  const [addingShip, setAddingShip] = useState(false);
  
  const [shipId, setShipId] = useState('');
  const [category, setCategory] = useState('Labor Hours');
  const [value, setValue] = useState('');
  
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
    setHullNumber('');
    setAddingShip(false);
  };

  const handleAddMetric = async (e) => {
    e.preventDefault();
    await fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify({ shipId, category, value })
    });
    setValue('');
    alert('Metric added successfully!');
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Data Entry</h1>
      
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Record New Metric</h2>
          <form onSubmit={handleAddMetric}>
            <div className="form-group">
              <label className="form-label">Target Ship</label>
              <select className="form-control" value={shipId} onChange={e => setShipId(e.target.value)} required>
                <option value="">Select a ship...</option>
                {ships.map(s => (
                  <option key={s.id} value={s.id}>{s.shipClass} {s.hullNumber}</option>
                ))}
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
                <option value="LPD">LPD</option>
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
  );
}
