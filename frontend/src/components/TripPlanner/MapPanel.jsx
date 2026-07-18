import React from 'react';

export default function MapPanel({ tripData, refresh, activeUser }) {
  const mapItems = tripData.map_items || [];
  
  // Basic rendering since a real map requires a mapping library. 
  // We'll show a list of pins for now.

  return (
    <div className="card h-full flex flex-col gap-4">
      <h3 style={{ color: 'var(--accent-emerald)', margin: 0 }}>Map View</h3>
      
      <div className="flex-1 rounded flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 10 }}>
          {mapItems.map(item => (
            <div key={item.id} className="p-2 mb-2" style={{ background: 'var(--bg-card)', borderRadius: '6px', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <strong>📍 {item.title || item.category}</strong>
              <div className="text-muted">{item.coordinates}</div>
            </div>
          ))}
        </div>
        <div className="text-muted text-center p-4">
          Interactive Map Canvas<br/>
          (Pins will render here)
        </div>
      </div>
    </div>
  );
}
