import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Target, Settings, Activity, BookOpen, HelpCircle, Heart, Map, Camera, ListTodo, User, Briefcase, ClipboardList } from 'lucide-react';
import { api, BASE_URL } from './utils/api';
import SettingsPanel from './components/SettingsPanel';
import CalendarView from './components/CalendarView';
import GoalList from './components/GoalList';
import WorkSchedulePanel from './components/WorkSchedulePanel';
import SleepSchedulePanel from './components/SleepSchedulePanel';
import CommandReference from './components/CommandReference';
import MonthlyCalendar from './components/MonthlyCalendar';
import JournalView from './components/JournalView';
import ActivityFeed from './components/ActivityFeed';
import DateIdeasMain from './components/DateIdeas/DateIdeasMain';
import CheckInMain from './components/CheckIn/CheckInMain';
import MemoriesMain from './components/Memories/MemoriesMain';
import TripPlannerMain from './components/TripPlanner/TripPlannerMain';
import BucketListMain from './components/BucketList/BucketListMain';

/**
 * Main application layout and routing component.
 * 
 * Why:
 * - This acts as a single-page application (SPA) shell, maintaining global state (active user, theme)
 *   while lazily rendering specific feature tabs to keep the DOM footprint small.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [activeUser, setActiveUser] = useState(null); // null = Launch Screen
  const [u1Name, setU1Name] = useState('User 1');
  const [u2Name, setU2Name] = useState('User 2');
  
  const [dashboardActiveUser, setDashboardActiveUser] = useState('user1');

  useEffect(() => {
    // Initial data fetch for launch screen
    const fetchInitData = async () => {
      try {
        const s = await api.getSettings();
        const find = (k, d) => s.find(setting => setting.key === k)?.value || d;
        setU1Name(find('user1_name', 'User 1'));
        setU2Name(find('user2_name', 'User 2'));
      } catch (e) { console.error(e); }
    };
    fetchInitData();

    // Default to dark, but when a user logs in we will update this
    document.documentElement.className = 'dark';

    // Global event listener to scroll the main content with arrow keys
    const handleKeyDown = (e) => {
      const mainContent = document.querySelector('.main-content');
      if (!mainContent) return;
      
      // Only scroll if focus is not in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      const scrollAmount = 50;
      if (e.key === 'ArrowDown') {
        mainContent.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        mainContent.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Setup SSE for real-time updates from bot/backend
    /**
     * Why:
     * - Instead of polling the server every few seconds (which drains battery and network),
     *   we maintain an open Server-Sent Events (SSE) connection. When the Telegram bot 
     *   updates the database, the server pushes a 'refresh' event here, triggering a UI re-render.
     */
    const eventSource = new EventSource(`${BASE_URL}/stream`);
    eventSource.onmessage = (event) => {
      if (event.data === 'refresh') {
        window.dispatchEvent(new Event('app-refresh'));
      }
    };

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      eventSource.close();
    };
  }, []);

  const handleLogin = async (userId) => {
    const fetchTheme = async () => {
      try {
        const s = await api.getSettings();
        const themeKey = `${userId}_theme`;
        const userTheme = s.find(setting => setting.key === themeKey)?.value || 'dark';
        document.documentElement.className = userTheme;
      } catch (e) {
        console.error("Error setting theme", e);
      }
    }
    fetchTheme();
    setActiveUser(userId);
    setDashboardActiveUser(userId);
  };

  if (!activeUser) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <div className="card glass-panel flex-col items-center gap-6" style={{ width: '400px', padding: '3rem', textAlign: 'center' }}>
          <img 
            src="/logo.jpg" 
            alt="Our Beautiful Life Logo" 
            style={{ width: '100px', height: '100px', borderRadius: '24px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', margin: '0 auto' }} 
          />
          <div>
            <h1 style={{ fontSize: '2rem', lineHeight: '1.2', margin: 0 }}>Our Beautiful</h1>
            <h1 style={{ fontSize: '2rem', lineHeight: '1.2', color: 'var(--accent-blue)', margin: 0 }}>Life</h1>
          </div>
          <div className="flex flex-col gap-3" style={{ width: '100%', marginTop: '1rem' }}>
            <button className="btn" style={{ padding: '1rem', background: 'var(--accent-emerald-bg)', border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)' }} onClick={() => handleLogin('user1')}>
              <User size={20} /> {u1Name}
            </button>
            <button className="btn" style={{ padding: '1rem', background: 'var(--accent-purple-bg)', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)' }} onClick={() => handleLogin('user2')}>
              <User size={20} /> {u2Name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel">
        <div className="flex items-center gap-3" style={{ marginBottom: '1.5rem' }}>
          <img 
            src="/logo.jpg" 
            alt="Our Beautiful Life Logo" 
            style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '1.1rem', lineHeight: '1.1', fontWeight: 'bold', margin: 0 }}>Our Beautiful</h1>
            <span style={{ fontSize: '1.1rem', lineHeight: '1.1', fontWeight: 'bold', color: 'var(--accent-blue)' }}>Life</span>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div 
            className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Activity size={20} /> Dashboard
          </div>
          <div 
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarIcon size={20} /> Calendar
          </div>
          <div 
            className={`nav-item ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            <BookOpen size={20} /> Journal
          </div>

          <div 
            className={`nav-item ${activeTab === 'dates' ? 'active' : ''}`}
            onClick={() => setActiveTab('dates')}
          >
            <Heart size={20} /> Date Ideas
          </div>
          <div 
            className={`nav-item ${activeTab === 'checkin' ? 'active' : ''}`}
            onClick={() => setActiveTab('checkin')}
          >
            <ClipboardList size={20} /> Check-In
          </div>
          <div 
            className={`nav-item ${activeTab === 'memories' ? 'active' : ''}`}
            onClick={() => setActiveTab('memories')}
          >
            <Camera size={20} /> Memories
          </div>
          <div 
            className={`nav-item ${activeTab === 'trip_planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('trip_planner')}
          >
            <Map size={20} /> Trip Planner
          </div>

          <div 
            className={`nav-item ${activeTab === 'bucket_list' ? 'active' : ''}`}
            onClick={() => setActiveTab('bucket_list')}
          >
            <ListTodo size={20} /> Bucket List
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div 
              className={`nav-item ${activeTab === 'tutorial' ? 'active' : ''}`}
              onClick={() => setActiveTab('tutorial')}
            >
              <HelpCircle size={20} /> Tutorial
            </div>
            <div 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} /> Settings
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'schedule' && (
          <div className="flex flex-col gap-6" style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Global Dashboard Toggles */}
            <div className="card" style={{ padding: '1rem' }}>
              <div className="flex items-center justify-between">
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>Dashboard Filters</h3>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px' }}>
                  <button 
                    onClick={() => setDashboardActiveUser('user1')}
                    style={{ 
                      padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                      background: dashboardActiveUser === 'user1' ? 'var(--accent-emerald)' : 'transparent',
                      color: dashboardActiveUser === 'user1' ? '#fff' : 'var(--text-muted)'
                    }}>
                    <User size={14} /> {u1Name}
                  </button>
                  <button 
                    onClick={() => setDashboardActiveUser('user2')}
                    style={{ 
                      padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                      background: dashboardActiveUser === 'user2' ? 'var(--accent-purple)' : 'transparent',
                      color: dashboardActiveUser === 'user2' ? '#fff' : 'var(--text-muted)'
                    }}>
                    <User size={14} /> {u2Name}
                  </button>
                </div>
              </div>
            </div>

            <CalendarView activeUser={activeUser} dashboardActiveUser={dashboardActiveUser} showU1={dashboardActiveUser === 'user1'} showU2={dashboardActiveUser === 'user2'} />
            
            <div className="flex flex-col gap-6">
              <WorkSchedulePanel activeUser={activeUser} dashboardActiveUser={dashboardActiveUser} showU1={dashboardActiveUser === 'user1'} showU2={dashboardActiveUser === 'user2'} />
              <SleepSchedulePanel activeUser={activeUser} dashboardActiveUser={dashboardActiveUser} showU1={dashboardActiveUser === 'user1'} showU2={dashboardActiveUser === 'user2'} />
            </div>
            
            <GoalList activeUser={activeUser} dashboardActiveUser={dashboardActiveUser} showU1={dashboardActiveUser === 'user1'} showU2={dashboardActiveUser === 'user2'} />
          </div>
        )}
        {activeTab === 'tutorial' && (
          <div className="flex flex-col gap-6" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <CommandReference />
          </div>
        )}
        {activeTab === 'calendar' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Future Calendar</h2>
            <MonthlyCalendar activeUser={activeUser} />
          </div>
        )}
        {activeTab === 'journal' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Shared Journal</h2>
            <JournalView activeUser={activeUser} />
          </div>
        )}
        {activeTab === 'memories' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <MemoriesMain activeUser={activeUser} u1Name={u1Name} u2Name={u2Name} />
          </div>
        )}
        {activeTab === 'trip_planner' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <TripPlannerMain activeUser={activeUser} />
          </div>
        )}
        {activeTab === 'bucket_list' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', height: '100%' }}>
            <BucketListMain activeUser={activeUser} />
          </div>
        )}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Configuration</h2>
            <SettingsPanel activeUser={activeUser} />
          </div>
        )}
        
        {activeTab === 'dates' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <DateIdeasMain activeUser={activeUser} />
          </div>
        )}
        {activeTab === 'checkin' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <CheckInMain activeUser={activeUser} u1Name={u1Name} u2Name={u2Name} />
          </div>
        )}
      </main>
      <ActivityFeed activeUser={activeUser} />
    </div>
  );
}
