import React, { useState } from 'react';
import { api } from '../../utils/api';
import { ThumbsUp, ThumbsDown, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function WishlistPanel({ tripData, refresh, activeUser }) {
  const [title, setTitle] = useState('');
  const wishlist = tripData.wishlist || [];

  const handleAdd = async () => {
    if (!title) return;
    await api.post(`/trips/${tripData.id}/wishlist`, {
      title, category: 'General', partner_id: activeUser
    });
    setTitle('');
    refresh();
  };

  const handleVote = async (itemId, vote) => {
    await api.post(`/trips/wishlist/${itemId}/vote?user=${activeUser}&vote=${vote}`);
    refresh();
  };

  const handleDelete = async (itemId) => {
    await api.delete(`/trips/wishlist/${itemId}`);
    refresh();
  };

  const promoteToItinerary = async (item) => {
    await api.post(`/trips/${tripData.id}/itinerary`, {
      day: '1', title: item.title, time: '', location: '', notes: '', partner_id: activeUser
    });
    refresh();
  };

  // Sort by total votes
  const sortedWishlist = [...wishlist].sort((a, b) => (b.votes_u1 + b.votes_u2) - (a.votes_u1 + a.votes_u2));

  return (
    <div className="card h-full flex flex-col gap-4">
      <h3 style={{ color: 'var(--accent-pink)', margin: 0 }}>Wishlist Ideas</h3>
      
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2">
        {sortedWishlist.map(item => (
          <div key={item.id} className="p-3 flex items-center justify-between" style={{ background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{item.title} {item.is_bucket_list && <span style={{ fontSize: '0.7rem', background: 'var(--accent-blue)', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>Bucket List</span>}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score: {item.votes_u1 + item.votes_u2}</div>
            </div>
            
            <div className="flex items-center gap-1">
              <button onClick={() => handleVote(item.id, 1)} className="btn btn-outline" style={{ padding: '4px' }}><ThumbsUp size={14}/></button>
              <button onClick={() => handleVote(item.id, -1)} className="btn btn-outline" style={{ padding: '4px' }}><ThumbsDown size={14}/></button>
              <button onClick={() => promoteToItinerary(item)} className="btn btn-outline" style={{ padding: '4px', color: 'var(--accent-emerald)' }} title="Add to Itinerary"><ArrowRight size={14}/></button>
              <button onClick={() => handleDelete(item.id)} className="btn btn-outline" style={{ padding: '4px', border: 'none' }}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
        {wishlist.length === 0 && <div className="text-muted text-center mt-4">No ideas yet.</div>}
      </div>

      <div className="flex gap-2 mt-auto" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <input className="input" placeholder="New Idea..." value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16}/></button>
      </div>
    </div>
  );
}
