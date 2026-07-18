import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { X } from 'lucide-react';

export default function ScheduleDateModal({ idea, onClose, onSchedule }) {
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormData({ start_time: start, end_time: end });
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createCommitment({
        title: `Date: ${idea.title}`,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_fixed: true,
        user_id: 'both',
        is_date: true,
        date_idea_id: idea.id
      });
      
      setShowSuccess(true);
    } catch(err) {
      console.error(err);
      setErrorMsg('Failed to schedule date');
    }
  };

  if (showSuccess) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div className="card glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '300px' }}>
          <h3 style={{ color: 'var(--accent-emerald)', marginTop: 0 }}>Success</h3>
          <p style={{ color: 'var(--text-muted)' }}>Tentative date scheduled! Check Date Planner to add details.</p>
          <button className="btn" onClick={() => onSchedule()} style={{ marginTop: '1rem', width: '100%' }}>OK</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card glass-panel" style={{ width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', textAlign: 'left', position: 'relative' }}>
        <button onClick={onClose} className="btn btn-ghost" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem' }}>
          <X size={20} />
        </button>
        <h3 style={{ marginTop: 0, color: 'var(--accent-emerald)' }}>Schedule: {idea.title}</h3>
        
        {errorMsg && <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--accent-red)' }}>{errorMsg}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Time</label>
            <input type="datetime-local" required name="start_time" value={formData.start_time} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-muted)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>End Time</label>
            <input type="datetime-local" required name="end_time" value={formData.end_time} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-muted)' }} />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Add to Calendar
          </button>
        </form>
      </div>
    </div>
  );
}

