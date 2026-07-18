import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Target, Briefcase, Plus, Trash2, X, Calendar as CalIcon, User, Lock } from 'lucide-react';
import { format } from 'date-fns';

const formatProjectDate = (startStr, endStr) => {
  try {
    if (startStr && endStr) {
      const startD = new Date(startStr + 'T00:00:00');
      const endD = new Date(endStr + 'T00:00:00');
      if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
        return `${format(startD, 'M/d/yy')} - ${format(endD, 'M/d/yy')}`;
      }
    }
    if (endStr) {
      const endD = new Date(endStr + 'T00:00:00');
      if (!isNaN(endD.getTime())) {
        return `due by ${format(endD, 'M/d/yy')}`;
      }
    }
  } catch (e) {
    console.error("Error formatting project date", e);
  }
  return 'No deadline';
};

/**
 * User configuration panel for Fixed Commitments, Flexible Goals, and One-off Projects.
 * 
 * Why:
 * - This component manages the parameters that feed into the AI scheduling engine (schedule_engine.py).
 * - Distinguishes between fixed-time events (Commitments) and flexible goals (Projects/Goals) so the 
 *   AI can accurately auto-pack the flexible items into the free slots between fixed items.
 */
export default function GoalList({ activeUser, dashboardActiveUser, showU1, showU2 }) {
  const currentUser = activeUser || 'user1';
  const isDashboardOwner = !dashboardActiveUser || dashboardActiveUser === activeUser;
  
  const [userName, setUserName] = useState('User 1');
  const [user2Name, setUser2Name] = useState('User 2');
  
  const [commitments, setCommitments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const [cTitle, setCTitle] = useState('');
  const [cStart, setCStart] = useState('');
  const [cEnd, setCEnd] = useState('');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDuration, setGoalDuration] = useState(45);
  const [goalFrequency, setGoalFrequency] = useState(3);

  const [projectTitle, setProjectTitle] = useState('');
  const [projectHours, setProjectHours] = useState(4);
  const [projectDeadline, setProjectDeadline] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [c, g, p, s] = await Promise.all([
        api.getCommitments(), api.getGoals(), api.getProjects(), api.getSettings()
      ]);
      setCommitments(c); setGoals(g); setProjects(p);
      
      const find = (k, d) => s.find(setting => setting.key === k)?.value || d;
      setUserName(find('user1_name', 'User 1'));
      setUser2Name(find('user2_name', 'User 2'));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('app-refresh', refresh);
    return () => window.removeEventListener('app-refresh', refresh);
  }, [refresh]);

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

  const handleAddProject = async () => {
    if (!projectTitle.trim()) return;
    try {
      await api.createProject({
        title: projectTitle, total_hours: projectHours,
        deadline: projectDeadline || null,
        user_id: currentUser
      });
      setProjectTitle(''); setProjectHours(4); setProjectDeadline('');
      setShowProjectForm(false);
      refresh();
    } catch (e) { console.error(e); }
  };

  const c_list = commitments.filter(x => (x.user_id === 'user1' && showU1) || (x.user_id === 'user2' && showU2));
  const g_list = goals.filter(x => (x.user_id === 'user1' && showU1) || (x.user_id === 'user2' && showU2));
  const p_list = projects.filter(x => (x.user_id === 'user1' && showU1) || (x.user_id === 'user2' && showU2));

  return (
    <div className="flex flex-col gap-6">

      {/* Commitments Section */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
          <h3 className="flex items-center gap-2" style={{ color: 'var(--accent-blue)', fontSize: '1rem' }}>
            <CalIcon size={18} /> Appointments
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

      {/* Goals Section */}
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

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
          <h3 className="flex items-center gap-2" style={{ color: 'var(--accent-purple)', fontSize: '1rem' }}>
            <Briefcase size={18} /> Projects
          </h3>
          {isDashboardOwner && (
            <button className="btn btn-outline" onClick={() => setShowProjectForm(!showProjectForm)}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
              {showProjectForm ? <X size={14} /> : <Plus size={14} />}
            </button>
          )}
        </div>

        {showProjectForm && (
          <div className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <input className="input" placeholder="Project title" value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)} style={{ fontSize: '0.85rem' }} />
            </div>
            <div className="flex gap-2" style={{ marginBottom: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ fontSize: '0.75rem' }}>Total hours</label>
                <input type="number" className="input" value={projectHours}
                  onChange={e => setProjectHours(parseInt(e.target.value) || 0)} style={{ fontSize: '0.85rem' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ fontSize: '0.75rem' }}>Deadline</label>
                <input type="date" className="input" value={projectDeadline}
                  onChange={e => setProjectDeadline(e.target.value)} style={{ fontSize: '0.85rem' }} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAddProject}
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem', background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>
              <Plus size={14} /> Add Project
            </button>
          </div>
        )}

        {p_list.length === 0 && !showProjectForm ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.75rem',
            border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
            No projects yet
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {p_list.map(p => (
              <div key={p.id} className="card flex items-center justify-between"
                style={{ padding: '0.75rem', borderLeft: '3px solid var(--accent-purple)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.total_hours}h total ({p.hours_allocated || 0}h done) •{' '}
                    {formatProjectDate(p.start_date, p.deadline)}
                  </div>
                </div>
                {p.user_id === currentUser || p.user_id === 'both' ? (
                  <button onClick={() => { api.deleteProject(p.id); refresh(); }}
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

    </div>
  );
}
