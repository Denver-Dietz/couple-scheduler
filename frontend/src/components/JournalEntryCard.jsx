import React from 'react';
import { MessageSquare, Edit2, Trash2, Lock, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function JournalEntryCard({
  entry,
  currentUser,
  getUserName,
  isBlurred,
  editingEntryId,
  editContent,
  setEditContent,
  setEditingEntryId,
  handleEditStart,
  handleEditSave,
  handleDelete,
  activeCommentEntry,
  setActiveCommentEntry,
  commentText,
  setCommentText,
  submitComment,
  toggleReaction
}) {
  const isEditing = editingEntryId === entry.id;
  const isCommenting = activeCommentEntry === entry.id;
  const isQotd = entry.content.startsWith(`**QotD:**`);

  return (
    <div className="card glass-panel flex-col gap-4">
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
        if (isEditing) {
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

      {entry.user_id === currentUser && !isEditing && (
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
          onClick={() => setActiveCommentEntry(isCommenting ? null : entry.id)}
          style={{
            marginLeft: 'auto',
            fontSize: '0.8rem',
            color: isCommenting ? 'var(--accent-blue)' : 'var(--text-muted)',
            background: isCommenting ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isCommenting ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
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

      {(entry.comments.length > 0 || isCommenting) && (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entry.comments.map(comment => (
            <div key={comment.id} className="flex gap-2">
              <strong style={{ color: comment.user_id === 'user1' ? 'var(--accent-emerald)' : 'var(--accent-purple)' }}>
                {getUserName(comment.user_id)}:
              </strong>
              <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{comment.content}</span>
            </div>
          ))}

          {isCommenting && (
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
  );
}
