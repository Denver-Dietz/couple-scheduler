import React, { useState } from 'react';
import { Target, Plus, Trash2, X, Lock } from 'lucide-react';
import { api } from '../utils/api';

export default function GoalsSection({ goals, currentUser, isDashboardOwner, refresh, showU1, showU2 }) {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDuration, setGoalDuration] = useState(45);
  const [goalFrequency, setGoalFrequency] = useState(3);

  const handleAddGoal = async () => {
    if (!goalTitle.trim()) return;
    try {
      await api.createGoal({
        title: goalTitle, duration_minutes: goalDuration,
        target_per_week: goalFrequency, preferred_time_of_day: 'any',
        user_id: currentUser
      });
      setGoalTitle(''); setGoalDuration(45); setGoalFrequency(3);
      setShowGoalForm(false);
      refresh();
    } catch (e) { console.error(e); }
  };

  const g_list = goals.filter(x => (x.user_id === 'user1' && showU1) || (x.user_id === 'user2' && showU2));

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
        <h3 className="flex items-center gap-2" style={{ color: 'var(--accent-emerald)', fontSize: '1rem' }}>
          <Target size={18} /> Goals
        </h3>
        {isDashboardOwner && (
          <button className="btn btn-outline" onClick={() => setShowGoalForm(!showGoalForm)}
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
            {showGoalForm ? <X size={14} /> : <Plus size={14} />}
          </button>
        )}
      </div>

      {showGoalForm && (
        <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <input className="input" placeholder="Goal title" value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)} style={{ fontSize: '0.85rem' }} />
          </div>
          <div className="flex gap-2" style={{ marginBottom: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label className="label" style={{ fontSize: '0.75rem' }}>Minutes</label>
              <input type="number" className="input" value={goalDuration}
                onChange={e => setGoalDuration(parseInt(e.target.value) || 0)} style={{ fontSize: '0.85rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" style={{ fontSize: '0.75rem' }}>Per week</label>
              <input type="number" className="input" value={goalFrequency}
                onChange={e => setGoalFrequency(parseInt(e.target.value) || 0)} style={{ fontSize: '0.85rem' }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAddGoal}
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem', background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}>
            <Plus size={14} /> Add Goal
          </button>
        </div>
      )}

      {g_list.length === 0 && !showGoalForm ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.75rem',
          border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
          No goals yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {g_list.map(g => (
            <div key={g.id} className="card flex items-center justify-between"
              style={{ padding: '0.75rem', borderLeft: '3px solid var(--accent-emerald)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {g.target_per_week}x/week • {g.duration_minutes} min
                </div>
              </div>
              {g.user_id === currentUser || g.user_id === 'both' ? (
                <button onClick={() => { api.deleteGoal(g.id); refresh(); }}
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
