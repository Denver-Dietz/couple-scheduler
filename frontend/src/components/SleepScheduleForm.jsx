import React from 'react';
import { X, Plus } from 'lucide-react';

export default function SleepScheduleForm({
  currentUser, u1Name, u2Name,
  formType, setFormType,
  formDays, setFormDays,
  formDate, setFormDate,
  formStart, setFormStart,
  formEnd, setFormEnd,
  handleAddSchedule, setShowForm, showForm
}) {
  if (!showForm) {
    return (
      <button className="btn btn-outline" style={{ width: '100%', padding: '0.5rem' }} onClick={() => setShowForm(true)}>
        <Plus size={16} /> Add Sleep Schedule for {currentUser === 'user1' ? u1Name : u2Name}
      </button>
    );
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
      <div className="flex justify-between items-center mb-4">
        <h4 style={{ fontSize: '0.9rem', margin: 0 }}>Add Sleep Schedule for {currentUser === 'user1' ? u1Name : u2Name}</h4>
        <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16}/></button>
      </div>

      <div className="flex gap-4 mb-4">
        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="radio" checked={formType === 'weekly'} onChange={() => setFormType('weekly')} /> Weekly Recurring
        </label>
        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="radio" checked={formType === 'specific_date'} onChange={() => setFormType('specific_date')} /> Specific Date
        </label>
      </div>

      <div className="mb-4">
        {formType === 'weekly' ? (
          <div>
            <label className="label" style={{ fontSize: '0.75rem' }}>Days of Week (comma separated)</label>
            <input type="text" className="input" value={formDays} onChange={e => setFormDays(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
          </div>
        ) : (
          <div>
            <label className="label" style={{ fontSize: '0.75rem' }}>Date</label>
            <input type="date" className="input" value={formDate} onChange={e => setFormDate(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <div style={{ flex: 1 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>Start Time</label>
          <input type="time" className="input" value={formStart} onChange={e => setFormStart(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label" style={{ fontSize: '0.75rem' }}>End Time</label>
          <input type="time" className="input" value={formEnd} onChange={e => setFormEnd(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }} onClick={handleAddSchedule}>
        Save Sleep Schedule
      </button>
    </div>
  );
}