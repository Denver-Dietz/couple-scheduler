import React, { useState } from 'react';
import { api } from '../../utils/api';
import { MapPin, Clock, Plus, Trash2 } from 'lucide-react';

export default function ItineraryPanel({ tripData, refresh, activeUser }) {
  const [day, setDay] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  
  const itinerary = tripData.itinerary || [];

  const handleAdd = async () => {
    if (!day || !title) return;
    await api.post(`/trips/${tripData.id}/itinerary`, {
      day, title, time, location: '', notes: '', partner_id: activeUser
    });
    setDay('');
    setTitle('');
    setTime('');
    refresh();
  };

  const handleDelete = async (itemId) => {
    await api.delete(`/trips/itinerary/${itemId}`);
    refresh();
  };

  // Group by day
  const grouped = itinerary.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {});

  return (
    <div className="card h-full flex flex-col gap-4">
      <h3 style={{ color: 'var(--accent-purple)', margin: 0 }}>Itinerary</h3>
      
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2">
        {Object.keys(grouped).sort().map(d => (
          <div key={d} className="mb-4">
            <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '8px' }}>Day: {d}</h4>
            <div className="flex flex-col gap-2">
              {grouped[d].map(item => (
                <div key={item.id} className="p-3" style={{ background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.title}</div>
                    {item.time && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Clock size={12} className="inline mr-1"/>{item.time}</div>}
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-outline" style={{ padding: '4px', border: 'none' }}><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-auto" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <input className="input" placeholder="Day (e.g. 1)" value={day} onChange={e => setDay(e.target.value)} style={{ width: '80px' }} />
        <input className="input" placeholder="Time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '80px' }} />
        <input className="input" placeholder="Activity Title" value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16}/></button>
      </div>
    </div>
  );
}
