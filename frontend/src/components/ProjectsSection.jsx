import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, X, Lock } from 'lucide-react';
import { api } from '../utils/api';
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

export default function ProjectsSection({ projects, currentUser, isDashboardOwner, refresh, showU1, showU2 }) {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectHours, setProjectHours] = useState(4);
  const [projectDeadline, setProjectDeadline] = useState('');

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

  const p_list = projects.filter(x => (x.user_id === 'user1' && showU1) || (x.user_id === 'user2' && showU2));

  return (
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
  );
}
