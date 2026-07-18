import React, { useState } from 'react';
import { api } from '../../utils/api';
import { Save, Image } from 'lucide-react';

export default function OverviewPanel({ tripData, refresh, activeUser }) {
  const [name, setName] = useState(tripData.name || '');
  const [dates, setDates] = useState(tripData.dates || '');
  const [destination, setDestination] = useState(tripData.destination || '');
  const [moodTags, setMoodTags] = useState(tripData.mood_tags || '');

  const handleSave = async () => {
    await api.put(`/trips/${tripData.id}`, {
      name, dates, destination, mood_tags: moodTags
    });
    refresh();
  };

  return (
    <div className="card h-full flex flex-col gap-4">
      <h3 style={{ color: 'var(--accent-blue)', margin: 0 }}>Overview</h3>
      
      <div className="flex flex-col gap-3">
        <div>
          <label className="label">Trip Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} onBlur={handleSave} />
        </div>
        <div>
          <label className="label">Dates</label>
          <input className="input" value={dates} onChange={e => setDates(e.target.value)} onBlur={handleSave} placeholder="e.g., Oct 1 - Oct 10" />
        </div>
        <div>
          <label className="label">Destination</label>
          <input className="input" value={destination} onChange={e => setDestination(e.target.value)} onBlur={handleSave} />
        </div>
        <div>
          <label className="label">Mood Tags</label>
          <input className="input" value={moodTags} onChange={e => setMoodTags(e.target.value)} onBlur={handleSave} placeholder="Relaxing, Adventure, etc." />
        </div>
      </div>
      
      <div className="mt-auto">
        <label className="label">Trip Readiness Progress</label>
        <div style={{ width: '100%', background: 'var(--bg-panel)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${tripData.progress}%`, background: 'var(--accent-emerald)', height: '100%' }} />
        </div>
      </div>
    </div>
  );
}
