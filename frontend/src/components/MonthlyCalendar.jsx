import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Pencil, X } from 'lucide-react';
import { api } from '../utils/api';

/**
 * Renders a full month view of upcoming events, trips, and major milestones.
 * 
 * Why:
 * - Provides a birds-eye view of long-term plans (unlike the highly-tactical weekly Schedule view).
 * - Reactively listens to global 'app-refresh' events to stay in sync with the backend.
 */
export default function MonthlyCalendar({ activeUser }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  
  const [showU1, setShowU1] = useState(true);
  const [showU2, setShowU2] = useState(true);
  
  const [u1Name, setU1Name] = useState('User 1');
  const [u2Name, setU2Name] = useState('User 2');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await api.getFutureCalendar();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await api.getSettings();
        const find = (k, d) => s.find(setting => setting.key === k)?.value || d;
        setU1Name(find('user1_name', 'User 1'));
        setU2Name(find('user2_name', 'User 2'));
      } catch (e) {}
    };
    fetchSettings();
    fetchEvents();
    const handleRefresh = () => fetchEvents();
    window.addEventListener('app-refresh', handleRefresh);
    return () => window.removeEventListener('app-refresh', handleRefresh);
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setEditData({
        title: selectedEvent.title || '',
        start_time: selectedEvent.start_time || '',
        user_id: selectedEvent.user_id || 'both'
      });
    } else {
      setEditData(null);
    }
  }, [selectedEvent]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map events by date string (YYYY-MM-DD)
  const eventsByDate = {};
  events.forEach(e => {
    const uid = e.user_id || 'both';
    if ((uid === 'user1' && !showU1) || (uid === 'user2' && !showU2) || (uid === 'both' && !showU1 && !showU2)) {
      return; // Skip filtered
    }
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  const handleEditSubmit = async () => {
    if (!selectedEvent || !selectedEvent.item_id || !editData) return;
    try {
      setLoading(true);
      // We assume date is kept same, just updating time and title
      const startDateTime = `${selectedEvent.date} ${editData.start_time}:00`;
      
      await api.rescheduleCommitment(selectedEvent.item_id, {
        title: editData.title,
        start_time: startDateTime,
        end_time: startDateTime, // Defaulting end_time to start_time for simple events
        user_id: editData.user_id,
        is_fixed: true
      });
      setSelectedEvent(null);
      await fetchEvents();
      window.dispatchEvent(new Event('app-refresh'));
    } catch (e) {
      console.error(e);
      alert("Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !selectedEvent.item_id) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      setLoading(true);
      await api.cancelCommitment(selectedEvent.item_id);
      setSelectedEvent(null);
      await fetchEvents();
      window.dispatchEvent(new Event('app-refresh'));
    } catch (e) {
      console.error(e);
      alert("Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  const renderCells = () => {
    const cells = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = eventsByDate[dateStr] || [];

      cells.push(
        <div key={day} className="calendar-cell glass-panel">
          <div className="calendar-day-number">{day}</div>
          <div className="calendar-events-container">
            {dayEvents.map((evt, idx) => {
              const uid = evt.user_id || 'both';
              const colorClass = uid === 'user1' ? 'u1-event' : uid === 'user2' ? 'u2-event' : 'both-event';
              const isOwner = uid === activeUser || uid === 'both';
              const isSlotEditable = evt.item_id && isOwner;

              return (
                <div 
                  key={idx} 
                  className={`calendar-event-pill ${evt.is_fixed ? 'fixed-event' : 'tentative-event'} ${colorClass}`}
                >
                  {isSlotEditable && (
                    <button 
                      className="edit-pencil-btn"
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', zIndex: 10 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(evt);
                      }}
                    >
                      <Pencil size={10} />
                    </button>
                  )}
                  {evt.start_time && <span className="event-time">{evt.start_time}</span>}
                  <span className="event-title">{evt.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="monthly-calendar-container">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', alignSelf: 'flex-start', marginBottom: '1rem' }}>
        <button 
          onClick={() => setShowU1(!showU1)}
          style={{ 
            padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
            background: showU1 ? 'var(--accent-emerald)' : 'transparent',
            color: showU1 ? '#fff' : 'var(--text-muted)'
          }}>
          <User size={14} /> {u1Name}
        </button>
        <button 
          onClick={() => setShowU2(!showU2)}
          style={{ 
            padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
            background: showU2 ? 'var(--accent-purple)' : 'transparent',
            color: showU2 ? '#fff' : 'var(--text-muted)'
          }}>
          <User size={14} /> {u2Name}
        </button>
      </div>

      <div className="calendar-header glass-panel">
        <button className="btn-icon" onClick={prevMonth}><ChevronLeft /></button>
        <h3 className="calendar-title flex items-center gap-2">
          <CalendarIcon className="text-accent" />
          {monthName} {year}
        </h3>
        <button className="btn-icon" onClick={nextMonth}><ChevronRight /></button>
      </div>

      <div className="calendar-grid-header">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {renderCells()}
      </div>

      {selectedEvent && editData && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h3 style={{ marginBottom: '1rem' }}>Edit Event: {selectedEvent.title}</h3>
            
            <div className="flex flex-col gap-4 text-left" style={{ textAlign: 'left' }}>
              <div className="form-group flex-col gap-1">
                <label className="label" style={{ fontWeight: '500' }}>Title</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editData.title}
                  onChange={e => setEditData({...editData, title: e.target.value})}
                />
              </div>
              
              <div className="form-group flex-col gap-1">
                <label className="label" style={{ fontWeight: '500' }}>Time (HH:MM)</label>
                <input 
                  type="time" 
                  className="input" 
                  value={editData.start_time}
                  onChange={e => setEditData({...editData, start_time: e.target.value})}
                />
              </div>

              <div className="form-group flex-col gap-1">
                <label className="label" style={{ fontWeight: '500' }}>Assigned To</label>
                <select 
                  className="input" 
                  value={editData.user_id}
                  onChange={e => setEditData({...editData, user_id: e.target.value})}
                >
                  <option value="both">Both (Shared)</option>
                  <option value="user1">{u1Name}</option>
                  <option value="user2">{u2Name}</option>
                </select>
              </div>

              <div className="flex gap-2" style={{ marginTop: '0.75rem', display: 'flex' }}>
                <button className="btn btn-primary" disabled={loading} style={{ flex: 1, background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#fff' }} onClick={handleEditSubmit}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-danger" disabled={loading} style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={handleDelete}>
                  {loading ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            </div>
            
            <button className="close-btn" style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSelectedEvent(null)}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .monthly-calendar-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.05);
        }
        .calendar-title {
          font-size: 1.5rem;
          margin: 0;
        }
        .btn-icon {
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .calendar-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: bold;
          color: var(--text-muted);
          padding-bottom: 0.5rem;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }
        .calendar-cell {
          height: 160px;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .calendar-cell.empty {
          background: transparent;
          border: none;
        }
        .calendar-day-number {
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: var(--text-muted);
        }
        .calendar-events-container {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          padding-right: 2px;
        }
        .calendar-event-pill {
          position: relative;
          font-size: 0.75rem;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          white-space: normal;
          word-break: break-word;
          line-height: 1.2;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .fixed-event {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .tentative-event {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .u1-event { border-left: 3px solid var(--accent-emerald); }
        .u2-event { border-left: 3px solid var(--accent-purple); }
        .both-event { border-left: 3px solid var(--accent-blue); }
        .event-time {
          font-weight: bold;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
