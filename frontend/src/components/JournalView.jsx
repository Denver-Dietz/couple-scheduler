import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Loader2, MessageSquare, Heart, ThumbsUp, Smile, Sparkles, Send, Edit2, Trash2, Lock } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Interactive Journaling Interface.
 * 
 * Why:
 * - Couples journaling needs privacy, structure (QOTD), and interaction (reactions).
 * - Implements a local AI "Enhance" feature that patches text locally before sending to
 *   a grammar engine, keeping sensitive journal entries away from public LLMs like ChatGPT.
 */
export default function JournalView({ activeUser }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newEntry, setNewEntry] = useState('');
  const currentUser = activeUser || 'user1';

  const [showU1, setShowU1] = useState(true);
  const [showU2, setShowU2] = useState(true);
  
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState(null);
  
  const [activeCommentEntry, setActiveCommentEntry] = useState(null);
  const [commentText, setCommentText] = useState('');
  
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const [u1Name, setU1Name] = useState('User 1');
  const [u2Name, setU2Name] = useState('User 2');

  const [showQotdModal, setShowQotdModal] = useState(false);
  const [isAnsweringQotd, setIsAnsweringQotd] = useState(false);
  const [hasPromptedQotdSession, setHasPromptedQotdSession] = useState(false);
  const [currentQotd, setCurrentQotd] = useState("");
  const [dismissedUsers, setDismissedUsers] = useState({ user1: false, user2: false });

  const dismissQotd = () => {
    setDismissedUsers(prev => ({ ...prev, [currentUser]: true }));
    setShowQotdModal(false);
  };

  const getLocalDateString = (dateObj) => {
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const getEntryLocalDateString = (entryCreatedAt) => {
    if (!entryCreatedAt) return '';
    const dateParts = entryCreatedAt.split(/[- :]/);
    const utcDate = new Date(Date.UTC(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      parseInt(dateParts[3]) || 0,
      parseInt(dateParts[4]) || 0,
      parseInt(dateParts[5]) || 0
    ));
    return getLocalDateString(utcDate);
  };

  const loadJournal = async () => {
    try {
      const [data, s, q] = await Promise.all([
        api.getJournalEntries(),
        api.getSettings(),
        api.getQotd().catch(() => ({ question: "What is a small habit I have that makes you smile?" }))
      ]);
      
      setEntries(data);
      
      const find = (k, d) => s.find(setting => setting.key === k)?.value || d;
      setU1Name(find('user1_name', 'User 1'));
      setU2Name(find('user2_name', 'User 2'));
      setCurrentQotd(q.question);
    } catch (err) {
      console.error('Failed to load journal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournal();
    window.addEventListener('app-refresh', loadJournal);
    return () => window.removeEventListener('app-refresh', loadJournal);
  }, []);

  useEffect(() => {
    if (entries.length === 0) return;
    const today = getLocalDateString(new Date());
    const todaysQotdEntries = entries.filter(e => 
      e.content.startsWith(`**QotD:**`) && 
      getEntryLocalDateString(e.created_at) === today
    );
    const myAnswer = todaysQotdEntries.find(e => e.user_id === currentUser);
    const partnerAnswer = todaysQotdEntries.find(e => e.user_id !== currentUser);
    
    if (myAnswer) {
      setShowQotdModal(false);
    } else if (!dismissedUsers[currentUser]) {
      if (partnerAnswer) {
        setShowQotdModal(true);
      } else if (!hasPromptedQotdSession) {
        setShowQotdModal(true);
        setHasPromptedQotdSession(true);
      }
    }
  }, [entries, currentUser, hasPromptedQotdSession, dismissedUsers]);

  const handlePostInitiate = () => {
    if (!newEntry.trim()) return;
    setShowEnhanceModal(true);
  };

  const handlePostFinal = async (textToPost) => {
    try {
      setEnhancing(true);
      const finalContent = isAnsweringQotd 
        ? `**QotD:** ${currentQotd}\n\n${textToPost}`
        : textToPost;
        
      await api.createJournalEntry({
        user_id: currentUser,
        content: finalContent
      });
      setNewEntry('');
      setShowEnhanceModal(false);
      setIsAnsweringQotd(false);
      setShowQotdModal(false);
      loadJournal();
    } catch (err) {
      console.error(err);
    } finally {
      setEnhancing(false);
    }
  };

  const handleEnhance = async () => {
    try {
      setEnhancing(true);
      setEnhanceError(null);
      const res = await api.enhanceJournalText({ content: newEntry });
      if (res.enhanced) {
        // Automatically post the enhanced text
        handlePostFinal(res.enhanced);
      }
    } catch (err) {
      console.error(err);
      setEnhanceError('The enhancement service is temporarily busy. You can retry or post as-is.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await api.deleteJournalEntry(entryId);
      loadJournal();
    } catch (err) {
      console.error("Failed to delete entry:", err);
      alert("Failed to delete entry.");
    }
  };

  const handleEditStart = (entry) => {
    setEditingEntryId(entry.id);
    setEditContent(entry.content);
  };

  const handleEditSave = async (entryId) => {
    if (!editContent.trim()) return;
    try {
      await api.editJournalEntry(entryId, { content: editContent });
      setEditingEntryId(null);
      setEditContent('');
      loadJournal();
    } catch (err) {
      console.error("Failed to edit entry:", err);
      alert("Failed to save changes.");
    }
  };

  const submitComment = async (entryId) => {
    if (!commentText.trim()) return;
    try {
      await api.addJournalComment(entryId, {
        user_id: currentUser,
        content: commentText
      });
      setCommentText('');
      setActiveCommentEntry(null);
      loadJournal();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReaction = async (entryId, emoji) => {
    try {
      await api.toggleJournalReaction(entryId, {
        user_id: currentUser,
        reaction: emoji
      });
      loadJournal();
    } catch (err) {
      console.error(err);
    }
  };
  
  const getUserName = (uid) => uid === 'user1' ? u1Name : u2Name;

  if (loading) {
    return (
      <div className="card flex-col items-center" style={{ display: 'flex', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
        <Loader2 size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-blue)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading journal...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Journal Composer */}
      <div className="card glass-panel flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="flex items-center gap-2"><Sparkles className="text-accent" /> New Entry</h2>
        </div>
        
        <textarea 
          className="input"
          style={{ minHeight: '120px', resize: 'vertical', width: '100%', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}
          placeholder={`What's on your mind, ${getUserName(currentUser)}?`}
          value={newEntry}
          onChange={e => setNewEntry(e.target.value)}
        />
        <div className="flex justify-between items-center">
          {(() => {
            const today = getLocalDateString(new Date());
            const myAnswer = entries.find(e => 
              e.user_id === currentUser && 
              e.content.startsWith(`**QotD:**`) && 
              getEntryLocalDateString(e.created_at) === today
            );
            if (!myAnswer && currentQotd) {
              return (
                <button 
                  onClick={() => setShowQotdModal(true)}
                  className="btn btn-secondary flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
                  <Sparkles size={14} /> View Today's Question
                </button>
              );
            }
            return <div />;
          })()}
          <button className="btn btn-primary" onClick={() => { setIsAnsweringQotd(false); handlePostInitiate(); }} disabled={!newEntry.trim()}>
            Post Entry
          </button>
        </div>
      </div>

      {/* Journal Feed */}
      <div className="flex flex-col gap-6">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', alignSelf: 'flex-start' }}>
          <button 
            onClick={() => setShowU1(!showU1)}
            style={{ 
              padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
              background: showU1 ? 'var(--accent-emerald)' : 'transparent',
              color: showU1 ? '#fff' : 'var(--text-muted)'
            }}>
            {u1Name}
          </button>
          <button 
            onClick={() => setShowU2(!showU2)}
            style={{ 
              padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
              background: showU2 ? 'var(--accent-purple)' : 'transparent',
              color: showU2 ? '#fff' : 'var(--text-muted)'
            }}>
            {u2Name}
          </button>
        </div>

        {entries.filter(e => (e.user_id === 'user1' && showU1) || (e.user_id === 'user2' && showU2)).map(entry => (
          <div key={entry.id} className="card glass-panel flex-col gap-4">
            <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div className="flex items-center gap-2">
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: entry.user_id === 'user1' ? 'var(--accent-emerald)' : 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                  {getUserName(entry.user_id).charAt(0)}
                </div>
                <strong>{getUserName(entry.user_id)}</strong>
              </div>
              <small style={{ color: 'var(--text-muted)' }}>
                {format(new Date(entry.created_at + 'Z'), 'MMM d, yyyy h:mm a')}
              </small>
            </div>
            
            {(() => {
              const today = getLocalDateString(new Date());
              const isToday = getEntryLocalDateString(entry.created_at) === today;
              const isQotd = entry.content.startsWith(`**QotD:**`);
              
              let isBlurred = false;
              if (isQotd && isToday && entry.user_id !== currentUser) {
                 const iAnswered = entries.some(e => 
                   e.user_id === currentUser && 
                   e.content.startsWith(`**QotD:**`) && 
                   getEntryLocalDateString(e.created_at) === today
                 );
                 if (!iAnswered) isBlurred = true;
              }

              if (editingEntryId === entry.id) {
                return (
                  <div className="flex flex-col gap-2">
                    <textarea 
                      className="input"
                      style={{ minHeight: '120px', resize: 'vertical', width: '100%', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end mt-2">
                      <button className="btn btn-secondary" onClick={() => setEditingEntryId(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => handleEditSave(entry.id)}>Save Changes</button>
                    </div>
                  </div>
                );
              }

              if (isBlurred) {
                return (
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', filter: 'blur(6px)', opacity: 0.5, userSelect: 'none' }}>
                      {entry.content}
                    </p>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
                      <Lock size={24} style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }} />
                      <span style={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Answer today's question to unlock</span>
                    </div>
                  </div>
                );
              }

              return (
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {isQotd ? (
                    <>
                      <strong style={{ color: 'var(--accent-blue)', display: 'block' }}>Question of the Day:</strong>
                      <em style={{ color: 'var(--text-muted)' }}>{entry.content.split('\n\n')[0].replace('**QotD:** ', '')}</em>
                      <br/><br/>
                      {entry.content.substring(entry.content.indexOf('\n\n') + 2)}
                    </>
                  ) : (
                    entry.content
                  )}
                </p>
              );
            })()}
            
            {/* Actions for author */}
            {entry.user_id === currentUser && editingEntryId !== entry.id && (
              <div className="flex gap-2 justify-end" style={{ marginTop: '0.75rem' }}>
                <button 
                  onClick={() => handleEditStart(entry)}
                  title="Edit entry"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.color = 'var(--accent-purple)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(entry.id)}
                  title="Delete entry"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = 'rgba(248,113,113,0.9)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            
            {/* Reactions */}
            <div className="flex items-center gap-2" style={{ marginTop: '0.75rem' }}>
              {['❤️', '👍', '😊', '🙌'].map(emoji => {
                const count = entry.reactions.filter(r => r.reaction === emoji).length;
                const iReacted = entry.reactions.some(r => r.reaction === emoji && r.user_id === currentUser);
                
                return (
                  <button 
                    key={emoji}
                    onClick={() => toggleReaction(entry.id, emoji)}
                    style={{
                      background: iReacted ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: `1px solid ${iReacted ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      borderRadius: '16px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span>{emoji}</span>
                    {count > 0 && <span style={{ color: 'var(--text-muted)' }}>{count}</span>}
                  </button>
                );
              })}
              
              <button 
                onClick={() => setActiveCommentEntry(activeCommentEntry === entry.id ? null : entry.id)}
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.8rem',
                  color: activeCommentEntry === entry.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                  background: activeCommentEntry === entry.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeCommentEntry === entry.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '16px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageSquare size={14} /> {entry.comments.length}
              </button>
            </div>
            
            {/* Comments Section */}
            {(entry.comments.length > 0 || activeCommentEntry === entry.id) && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {entry.comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <strong style={{ color: comment.user_id === 'user1' ? 'var(--accent-emerald)' : 'var(--accent-purple)' }}>
                      {getUserName(comment.user_id)}:
                    </strong>
                    <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{comment.content}</span>
                  </div>
                ))}
                
                {activeCommentEntry === entry.id && (
                  <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input" 
                      style={{ flex: 1 }}
                      placeholder="Write a comment..." 
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitComment(entry.id)}
                    />
                    <button className="btn btn-primary" onClick={() => submitComment(entry.id)}>
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No journal entries yet. Be the first to share your thoughts!
          </div>
        )}
      </div>

      {/* Enhance Modal */}
      {showEnhanceModal && (
        <div className="modal-overlay">
          <div className="modal-content card flex-col items-center gap-4">
            <h3 className="flex items-center gap-2"><Sparkles className="text-accent" /> Polish your writing?</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Would you like the system to lightly edit your entry for spelling, grammar, and sentence structure before you post it?
            </p>
            
            {enhanceError && (
              <div style={{ 
                background: 'rgba(245,158,11,0.1)', 
                border: '1px solid rgba(245,158,11,0.3)', 
                borderRadius: '8px', 
                padding: '0.75rem 1rem', 
                color: 'rgba(252,211,77,0.9)', 
                fontSize: '0.85rem',
                width: '100%',
                textAlign: 'center'
              }}>
                {enhanceError}
              </div>
            )}
            
            <div className="flex flex-col gap-2 w-full" style={{ marginTop: '0.5rem' }}>
              <button 
                className="btn btn-primary flex justify-center items-center gap-2" 
                onClick={handleEnhance}
                disabled={enhancing}
              >
                {enhancing ? <Loader2 size={16} style={{ animation: 'spin 2s linear infinite' }} /> : <Sparkles size={16} />} 
                {enhanceError ? 'Retry Enhancement' : 'Yes, enhance it'}
              </button>
              
              <button 
                className="btn btn-secondary flex justify-center"
                onClick={() => handlePostFinal(newEntry)}
                disabled={enhancing}
              >
                {enhanceError ? 'Post as-is instead' : 'No, post as is'}
              </button>
            </div>
            
            <button 
              style={{ 
                position: 'absolute', 
                top: '0.75rem', 
                right: '0.75rem',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                lineHeight: 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'rgba(248,113,113,0.9)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              onClick={() => { setShowEnhanceModal(false); setEnhanceError(null); }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* QotD Modal Composer */}
      {showQotdModal && !showEnhanceModal && (
        <div className="modal-overlay">
          <div className="modal-content card flex-col items-center gap-4" style={{ maxWidth: '500px', width: '90%' }}>
            <h3 className="flex items-center gap-2" style={{ color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', margin: 0 }}>
              <Sparkles size={14} /> Question of the Day
            </h3>
            
            <em style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '0.5rem', lineHeight: '1.4' }}>
              {currentQotd}
            </em>
            
            <textarea 
              className="input"
              style={{ minHeight: '120px', resize: 'vertical', width: '100%', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder={`Write your answer, ${getUserName(currentUser)}...`}
              value={newEntry}
              onChange={e => setNewEntry(e.target.value)}
            />
            
            <div className="flex flex-col gap-2 w-full" style={{ marginTop: '0.5rem' }}>
              <button 
                className="btn btn-primary flex justify-center items-center gap-2" 
                onClick={() => { setIsAnsweringQotd(true); handlePostInitiate(); }}
                disabled={!newEntry.trim()}
              >
                <Send size={16} /> Post Answer
              </button>
              
              <button 
                className="btn btn-secondary flex justify-center"
                onClick={() => { setIsAnsweringQotd(false); dismissQotd(); }}
              >
                Switch to Free Write
              </button>
            </div>
            
            <button 
              style={{ 
                position: 'absolute', 
                top: '0.75rem', 
                right: '0.75rem',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                lineHeight: 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'rgba(248,113,113,0.9)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              onClick={() => { setIsAnsweringQotd(false); dismissQotd(); }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


