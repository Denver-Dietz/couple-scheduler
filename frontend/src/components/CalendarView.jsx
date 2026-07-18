import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { format, addDays, startOfWeek } from 'date-fns';
import { Loader2, RefreshCw, User, Lock, Sparkles, Send, Pencil } from 'lucide-react';

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
 * Main unified calendar rendering engine.
 * 
 * Why:
 * - Complex UI state machine. Manages not just display, but an interactive "Schedule Wizard"
 *   that guides users step-by-step through injecting flexible Goals and Projects into 
 *   their busy grid. Uses SSE event listeners to refresh automatically when the backend changes.
 */
export default function CalendarView({ activeUser, dashboardActiveUser, showU1, showU2 }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [u1Name, setU1Name] = useState('User 1');
  const [u2Name, setU2Name] = useState('User 2');

  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    if (selectedSlot && selectedSlot.type === 'commitment') {
      setEditData({
        title: selectedSlot.title,
        start_datetime: `${selectedDate}T${selectedSlot.start_time}`,
        end_datetime: `${selectedDate}T${selectedSlot.end_time}`,
        user_id: selectedSlot.user_id || 'both',
        is_fixed: selectedSlot.is_fixed !== undefined ? selectedSlot.is_fixed : true
      });
    } else {
      setEditData(null);
    }
  }, [selectedSlot, selectedDate]);

  const [wizardStep, setWizardStep] = useState('idle'); // 'idle' | 'goals' | 'projects' | 'done'
  const [wizardUser, setWizardUser] = useState('user1');
  const [wizardData, setWizardData] = useState(null);
  const [wizardDraftSlots, setWizardDraftSlots] = useState([]);
  const [wizardCurrentIdx, setWizardCurrentIdx] = useState(0);
  const [wizardOptions, setWizardOptions] = useState([]);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [goalRampDays, setGoalRampDays] = useState(3);
  const [projectHours, setProjectHours] = useState(2);
  const [showRampInput, setShowRampInput] = useState(true);
  const [showProjectHoursInput, setShowProjectHoursInput] = useState(true);
  const [wizardSelectedSlots, setWizardSelectedSlots] = useState([]);

  const loadSchedule = React.useCallback(async () => {
    try {
      const data = await api.getLatestSchedule();
      setSchedule(data);
      
      const s = await api.getSettings();
      const find = (k, d) => s.find(setting => setting.key === k)?.value || d;
      setU1Name(find('user1_name', 'User 1'));
      setU2Name(find('user2_name', 'User 2'));
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
    window.addEventListener('app-refresh', loadSchedule);
    return () => window.removeEventListener('app-refresh', loadSchedule);
  }, [loadSchedule]);

  const startWizard = async (userId) => {
    try {
      setWizardLoading(true);
      setWizardUser(userId);
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      const data = await api.getWizardData(userId, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
      setWizardData(data);
      setWizardDraftSlots(data.base_slots);
      
      if (data.goals && data.goals.length > 0) {
        setWizardStep('goals');
        setWizardCurrentIdx(0);
        setWizardOptions([]);
        setWizardSelectedSlots([]);
        setGoalRampDays(data.goals[0].effective_target || data.goals[0].target_per_week);
        setShowRampInput(true);
      } else if (data.projects && data.projects.length > 0) {
        setWizardStep('projects');
        setWizardCurrentIdx(0);
        setWizardOptions([]);
        setWizardSelectedSlots([]);
        setProjectHours(2);
        setShowProjectHoursInput(true);
      } else {
        setWizardStep('done');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start wizard: " + err.message);
    } finally {
      setWizardLoading(false);
    }
  };

  const getGoalSuggestions = async () => {
    try {
      setWizardLoading(true);
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      const goal = wizardData.goals[wizardCurrentIdx];
      const res = await api.suggestGoal({
        user_id: wizardUser,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
        duration_minutes: goal.duration_minutes,
        target_days: parseInt(goalRampDays),
        preferred_time: goal.preferred_time_of_day,
        draft_slots: wizardDraftSlots
      });
      setWizardOptions(res.options);
      setShowRampInput(false);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch suggestions");
    } finally {
      setWizardLoading(false);
    }
  };

  const selectGoalOption = () => {
    const goal = wizardData.goals[wizardCurrentIdx];
    const newSlots = wizardSelectedSlots.map(slot => ({
      ...slot,
      title: goal.title,
      type: 'goal',
      user_id: wizardUser,
      item_id: goal.id
    }));
    setWizardDraftSlots([...wizardDraftSlots, ...newSlots]);
    nextGoal();
  };
  
  const toggleSlotSelection = (slot) => {
    if (wizardSelectedSlots.includes(slot)) {
      setWizardSelectedSlots(wizardSelectedSlots.filter(s => s !== slot));
    } else {
      setWizardSelectedSlots([...wizardSelectedSlots, slot]);
    }
  };

  const nextGoal = () => {
    const nextIdx = wizardCurrentIdx + 1;
    if (nextIdx < wizardData.goals.length) {
      setWizardCurrentIdx(nextIdx);
      setWizardOptions([]);
      setWizardSelectedSlots([]);
      setGoalRampDays(wizardData.goals[nextIdx].effective_target || wizardData.goals[nextIdx].target_per_week);
      setShowRampInput(true);
    } else {
      if (wizardData.projects && wizardData.projects.length > 0) {
        setWizardStep('projects');
        setWizardCurrentIdx(0);
        setWizardOptions([]);
        setWizardSelectedSlots([]);
        setProjectHours(2);
        setShowProjectHoursInput(true);
      } else {
        setWizardStep('done');
      }
    }
  };

  const getProjectSuggestions = async () => {
    try {
      setWizardLoading(true);
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      const res = await api.suggestProject({
        user_id: wizardUser,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
        hours_needed: parseFloat(projectHours),
        draft_slots: wizardDraftSlots
      });
      setWizardOptions(res.options);
      setShowProjectHoursInput(false);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch project suggestions");
    } finally {
      setWizardLoading(false);
    }
  };

  const selectProjectOption = () => {
    const project = wizardData.projects[wizardCurrentIdx];
    const newSlots = wizardSelectedSlots.map(slot => ({
      ...slot,
      title: project.title,
      type: 'project',
      user_id: wizardUser,
      item_id: project.id
    }));
    setWizardDraftSlots([...wizardDraftSlots, ...newSlots]);
    nextProject();
  };

  const nextProject = () => {
    const nextIdx = wizardCurrentIdx + 1;
    if (nextIdx < wizardData.projects.length) {
      setWizardCurrentIdx(nextIdx);
      setWizardOptions([]);
      setWizardSelectedSlots([]);
      setProjectHours(2);
      setShowProjectHoursInput(true);
    } else {
      setWizardStep('done');
    }
  };

  const submitWizardSchedule = async () => {
    try {
      setWizardLoading(true);
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      await api.submitSchedule({
        user_id: wizardUser,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
        slots: wizardDraftSlots
      });
      setWizardStep('idle');
      loadSchedule();
    } catch (err) {
      console.error(err);
      alert("Failed to submit schedule");
    } finally {
      setWizardLoading(false);
    }
  };

  const handlePush = async () => {
    if (!selectedSlot || !selectedSlot.item_id) return;
    try {
      setLoading(true);
      const start = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
      await api.skipItem({
        item_id: selectedSlot.item_id,
        item_type: selectedSlot.type,
        skip_week_start: format(start, 'yyyy-MM-dd')
      });
      setSelectedSlot(null);
      loadSchedule();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedSlot || !selectedSlot.item_id) return;
    try {
      setLoading(true);
      await api.deleteCommitment(selectedSlot.item_id);
      setSelectedSlot(null);
      loadSchedule();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedSlot || !selectedSlot.item_id || !editData) return;
    try {
      setLoading(true);
      
      // Convert HTML datetime-local inputs back to API format (replace T, add seconds)
      const start_time = editData.start_datetime.replace('T', ' ') + ':00';
      const end_time = editData.end_datetime.replace('T', ' ') + ':00';
      
      await api.rescheduleCommitment(selectedSlot.item_id, {
        title: editData.title,
        start_time,
        end_time,
        user_id: editData.user_id,
        is_fixed: editData.is_fixed
      });
      
      setSelectedSlot(null);
      setEditData(null);
      loadSchedule();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex-col items-center" style={{ display: 'flex', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
        <Loader2 size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-blue)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading schedule data...</p>
      </div>
    );
  }

  const days = schedule?.days || {};
  const sortedDates = Object.keys(days).sort();

  const u1Submitted = schedule?.user1_submitted;
  const u2Submitted = schedule?.user2_submitted;
  const isLocked = (showU1 && !u1Submitted) || (showU2 && !u2Submitted);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div className="flex gap-4 items-center">
          <h2>Weekly Schedule</h2>
        </div>  
      </div>

      {/* Schedule Wizard Status Bar */}
      <div className="card glass-panel flex justify-between items-center" style={{ borderLeft: '4px solid var(--accent-blue)', padding: '1rem 1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Weekly Schedule Builder</h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {u1Submitted ? `✓ ${u1Name} submitted` : `⏳ Waiting for ${u1Name}`} | {u2Submitted ? `✓ ${u2Name} submitted` : `⏳ Waiting for ${u2Name}`}
          </p>
        </div>
        <div className="flex gap-2">
          {(!u1Submitted && showU1) && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1rem', opacity: activeUser !== 'user1' ? 0.5 : 1, cursor: activeUser !== 'user1' ? 'not-allowed' : 'pointer' }} 
              onClick={() => startWizard('user1')}
              disabled={activeUser !== 'user1'}
              title={activeUser !== 'user1' ? `Only ${u1Name} can build their schedule.` : ""}
            >
              Build {u1Name}'s Schedule
            </button>
          )}
          {(!u2Submitted && showU2) && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1rem', opacity: activeUser !== 'user2' ? 0.5 : 1, cursor: activeUser !== 'user2' ? 'not-allowed' : 'pointer' }} 
              onClick={() => startWizard('user2')}
              disabled={activeUser !== 'user2'}
              title={activeUser !== 'user2' ? `Only ${u2Name} can build their schedule.` : ""}
            >
              Build {u2Name}'s Schedule
            </button>
          )}
        </div>
      </div>

      {isLocked ? (
        <div className="card flex-col items-center justify-center gap-4" style={{ padding: '4rem 2rem', textAlign: 'center', borderStyle: 'dashed' }}>
          <Lock size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          <h3 style={{ margin: 0 }}>Schedule Pending</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            {(!u1Submitted && showU1 && !u2Submitted && showU2) ? 'Neither user has submitted their schedule for this week.' :
             (!u1Submitted && showU1) ? `${u1Name} has not submitted their schedule for this week yet.` : 
             (!u2Submitted && showU2) ? `${u2Name} has not submitted their schedule for this week yet.` : ''}
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Status: {u1Submitted ? `✓ ${u1Name} (Submitted)` : `⏳ ${u1Name} (Pending)`} | {u2Submitted ? `✓ ${u2Name} (Submitted)` : `⏳ ${u2Name} (Pending)`}
            </p>
          </div>
        </div>
      ) : schedule && (
        <div className="grid grid-cols-7 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {sortedDates.map(date => {
            const filteredSlots = days[date].filter(slot => {
              const uid = slot.user_id || 'both';
              if (uid === 'both') return true;
              return (uid === 'user1' && showU1) || (uid === 'user2' && showU2);
            });

            return (
              <div key={date} className="card flex-col gap-2" style={{ padding: '1rem', display: 'flex' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem' }}>{format(new Date(date + 'T00:00:00'), 'EEEE')}</h4>
                  <small style={{ color: 'var(--text-muted)' }}>{format(new Date(date + 'T00:00:00'), 'MMM d')}</small>
                </div>
                
                <div className="flex flex-col gap-2">
                  {filteredSlots.map((slot, idx) => {
                    let typeClass = 'event-commitment';
                    if (slot.type === 'goal') typeClass = 'event-goal';
                    if (slot.type === 'project') typeClass = 'event-project';
                    if (slot.type === 'sleep') typeClass = 'event-sleep';
                    
                    const uid = slot.user_id || 'both';
                    const badgeColor = uid === 'user1' ? 'var(--accent-emerald)' : uid === 'user2' ? 'var(--accent-purple)' : 'var(--text-muted)';
                    const badgeText = uid === 'user1' ? u1Name.charAt(0).toUpperCase() : uid === 'user2' ? u2Name.charAt(0).toUpperCase() : 'Both';
                    const borderStyle = uid === 'user1' ? '4px solid var(--accent-emerald)' : uid === 'user2' ? '4px solid var(--accent-purple)' : '2px solid rgba(255,255,255,0.1)';
                    const bgStyle = uid === 'user1' ? 'rgba(16,185,129,0.06)' : uid === 'user2' ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)';
                    
                    const isSlotEditable = slot.item_id && ['goal', 'project', 'commitment'].includes(slot.type) && (slot.user_id === activeUser || slot.user_id === 'both');
                    
                    return (
                      <div key={idx} className={`event-pill ${typeClass}`} 
                           style={{ cursor: slot.item_id ? 'pointer' : 'default', borderLeft: borderStyle, background: bgStyle }}
                           onClick={() => {
                             if (slot.item_id && ['goal', 'project', 'commitment'].includes(slot.type)) {
                               setSelectedSlot(slot);
                               setSelectedDate(date);
                             }
                           }}>
                        {isSlotEditable && (
                          <button 
                            className="edit-pencil-btn" 
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(0,0,0,0.4)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#fff',
                              padding: '2px',
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                              zIndex: 10
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSlot(slot);
                              setSelectedDate(date);
                            }}
                          >
                            <Pencil size={10} />
                          </button>
                        )}
                        <div className="flex justify-between items-center" style={{ marginBottom: '4px', paddingRight: isSlotEditable ? '20px' : '0' }}>
                          <div className="mono time" style={{ margin: 0, color: badgeColor }}>
                            {formatTimeAMPM(slot.start_time)} - {formatTimeAMPM(slot.end_time)}
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: badgeColor, color: '#fff', padding: '1px 4px', borderRadius: '4px' }}>
                            {badgeText}
                          </span>
                        </div>
                        <div className="title">{slot.title}</div>
                      </div>
                    );
                  })}
                  {filteredSlots.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>Free Time</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSlot && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h3 style={{ marginBottom: '1rem' }}>Manage: {selectedSlot.title}</h3>
            
            {(() => {
              const isOwner = selectedSlot.user_id === activeUser || selectedSlot.user_id === 'both';
              
              if (['goal', 'project'].includes(selectedSlot.type)) {
                return (
                  <div className="flex flex-col gap-4">
                    <p>You can push this item to next week. The system will regenerate the rest of this week's schedule without it.</p>
                    {isOwner ? (
                      <button className="btn btn-primary" onClick={handlePush}>Push to Next Week</button>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                        🔒 Read-only: Only {selectedSlot.user_id === 'user1' ? u1Name : u2Name} can reschedule this goal/project.
                      </p>
                    )}
                  </div>
                );
              }
              
              if (selectedSlot.type === 'commitment') {
                return (
                  <div className="flex flex-col gap-4 text-left" style={{ textAlign: 'left' }}>
                    <div className="form-group flex-col gap-1">
                      <label className="label" style={{ fontWeight: '500' }}>Title</label>
                      <input 
                        type="text" 
                        className="input" 
                        disabled={!isOwner}
                        value={editData ? editData.title : ''} 
                        onChange={e => setEditData({ ...editData, title: e.target.value })} 
                      />
                    </div>
                    
                    <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group flex-col gap-1">
                        <label className="label" style={{ fontWeight: '500' }}>Start Time</label>
                        <input 
                          type="datetime-local" 
                          className="input" 
                          disabled={!isOwner}
                          value={editData ? editData.start_datetime : ''} 
                          onChange={e => setEditData({ ...editData, start_datetime: e.target.value })} 
                        />
                      </div>
                      <div className="form-group flex-col gap-1">
                        <label className="label" style={{ fontWeight: '500' }}>End Time</label>
                        <input 
                          type="datetime-local" 
                          className="input" 
                          disabled={!isOwner}
                          value={editData ? editData.end_datetime : ''} 
                          onChange={e => setEditData({ ...editData, end_datetime: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div className="form-group flex-col gap-1">
                      <label className="label" style={{ fontWeight: '500' }}>Assigned To</label>
                      <select 
                        className="input" 
                        disabled={!isOwner}
                        value={editData ? editData.user_id : 'both'} 
                        onChange={e => setEditData({ ...editData, user_id: e.target.value })}
                      >
                        <option value="user1">{u1Name}</option>
                        <option value="user2">{u2Name}</option>
                        <option value="both">Both (Joint Appointment)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2" style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="checkbox" 
                        id="edit-is-fixed"
                        disabled={!isOwner}
                        checked={editData ? editData.is_fixed : true} 
                        onChange={e => setEditData({ ...editData, is_fixed: e.target.checked })} 
                      />
                      <label htmlFor="edit-is-fixed" style={{ fontSize: '0.85rem', cursor: isOwner ? 'pointer' : 'default', margin: 0 }}>Fixed Appointment (blocks other events)</label>
                    </div>

                    {isOwner ? (
                      <div className="flex gap-2" style={{ marginTop: '0.75rem', display: 'flex' }}>
                        <button className="btn btn-primary" style={{ flex: 1, background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#fff' }} onClick={handleEditSubmit}>
                          Save Changes
                        </button>
                        <button className="btn btn-danger" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={handleCancel}>
                          Delete Entry
                        </button>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1.25rem' }}>
                        🔒 Read-only: Only {selectedSlot.user_id === 'user1' ? u1Name : u2Name} can edit or delete this appointment.
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}
            
            <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }} onClick={() => { setSelectedSlot(null); setRescheduleData(null); }}>Close</button>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      {wizardStep !== 'idle' && (
        <div className="modal-overlay">
          <div className="modal-content card flex-col gap-4" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3>Schedule Builder: {wizardUser === 'user1' ? u1Name : u2Name}</h3>
              <span className="badge" style={{ background: 'var(--accent-blue)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                Step: {wizardStep.toUpperCase()}
              </span>
            </div>

            {wizardLoading && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 size={24} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-blue)' }} />
                <p style={{ color: 'var(--text-muted)' }}>Calculating optimal slots...</p>
              </div>
            )}

            {!wizardLoading && wizardStep === 'goals' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 style={{ color: 'var(--accent-blue)', margin: '0 0 0.25rem 0' }}>Goal: {wizardData.goals[wizardCurrentIdx].title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    Duration: {wizardData.goals[wizardCurrentIdx].duration_minutes} minutes | Recommended ramp target: {wizardData.goals[wizardCurrentIdx].effective_target} days/week
                  </p>
                </div>

                {showRampInput ? (
                  <div className="flex flex-col gap-3 card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ margin: 0 }}>Would you like to schedule this goal for this week?</p>
                    <div className="flex gap-2 items-center">
                      <label style={{ fontSize: '0.9rem' }}>How many days?</label>
                      <input 
                        type="number" 
                        value={goalRampDays} 
                        onChange={e => setGoalRampDays(e.target.value)} 
                        className="input" 
                        style={{ width: '80px', padding: '0.4rem' }}
                        min="1" max="7" 
                      />
                    </div>
                    <div className="flex gap-2 justify-end" style={{ marginTop: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={nextGoal}>Skip Goal</button>
                      <button className="btn btn-primary" onClick={getGoalSuggestions}>Suggest Times</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Select {goalRampDays} available time block(s):</p>
                      <span style={{ fontSize: '0.9rem', color: wizardSelectedSlots.length === parseInt(goalRampDays) ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        Selected: {wizardSelectedSlots.length} / {goalRampDays}
                      </span>
                    </div>
                    {wizardOptions.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No matching free time slots found.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {Object.entries(wizardOptions.reduce((acc, slot) => {
                          const dayName = format(new Date(slot.date + 'T00:00:00'), 'EEEE');
                          if(!acc[dayName]) acc[dayName] = [];
                          acc[dayName].push(slot);
                          return acc;
                        }, {})).map(([day, slots]) => (
                          <details key={day} className="card" style={{ background: 'rgba(255,255,255,0.02)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <summary style={{ padding: '0.75rem', fontWeight: 'bold', outline: 'none' }}>{day} ({slots.length} option{slots.length !== 1 ? 's' : ''})</summary>
                            <div className="flex flex-wrap gap-2" style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
                              {slots.map((slot, idx) => {
                                const isSelected = wizardSelectedSlots.includes(slot);
                                return (
                                  <span key={idx} 
                                        className="badge hover-scale" 
                                        onClick={() => toggleSlotSelection(slot)}
                                        style={{ 
                                          cursor: 'pointer',
                                          background: isSelected ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.05)',
                                          color: isSelected ? '#fff' : 'var(--text-muted)',
                                          padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                    {formatTimeAMPM(slot.start_time)} - {formatTimeAMPM(slot.end_time)}
                                  </span>
                                );
                              })}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 justify-end" style={{ marginTop: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => setShowRampInput(true)}>Back</button>
                      <button className="btn btn-secondary" onClick={nextGoal}>Skip Goal</button>
                      <button className="btn btn-primary" onClick={selectGoalOption} disabled={wizardSelectedSlots.length !== parseInt(goalRampDays)}>Confirm Slots</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!wizardLoading && wizardStep === 'projects' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 style={{ color: 'var(--accent-blue)', margin: '0 0 0.25rem 0' }}>Project: {wizardData.projects[wizardCurrentIdx].title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    Schedule time in the largest blocks of uninterrupted free time.
                  </p>
                </div>

                {showProjectHoursInput ? (
                  <div className="flex flex-col gap-3 card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ margin: 0 }}>Would you like to schedule time for this project this week?</p>
                    <div className="flex gap-2 items-center">
                      <label style={{ fontSize: '0.9rem' }}>How many hours total?</label>
                      <input 
                        type="number" 
                        value={projectHours} 
                        onChange={e => setProjectHours(e.target.value)} 
                        className="input" 
                        style={{ width: '80px', padding: '0.4rem' }}
                        min="0.5" max="20" step="0.5" 
                      />
                    </div>
                    <div className="flex gap-2 justify-end" style={{ marginTop: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={nextProject}>Skip Project</button>
                      <button className="btn btn-primary" onClick={getProjectSuggestions}>Find Big Blocks</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Select your preferred working blocks:</p>
                      <span style={{ fontSize: '0.9rem', color: wizardSelectedSlots.length > 0 ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                        Selected: {wizardSelectedSlots.reduce((acc, slot) => acc + slot.allocated_hours, 0)} hours
                      </span>
                    </div>
                    {wizardOptions.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No suitable free blocks found.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {Object.entries(wizardOptions.reduce((acc, slot) => {
                          const dayName = format(new Date(slot.date + 'T00:00:00'), 'EEEE');
                          if(!acc[dayName]) acc[dayName] = [];
                          acc[dayName].push(slot);
                          return acc;
                        }, {})).map(([day, slots]) => (
                          <details key={day} className="card" style={{ background: 'rgba(255,255,255,0.02)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <summary style={{ padding: '0.75rem', fontWeight: 'bold', outline: 'none' }}>{day} ({slots.length} block{slots.length !== 1 ? 's' : ''})</summary>
                            <div className="flex flex-wrap gap-2" style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
                              {slots.map((slot, idx) => {
                                const isSelected = wizardSelectedSlots.includes(slot);
                                return (
                                  <span key={idx} 
                                        className="badge hover-scale" 
                                        onClick={() => toggleSlotSelection(slot)}
                                        style={{ 
                                          cursor: 'pointer',
                                          background: isSelected ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                                          color: isSelected ? '#fff' : 'var(--text-muted)',
                                          padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                    {formatTimeAMPM(slot.start_time)} - {formatTimeAMPM(slot.end_time)} ({slot.allocated_hours}h)
                                  </span>
                                );
                              })}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 justify-end" style={{ marginTop: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => setShowProjectHoursInput(true)}>Back</button>
                      <button className="btn btn-secondary" onClick={nextProject}>Skip Project</button>
                      <button className="btn btn-primary" onClick={selectProjectOption} disabled={wizardSelectedSlots.length === 0}>Confirm Blocks</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!wizardLoading && wizardStep === 'done' && (
              <div className="flex flex-col gap-4">
                <p style={{ margin: 0, fontWeight: 'bold' }}>Final Step: Review and Submit your Schedule</p>
                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {wizardDraftSlots.filter(s => ['goal', 'project'].includes(s.type)).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No goals or projects scheduled. Just sleep and work blocked off.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {wizardDraftSlots.filter(s => ['goal', 'project'].includes(s.type)).map((s, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'between' }}>
                          <span style={{ color: 'var(--accent-blue)' }}>[{s.type.toUpperCase()}] {s.title}</span>
                          <span style={{ color: 'var(--text-muted)' }}> - {format(new Date(s.date + 'T00:00:00'), 'EEE')}: {formatTimeAMPM(s.start_time)}-{formatTimeAMPM(s.end_time)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="btn btn-secondary" onClick={() => setWizardStep('idle')}>Cancel</button>
                  <button className="btn btn-primary" onClick={submitWizardSchedule}>Submit Schedule</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

