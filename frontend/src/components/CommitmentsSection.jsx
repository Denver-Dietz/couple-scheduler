import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, X, Lock } from 'lucide-react';
import { api } from '../utils/api';

export default function CommitmentsSection({ commitments, currentUser, isDashboardOwner, refresh, showU1, showU2 }) {
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cStart, setCStart] = useState('');
  const [cEnd, setCEnd] = useState('');

  const handleAddCommitment = async () => {
    if (!cTitle.trim() || !cStart || !cEnd) return;
    try {
      await api.createCommitment({
        title: cTitle, start_time: cStart, end_time: cEnd,
        is_fixed: true, user_id: currentUser
      });
      setCTitle(''); setCStart(''); setCEnd('');
      setShowCommitForm(false);
      refresh();
    } catch (e) { console.error(e); }
  };

  const c_list = commitments.filter(x => (x.user_id === 'user1' && showU1) || (x.user_id === 'user2' && showU2));

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
        <h3 className="flex items-center gap-2" style={{ color: 'var(--accent-blue)', fontSize: '1rem' }}>
          <CalendarIcon size={18} /> Appointments
        </h3>
        {isDashboardOwner && (
          <button className="btn btn-outline" onClick={() => setShowCommitForm(!showCommitForm)}
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
            {showCommitForm ? <X size={14} /> : <Plus size={14} />}
          </button>
        )}
      </div>

      {showCommitForm && (
        <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <input className="input" placeholder="Title" value={cTitle}
              onChange={e => setCTitle(e.target.value)} style={{ fontSize: '0.85rem' }} />
          </div>
          <div className="flex gap-2" style={{ marginBottom: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <input type="datetime-local" className="input" value={cStart}
                onChange={e => setCStart(e.target.value)} style={{ fontSize: '0.85rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="datetime-local" className="input" value={cEnd}
                onChange={e => setCEnd(e.target.value)} style={{ fontSize: '0.85rem' }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAddCommitment}
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem', background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}>
            <Plus size={14} /> Add Appointment
          </button>
        </div>
      )}

      {c_list.length === 0 && !showCommitForm ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.75rem',
          border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
          No appointments yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {c_list.map(c => (
            <div key={c.id} className="card flex items-center justify-between"
              style={{ padding: '0.75rem', borderLeft: '3px solid var(--accent-blue)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(c.start_time).toLocaleString()}
                </div>
              </div>
              {c.user_id === currentUser || c.user_id === 'both' ? (
                <button onClick={() => { api.deleteCommitment(c.id); refresh(); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
              ) : (
                <Lock size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} title="Read-only" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
