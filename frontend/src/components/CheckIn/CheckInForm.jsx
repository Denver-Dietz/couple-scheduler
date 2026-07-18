import React, { useState } from 'react';
import { api } from '../../utils/api';

export default function CheckInForm({ activeUser, onComplete, partnerName }) {
  const [formData, setFormData] = useState({
    communication_score: 5,
    intimacy_score: 5,
    quality_time_score: 5,
    teamwork_score: 5,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'notes' ? value : parseInt(value, 10)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.submitCheckIn(activeUser, formData);
      onComplete();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (name, label) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{formData[name]} / 10</span>
      </label>
      <input 
        type="range" 
        name={name} 
        min="1" 
        max="10" 
        step="1"
        value={formData[name]} 
        onChange={handleChange} 
        style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
      />
    </div>
  );

  return (
    <div className="card glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--accent-purple)', textAlign: 'center' }}>Monthly Relationship Check-In</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
        Rate your satisfaction over the past month. Be honest, this is for you and {partnerName} to grow!
      </p>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {renderSlider('communication_score', 'Communication')}
        {renderSlider('intimacy_score', 'Intimacy & Affection')}
        {renderSlider('quality_time_score', 'Quality Time')}
        {renderSlider('teamwork_score', 'Teamwork & Support')}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Additional Thoughts (Optional)</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            className="input" 
            style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
            placeholder="Anything else you'd like to mention about this month?"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Check-In'}
        </button>
      </form>
    </div>
  );
}
