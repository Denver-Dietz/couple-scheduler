import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import CommitmentsSection from './CommitmentsSection';
import GoalsSection from './GoalsSection';
import ProjectsSection from './ProjectsSection';

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

  return (
    <div className="flex flex-col gap-6">
      <CommitmentsSection
        commitments={commitments}
        currentUser={currentUser}
        isDashboardOwner={isDashboardOwner}
        refresh={refresh}
        showU1={showU1}
        showU2={showU2}
      />
      <GoalsSection
        goals={goals}
        currentUser={currentUser}
        isDashboardOwner={isDashboardOwner}
        refresh={refresh}
        showU1={showU1}
        showU2={showU2}
      />
      <ProjectsSection
        projects={projects}
        currentUser={currentUser}
        isDashboardOwner={isDashboardOwner}
        refresh={refresh}
        showU1={showU1}
        showU2={showU2}
      />
    </div>
  );
}
