import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function DatePlanner({ onBack, scheduledDates, onSchedule, datesData }) {
  const [selectedDateId, setSelectedDateId] = useState(scheduledDates.length > 0 ? scheduledDates[0].id : null);
  const [formData, setFormData] = useState({
    place: '',
    address: '',
    phone: '',
    website: '',
    notes: '',
    start_time: '',
    end_time: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedDate = scheduledDates.find(d => d.id === selectedDateId);
  const selectedDateIdea = selectedDate && selectedDate.date_idea_id 
    ? datesData.ideas.find(i => i.id === selectedDate.date_idea_id) 
    : null;

  useEffect(() => {
    if (selectedDate) {
      setFormData({
        place: selectedDate.place || '',
        address: selectedDate.address || '',
        phone: selectedDate.phone || '',
        website: selectedDate.website || '',
        notes: selectedDate.notes || '',
        start_time: selectedDate.start_time || '',
        end_time: selectedDate.end_time || ''
      });
    }
  }, [selectedDateId, selectedDate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!selectedDateId) return;
    try {
      await api.updateDatePlan(selectedDateId, formData);
      setShowSuccess(true);
    } catch(e) {
      console.error(e);
      setErrorMsg('Failed to save plan');
    }
  };

  if (showSuccess) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div className="card glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '300px' }}>
          <h3 style={{ color: 'var(--accent-emerald)', marginTop: 0 }}>Success</h3>
          <p style={{ color: 'var(--text-muted)' }}>Date Plan saved successfully!</p>
          <button className="btn" onClick={() => { setShowSuccess(false); onSchedule(); }} style={{ marginTop: '1rem', width: '100%' }}>OK</button>
        </div>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="flex flex-col gap-6" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={onBack} className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <p style={{ textAlign: 'center' }}>No dates scheduled. Go schedule one first!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onBack} className="btn btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, color: 'var(--text-muted)' }}>Date Planner</h2>
      </div>
      <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Select Scheduled Date:</label>
          <select 
            value={selectedDateId} 
            onChange={(e) => setSelectedDateId(e.target.value)}
            className="input"
            style={{ width: '100%' }}
          >
            {scheduledDates.map(d => (
              <option key={d.id} value={d.id}>{d.title} ({new Date(d.start_time).toLocaleString()})</option>
            ))}
          </select>
        </div>

        {selectedDateIdea && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {selectedDateIdea.hasImage && (
              <img src={selectedDateIdea.imageUrl} alt={selectedDateIdea.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
            )}
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>{selectedDateIdea.description}</p>
          </div>
        )}

        <h3 style={{ margin: '1rem 0 0 0', color: 'var(--accent-purple)' }}>{selectedDate.title}</h3>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Time</label>
            <input type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} className="input" style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>End Time</label>
            <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} className="input" style={{ width: '100%' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Place</label>
          <input type="text" name="place" value={formData.place} onChange={handleChange} className="input" style={{ width: '100%' }} placeholder="e.g. The Italian Restaurant" />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className="input" style={{ width: '100%' }} placeholder="123 Main St..." />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Phone</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input" style={{ width: '100%' }} placeholder="(555) 555-5555" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Website</label>
            <input type="text" name="website" value={formData.website} onChange={handleChange} className="input" style={{ width: '100%' }} placeholder="https://..." />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="input" style={{ width: '100%', minHeight: '100px' }} placeholder="Things to bring, reservation details, etc..."></textarea>
        </div>

        <button className="btn btn-primary" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={handleSavePlan}>
          <Save size={18} /> Save Plan
        </button>
      </div>
    </div>
  );
}


