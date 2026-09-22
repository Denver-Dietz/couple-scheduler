import React, { useState } from 'react';
import { ArrowUpRight, Link as LinkIcon, Plus } from 'lucide-react';
import { api } from '../../utils/api';

export default function SelectedItemDrawer({ selectedItem, setSelectedItem, refresh }) {
  const [newUrl, setNewUrl] = useState('');

  const handleAddLink = async () => {
    if (!newUrl || !selectedItem) return;
    try {
      await api.post(`/bucket-list/${selectedItem.id}/links`, { url: newUrl });
      setNewUrl('');
      refresh();
      // Update local state for immediate feedback
      setSelectedItem({
        ...selectedItem,
        links: [...(selectedItem.links || []), { id: Date.now(), url: newUrl }]
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePromote = async () => {
    if (!selectedItem) return;
    try {
      await api.post(`/bucket-list/promote/${selectedItem.id}`);
      setSelectedItem(null);
      alert('Promoted to Trip Planner!');
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  if (!selectedItem) return null;

  return (
    <div className="card glass-panel animate-fade-in" style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
      borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
      padding: '2rem',
      zIndex: 1000,
      boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
      maxHeight: '50vh', overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', textAlign: 'left' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedItem.title}</h2>
          <span style={{
            background: selectedItem.status === 'promoted' ? 'var(--accent-purple)' : 'var(--bg-panel)',
            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem'
          }}>
            {selectedItem.status === 'promoted' ? 'Planned Trip' : 'Bucket List Idea'}
          </span>
        </div>

        {selectedItem.status === 'idea' && (
          <button className="btn btn-primary" onClick={handlePromote} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpRight size={18} /> Promote to Trip Planner
          </button>
        )}
      </div>

      <div style={{ textAlign: 'left' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>Inspiration Links</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {selectedItem.links?.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>
              <LinkIcon size={16} /> {link.url}
            </a>
          ))}
          {(!selectedItem.links || selectedItem.links.length === 0) && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No links saved yet.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" className="input" placeholder="Paste a link..." value={newUrl} onChange={e => setNewUrl(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={handleAddLink}><Plus size={20} /></button>
        </div>
      </div>
    </div>
  );
}
