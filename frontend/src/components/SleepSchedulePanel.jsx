import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Moon } from 'lucide-react';
import SleepScheduleList from './SleepScheduleList';
import SleepScheduleForm from './SleepScheduleForm';

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

      <SleepScheduleList
        userSchedules={userSchedules}
        currentUser={currentUser}
        u1Name={u1Name}
        u2Name={u2Name}
        refresh={refresh}
      />

      {isDashboardOwner && (
        <SleepScheduleForm
          currentUser={currentUser}
          u1Name={u1Name}
          u2Name={u2Name}
          formType={formType}
          setFormType={setFormType}
          formDays={formDays}
          setFormDays={setFormDays}
          formDate={formDate}
          setFormDate={setFormDate}
          formStart={formStart}
          setFormStart={setFormStart}
          formEnd={formEnd}
          setFormEnd={setFormEnd}
          handleAddSchedule={handleAddSchedule}
          setShowForm={setShowForm}
          showForm={showForm}
        />
      )}

    </div>
  );
}
