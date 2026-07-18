import React, { useState } from 'react';
import MemoriesFeed from './MemoriesFeed';
import MemoryUploader from './MemoryUploader';
import RecapViewer from './RecapViewer';
import { Camera, Film } from 'lucide-react';

/**
 * Main dashboard for the Memories feature.
 * 
 * Why:
 * - Acts as a lightweight local router to toggle between viewing the photo feed,
 *   uploading new photos, and watching AI-generated monthly recaps.
 */
export default function MemoriesMain({ activeUser, u1Name, u2Name }) {
  const [view, setView] = useState('feed'); // 'feed', 'upload', 'recap'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header / Actions */}
      <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Memories</h2>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${view === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView(view === 'upload' ? 'feed' : 'upload')}
          >
            <Camera size={18} style={{ marginRight: '0.5rem' }} /> Upload
          </button>
          
          <button 
            className={`btn ${view === 'recap' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView(view === 'recap' ? 'feed' : 'recap')}
          >
            <Film size={18} style={{ marginRight: '0.5rem' }} /> Watch Recap
          </button>
        </div>
      </div>
      
      {/* Dynamic Content */}
      {view === 'feed' && <MemoriesFeed activeUser={activeUser} u1Name={u1Name} u2Name={u2Name} />}
      {view === 'upload' && <MemoryUploader activeUser={activeUser} onComplete={() => setView('feed')} onCancel={() => setView('feed')} />}
      {view === 'recap' && <RecapViewer onClose={() => setView('feed')} />}
    </div>
  );
}
