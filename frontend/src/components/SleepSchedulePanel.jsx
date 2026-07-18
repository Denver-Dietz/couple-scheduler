import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Moon, Plus, Trash2, X, User } from 'lucide-react';

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

/**
 * Sleep Schedule Configuration Panel.
 * 
 * Why:
 * - Collects sleep patterns (start/end times). This is crucial for the AI schedule engine
 *   to avoid proposing activities or goals at 3:00 AM, effectively blocking out rest periods
 *   in the global busy grid.
 */
export default function SleepSchedulePanel({ activeUser, dashboardActiveUser, showU1, showU2 }) {
  const currentUser = activeUser || 'user1';
  const isDashboardOwner = !dashboardActiveUser || dashboardActiveUser === activeUser;

  const [u1Name, setU1Name] = useState('User 1');
  const [u2Name, setU2Name] = useState('User 2');

  const [schedules, setSchedules] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('weekly');
  const [formDays, setFormDays] = useState('Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday');
  const [formDate, setFormDate] = useState('');
  const [formStart, setFormStart] = useState('23:00');
  const [formEnd, setFormEnd] = useState('07:00');

  const refresh = useCallback(async () => {
    try {
      const s = await api.getSettings();
      const find = (k, d) => s.find(setting => setting.key === k)?.value || d;
      setU1Name(find('user1_name', 'User 1'));
      setU2Name(find('user2_name', 'User 2'));
      
      const res = await api.getSleepSchedules();
      setSchedules(res);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('app-refresh', refresh);
    return () => window.removeEventListener('app-refresh', refresh);
  }, [refresh]);

  const handleAddSchedule = async () => {
    try {
      await api.createSleepSchedule({
        user_id: currentUser,
        schedule_type: formType,
        schedule_value: formType === 'weekly' ? formDays : formDate,
        start_time: formStart,
        end_time: formEnd
      });
      setShowForm(false);
      refresh();
    } catch (e) { console.error(e); }
  };

  const userSchedules = schedules.filter(s => (s.user_id === 'user1' && showU1) || (s.user_id === 'user2' && showU2));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2" style={{ color: 'var(--accent-purple)' }}>
          <Moon size={20} /> Sleep Schedule
        </h3>
      </div>
      
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Configure intended sleep schedules. If no sleep schedule is provided, the system may not schedule sleep time for you!
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {userSchedules.map(s => {
          const colorVar = s.user_id === 'user1' ? 'var(--accent-emerald)' : 'var(--accent-purple)';
          const colorRgb = s.user_id === 'user1' ? '16, 185, 129' : '139, 92, 246';
          return (
            <div key={s.id} style={{ 
              padding: '0.75rem', borderRadius: '8px', 
              background: `rgba(${colorRgb}, 0.05)`,
              border: `1px solid rgba(${colorRgb}, 0.2)`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {formatTimeAMPM(s.start_time)} - {formatTimeAMPM(s.end_time)} <span style={{ color: colorVar, marginLeft: '4px', fontSize: '0.75rem' }}>({s.user_id === 'user1' ? u1Name : u2Name})</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {s.schedule_type === 'weekly' ? `Weekly: ${s.schedule_value.split(',').join(', ')}` : `Specific Date: ${s.schedule_value}`}
                </div>
              </div>
              {s.user_id === currentUser && (
                <button onClick={() => { api.deleteSleepSchedule(s.id); refresh(); }} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                  <Trash2 size={16} color="#ef4444" />
                </button>
              )}
            </div>
          );
        })}
        {userSchedules.length === 0 && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
            No sleep schedules set.
          </div>
        )}
      </div>

      {isDashboardOwner && (
        showForm ? (
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
        ) : (
          <button className="btn btn-outline" style={{ width: '100%', padding: '0.5rem' }} onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Sleep Schedule for {currentUser === 'user1' ? u1Name : u2Name}
          </button>
        )
      )}

    </div>
  );
}

