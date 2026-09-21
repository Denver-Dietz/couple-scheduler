import React from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../utils/api';

export const formatTimeAMPM = (timeStr) => {
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

export default function SleepScheduleList({ userSchedules, currentUser, u1Name, u2Name, refresh }) {
  return (
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
  );
}