import React, { useState, useEffect } from 'react';
import { api, BACKEND_URL } from '../../utils/api';
import { MessageSquare, MapPin, Calendar, Camera } from 'lucide-react';

const REACTIONS = ['❤️', '😂', '😮', '😢', '🔥'];

export default function MemoriesFeed({ activeUser, u1Name, u2Name }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    try {
      const res = await api.get('/memories');
      setMemories(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMemories();
    const interval = setInterval(fetchMemories, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReact = async (memoryId, reaction) => {
    // Optimistic UI
    const updated = memories.map(m => {
      if (m.id === memoryId) {
        const exists = m.reactions.find(r => r.user_id === activeUser && r.reaction_type === reaction);
        let newReactions = [...m.reactions];
        if (exists) {
          newReactions = newReactions.filter(r => r.id !== exists.id);
        } else {
          newReactions.push({ id: 'temp', user_id: activeUser, reaction_type: reaction });
        }
        return { ...m, reactions: newReactions };
      }
      return m;
    });
    setMemories(updated);
    
    await api.post(`/memories/${memoryId}/react`, { user_id: activeUser, reaction_type: reaction });
    fetchMemories();
  };

  if (loading) return <div>Loading memories...</div>;
  
  if (memories.length === 0) {
    return (
      <div className="card glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
        <Camera size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>No Memories Yet</h3>
        <p style={{ color: 'var(--text-muted)' }}>Upload your first memory to start the timeline!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {memories.map(memory => (
        <MemoryCard 
          key={memory.id} 
          memory={memory} 
          activeUser={activeUser} 
          u1Name={u1Name} 
          u2Name={u2Name} 
          onReact={(emoji) => handleReact(memory.id, emoji)}
          onCommentRefresh={fetchMemories}
        />
      ))}
    </div>
  );
}

function MemoryCard({ memory, activeUser, u1Name, u2Name, onReact, onCommentRefresh }) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  
  const authorName = memory.uploader_id === 'user1' ? u1Name : u2Name;
  const displayDate = new Date(memory.captured_at + 'Z').toLocaleDateString();

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const text = commentText;
    setCommentText('');
    
    await api.post(`/memories/${memory.id}/comment`, { user_id: activeUser, comment_text: text });
    onCommentRefresh();
  };

  return (
    <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {authorName[0]}
          </div>
          <span style={{ fontWeight: 'bold' }}>{authorName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {memory.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <MapPin size={14} /> {memory.location}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Calendar size={14} /> {displayDate}
          </span>
        </div>
      </div>
      
      <img src={`${BACKEND_URL}${memory.storage_url}`} alt="Memory" style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }} />
      
      <div style={{ padding: '1.5rem' }}>
        {memory.caption && (
          <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            <strong>{authorName}</strong> {memory.caption}
          </p>
        )}
        
        {/* Reactions */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {REACTIONS.map(emoji => {
            const reacts = memory.reactions.filter(r => r.reaction_type === emoji);
            const iReacted = reacts.some(r => r.user_id === activeUser);
            
            return (
              <button 
                key={emoji}
                onClick={() => onReact(emoji)}
                style={{ 
                  background: iReacted ? 'var(--accent-purple)' : 'var(--bg-panel)', 
                  border: `1px solid ${iReacted ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                  borderRadius: '20px',
                  padding: '0.3rem 0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: iReacted ? 'white' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                <span>{emoji}</span>
                {reacts.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{reacts.length}</span>}
              </button>
            )
          })}
        </div>
        
        {/* Comments Toggle */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem' }}
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare size={16} /> 
          <span>{memory.comments.length} comments</span>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            {memory.comments.map(c => {
              const cName = c.user_id === 'user1' ? u1Name : u2Name;
              return (
                <div key={c.id} style={{ display: 'flex', gap: '0.5rem' }}>
                  <strong>{cName}:</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.comment_text}</span>
                </div>
              );
            })}
            
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Add a comment..." 
                style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '20px' }}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '20px', padding: '0.5rem 1rem' }} disabled={!commentText.trim()}>Post</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
