import React, { useState } from 'react';
import { api } from '../../utils/api';
import { Plane, Hotel, Car, FileText, CheckSquare, Plus, Trash2 } from 'lucide-react';

export default function LogisticsPanel({ tripData, refresh, activeUser }) {
  const [type, setType] = useState('Flights');
  const [details, setDetails] = useState('');
  const logistics = tripData.logistics || [];

  const handleAdd = async () => {
    if (!details) return;
    await api.post(`/trips/${tripData.id}/logistics`, {
      type, details, files: ''
    });
    setDetails('');
    refresh();
  };

  const handleDelete = async (itemId) => {
    await api.delete(`/trips/logistics/${itemId}`);
    refresh();
  };

  const getIcon = (t) => {
    switch (t) {
      case 'Flights': return <Plane size={16} />;
      case 'Hotels': return <Hotel size={16} />;
      case 'Transportation': return <Car size={16} />;
      case 'Packing List': return <CheckSquare size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="card h-full flex flex-col gap-4">
      <h3 style={{ color: 'var(--accent-orange)', margin: 0 }}>Logistics & Packing</h3>
      
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2">
        {logistics.map(item => (
          <div key={item.id} className="p-3 flex items-start gap-3" style={{ background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--accent-orange)' }}>{getIcon(item.type)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.type}</div>
              <div style={{ fontSize: '0.9rem' }}>{item.details}</div>
            </div>
            <button onClick={() => handleDelete(item.id)} className="btn btn-outline" style={{ padding: '4px', border: 'none' }}><Trash2 size={14}/></button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-auto" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <select className="input" value={type} onChange={e => setType(e.target.value)} style={{ width: '120px' }}>
          <option>Flights</option>
          <option>Hotels</option>
          <option>Transportation</option>
          <option>Travel Documents</option>
          <option>Packing List</option>
        </select>
        <input className="input" placeholder="Details..." value={details} onChange={e => setDetails(e.target.value)} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16}/></button>
      </div>
    </div>
  );
}
