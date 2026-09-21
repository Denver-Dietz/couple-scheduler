import React from 'react';
import { Pencil } from 'lucide-react';

const CalendarDaySlot = ({
  slot,
  idx,
  activeUser,
  u1Name,
  u2Name,
  date,
  formatTimeAMPM,
  setSelectedSlot,
  setSelectedDate
}) => {
  let typeClass = 'event-commitment';
  if (slot.type === 'goal') typeClass = 'event-goal';
  if (slot.type === 'project') typeClass = 'event-project';
  if (slot.type === 'sleep') typeClass = 'event-sleep';

  const uid = slot.user_id || 'both';
  const badgeColor = uid === 'user1' ? 'var(--accent-emerald)' : uid === 'user2' ? 'var(--accent-purple)' : 'var(--text-muted)';
  const badgeText = uid === 'user1' ? u1Name.charAt(0).toUpperCase() : uid === 'user2' ? u2Name.charAt(0).toUpperCase() : 'Both';
  const borderStyle = uid === 'user1' ? '4px solid var(--accent-emerald)' : uid === 'user2' ? '4px solid var(--accent-purple)' : '2px solid rgba(255,255,255,0.1)';
  const bgStyle = uid === 'user1' ? 'rgba(16,185,129,0.06)' : uid === 'user2' ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)';

  const isSlotEditable = slot.item_id && ['goal', 'project', 'commitment'].includes(slot.type) && (slot.user_id === activeUser || slot.user_id === 'both');

  return (
    <div key={idx} className={`event-pill ${typeClass}`}
         style={{ cursor: slot.item_id ? 'pointer' : 'default', borderLeft: borderStyle, background: bgStyle }}
         onClick={() => {
           if (slot.item_id && ['goal', 'project', 'commitment'].includes(slot.type)) {
             setSelectedSlot(slot);
             setSelectedDate(date);
           }
         }}>
      {isSlotEditable && (
        <button
          className="edit-pencil-btn"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(0,0,0,0.4)',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            padding: '2px',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            zIndex: 10
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSlot(slot);
            setSelectedDate(date);
          }}
        >
          <Pencil size={10} />
        </button>
      )}
      <div className="flex justify-between items-center" style={{ marginBottom: '4px', paddingRight: isSlotEditable ? '20px' : '0' }}>
        <div className="mono time" style={{ margin: 0, color: badgeColor }}>
          {formatTimeAMPM(slot.start_time)} - {formatTimeAMPM(slot.end_time)}
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: badgeColor, color: '#fff', padding: '1px 4px', borderRadius: '4px' }}>
          {badgeText}
        </span>
      </div>
      <div className="title">{slot.title}</div>
    </div>
  );
};

export default CalendarDaySlot;
