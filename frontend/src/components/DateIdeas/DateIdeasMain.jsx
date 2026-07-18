import React, { useState, useEffect } from 'react';
import { fetchDateIdeas } from '../../utils/dateIdeas';
import RandomDate from './RandomDate';
import MatchGame from './MatchGame';
import PickADate from './PickADate';
import DatePlanner from './DatePlanner';
import { api } from '../../utils/api';
import { Heart, Dice5, List, Map } from 'lucide-react';

/**
 * Main dashboard for Date Ideas.
 * 
 * Why:
 * - Provides a gamified interface (Match Game, Randomizer) to overcome decision fatigue when
 *   planning dates. Feeds directly into the calendar by automatically creating fixed commitments.
 */
export default function DateIdeasMain({ activeUser }) {
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'random', 'match', 'pick', 'planner'
  const [datesData, setDatesData] = useState(null);
  const [scheduledDates, setScheduledDates] = useState([]);

  useEffect(() => {
    fetchDateIdeas().then(data => setDatesData(data));
    fetchScheduledDates();
  }, []);

  const fetchScheduledDates = async () => {
    try {
      // Need a custom fetch since the frontend API doesn't expose all fields easily, but let's try
      const data = await api.getCommitments();
      // Filter for is_date == 1 or date_idea_id != null
      const dates = data.filter(c => c.is_date === 1 || c.is_date === true || c.date_idea_id);
      setScheduledDates(dates);
    } catch(e) {
      console.error(e);
    }
  };

  if (!datesData) return <div>Loading dates...</div>;

  if (currentView === 'random') return <RandomDate onBack={() => setCurrentView('menu')} datesData={datesData} onSchedule={fetchScheduledDates} activeUser={activeUser} />;
  if (currentView === 'match') return <MatchGame onBack={() => setCurrentView('menu')} datesData={datesData} onSchedule={fetchScheduledDates} activeUser={activeUser} />;
  if (currentView === 'pick') return <PickADate onBack={() => setCurrentView('menu')} datesData={datesData} onSchedule={fetchScheduledDates} activeUser={activeUser} />;
  if (currentView === 'planner') return <DatePlanner onBack={() => setCurrentView('menu')} datesData={datesData} scheduledDates={scheduledDates} onSchedule={fetchScheduledDates} />;

  const hasScheduledDates = scheduledDates.length > 0;

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--accent-purple)' }}>Date Ideas</h2>
      
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button className="card btn" style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)' }}
                onClick={() => setCurrentView('random')}>
          <Dice5 size={32} color="var(--accent-emerald)" />
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Random</span>
        </button>

        <button className="card btn" style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)' }}
                onClick={() => setCurrentView('match')}>
          <Heart size={32} color="var(--accent-purple)" />
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Match Game</span>
        </button>

        <button className="card btn" style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)' }}
                onClick={() => setCurrentView('pick')}>
          <List size={32} color="var(--accent-blue)" />
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Pick-A-Date</span>
        </button>

        <button className="card btn" style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', opacity: hasScheduledDates ? 1 : 0.5 }}
                onClick={() => hasScheduledDates && setCurrentView('planner')} disabled={!hasScheduledDates}>
          <Map size={32} color="var(--text-muted)" />
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Date Planner</span>
          {!hasScheduledDates && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Schedule a date first</span>}
        </button>
      </div>
    </div>
  );
}

