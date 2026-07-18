import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ScheduleDateModal from './ScheduleDateModal';
import { api } from '../../utils/api';

export default function PickADate({ onBack, datesData, onSchedule, activeUser }) {
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [ideaToSchedule, setIdeaToSchedule] = useState(null);
  
  const handleSchedule = (idea) => {
    setIdeaToSchedule(idea);
  };

  if (selectedTheme) {
    const themeIdeas = datesData.ideas.filter(i => i.theme === selectedTheme.theme);
    
    return (
      <div className="flex flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => setSelectedTheme(null)} className="btn btn-ghost" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Themes
        </button>
        
        <h2 style={{ color: 'var(--accent-blue)' }}>{selectedTheme.theme}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{selectedTheme.description}</p>
        
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {themeIdeas.map(idea => (
            <div key={idea.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {idea.hasImage ? (
                <img src={idea.imageUrl} alt={idea.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '200px', background: 'var(--bg-color-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{idea.id}</span>
                </div>
              )}
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>{idea.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>{idea.description}</p>
                
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => handleSchedule(idea)}>
                  Make it a Date
                </button>
              </div>
            </div>
          ))}
        </div>

        {ideaToSchedule && (
          <ScheduleDateModal 
            idea={ideaToSchedule} 
            onClose={() => setIdeaToSchedule(null)}
            onSchedule={() => {
              setIdeaToSchedule(null);
              onSchedule();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onBack} className="btn btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, color: 'var(--accent-blue)' }}>Pick-A-Date</h2>
      </div>
      
      <div className="flex flex-col gap-3">
        {datesData.themes.map((theme, i) => (
          <button 
            key={i} 
            className="card btn" 
            style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', padding: '1.5rem', textAlign: 'left', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            onClick={() => setSelectedTheme(theme)}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>{theme.theme}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{theme.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

