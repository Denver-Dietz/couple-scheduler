import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { format, addDays, startOfWeek } from 'date-fns';
import { Briefcase, Plus, Trash2, X, User } from 'lucide-react';

const formatTimeAMPM = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr === 'off') return 'Off';
  const [hourStr, minStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const min = minStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${min} ${ampm}`;
};

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    options.push({ value: `${hh}:00`, label: formatTimeAMPM(`${hh}:00`) });
    options.push({ value: `${hh}:30`, label: formatTimeAMPM(`${hh}:30`) });
  }
  return options;
};

/**
 * Work Schedule Configuration Panel.
 * 
 * Why:
 * - Collects fixed working hours for the upcoming week. This data is critical for the AI scheduler
 *   so it knows exactly when the user is unavailable, preventing goals/projects from being scheduled
 *   during the workday.
 */
export default function WorkSchedulePanel({ activeUser, dashboardActiveUser, showU1, showU2 }) {
  const currentUser = activeUser || 'user1';
  const isDashboardOwner = !dashboardActiveUser || dashboardActiveUser === activeUser;

  const [u1Name, setU1Name] = useState('User 1');
  const [u2Name, setU2Name] = useState('User 2');

  const [shifts, setShifts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [draftShifts, setDraftShifts] = useState({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await api.getSettings();
      const find = (k, d) => s.find(setting => setting.key === k)?.value || d;
      setU1Name(find('user1_name', 'User 1'));
      setU2Name(find('user2_name', 'User 2'));
      
      const res = await api.getWorkShifts();
      setShifts(res);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('app-refresh', refresh);
    return () => window.removeEventListener('app-refresh', refresh);
  }, [refresh]);

  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const weekDates = Array.from({length: 7}).map((_, i) => format(addDays(start, i), 'yyyy-MM-dd'));

  const handleInitForm = () => {
    const userShifts = shifts.filter(s => s.user_id === currentUser);
    const initialDrafts = {};
    weekDates.forEach(date => {
      const shift = userShifts.find(s => s.date === date);
      if (shift) {
        initialDrafts[date] = {
          start_time: shift.start_time === 'off' ? '09:00' : shift.start_time,
          end_time: shift.end_time === 'off' ? '17:00' : shift.end_time,
          is_off: shift.start_time === 'off'
        };
      } else {
        initialDrafts[date] = {
          start_time: '09:00',
          end_time: '17:00',
          is_off: false
        };
      }
    });
    setDraftShifts(initialDrafts);
    setShowForm(true);
  };

  const updateDraft = (date, key, value) => {
    setDraftShifts(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [key]: value
      }
    }));
  };

  const handleSaveDrafts = async () => {
    try {
      setLoading(true);
      const userShifts = shifts.filter(s => s.user_id === currentUser);
      for (const date of weekDates) {
        const draft = draftShifts[date];
        const original = userShifts.find(s => s.date === date);
        
        const isDefault = !draft.is_off && draft.start_time === '09:00' && draft.end_time === '17:00';
        const hasChanged = !original || 
          (original.start_time === 'off' !== draft.is_off) ||
          (original.start_time !== 'off' && (original.start_time !== draft.start_time || original.end_time !== draft.end_time));
          
        if (hasChanged) {
          if (original) {
            await api.deleteWorkShift(original.id);
          }
          if (draft.is_off || !isDefault) {
            await api.createWorkShift({
              user_id: currentUser,
              date: date,
              start_time: draft.is_off ? 'off' : draft.start_time,
              end_time: draft.is_off ? 'off' : draft.end_time,
              label: draft.is_off ? 'Day Off' : 'Shift'
            });
          }
        }
      }
      setShowForm(false);
      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2"><Briefcase size={20} /> Work Schedule</h3>
      </div>
      
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Add specific shifts here. Days without specific shifts will use the default work hours from Settings.
      </p>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
        {weekDates.map(date => {
          const dayShifts = shifts.filter(s => s.date === date && ((s.user_id === 'user1' && showU1) || (s.user_id === 'user2' && showU2)));
          
          return (
            <div key={date} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', minHeight: '100px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                {format(new Date(date + 'T00:00:00'), 'EEE')} <br/>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{format(new Date(date + 'T00:00:00'), 'MMM d')}</span>
              </div>
              
              {showForm ? (
                <div className="flex flex-col gap-2" style={{ flex: 1, justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', justifyContent: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={draftShifts[date]?.is_off || false} 
                      onChange={e => updateDraft(date, 'is_off', e.target.checked)} 
                    />
                    Off
                  </label>
                  {!draftShifts[date]?.is_off && (
                    <div className="flex flex-col gap-1">
                      <select 
                        value={draftShifts[date]?.start_time || '09:00'} 
                        onChange={e => updateDraft(date, 'start_time', e.target.value)} 
                        style={{ width: '100%', fontSize: '0.75rem', padding: '2px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px', textAlign: 'center', cursor: 'pointer' }}
                      >
                        {generateTimeOptions().map(opt => (
                          <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <select 
                        value={draftShifts[date]?.end_time || '17:00'} 
                        onChange={e => updateDraft(date, 'end_time', e.target.value)} 
                        style={{ width: '100%', fontSize: '0.75rem', padding: '2px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '4px', textAlign: 'center', cursor: 'pointer' }}
                      >
                        {generateTimeOptions().map(opt => (
                          <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                  {dayShifts.map(s => {
                    const colorVar = s.user_id === 'user1' ? 'var(--accent-emerald)' : 'var(--accent-purple)';
                    const colorRgb = s.user_id === 'user1' ? '16, 185, 129' : '139, 92, 246';
                    return (
                      <div key={s.id} style={{ 
                        fontSize: '0.7rem', padding: '0.25rem', borderRadius: '4px', 
                        background: s.start_time === 'off' ? 'rgba(239, 68, 68, 0.1)' : `rgba(${colorRgb}, 0.1)`,
                        border: `1px solid ${s.start_time === 'off' ? 'rgba(239, 68, 68, 0.3)' : `rgba(${colorRgb}, 0.3)`}`,
                        color: s.start_time === 'off' ? '#ef4444' : colorVar,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{flex: 1, textAlign: 'center'}}>
                          {s.start_time === 'off' ? 'Off' : `${formatTimeAMPM(s.start_time)} - ${formatTimeAMPM(s.end_time)}`}
                        </span>
                        {s.user_id === currentUser && (
                          <button onClick={async () => { await api.deleteWorkShift(s.id); refresh(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}>
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {dayShifts.length === 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>Default</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isDashboardOwner && (
        showForm ? (
          <div className="flex gap-2" style={{ marginTop: '1rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setShowForm(false)} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={handleSaveDrafts} disabled={loading}>
              {loading ? 'Saving...' : `Save Shifts for ${currentUser === 'user1' ? u1Name : u2Name}`}
            </button>
          </div>
        ) : (
          <button className="btn btn-outline" style={{ width: '100%', padding: '0.5rem' }} onClick={handleInitForm}>
            <Plus size={16} /> Edit Shifts for {currentUser === 'user1' ? u1Name : u2Name}
          </button>
        )
      )}

    </div>
  );
}

