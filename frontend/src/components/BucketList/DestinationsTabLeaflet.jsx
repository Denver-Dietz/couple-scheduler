import React, { useState } from 'react';
import { api } from '../../utils/api';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowUpRight, Link as LinkIcon, Plus } from 'lucide-react';

// Fix Leaflet's default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const ideaIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const promotedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle clicks on the map to add new pins
function MapInteraction({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

export default function DestinationsTab({ items, refresh }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [addingLocation, setAddingLocation] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const handleMapClick = (latlng) => {
    setAddingLocation(latlng);
    setNewTitle('');
    setSelectedItem(null);
  };

  const handleSaveLocation = async () => {
    if (!newTitle || !addingLocation) return;
    try {
      await api.post('/bucket-list', {
        item_type: 'destination',
        title: newTitle,
        latitude: addingLocation.lat,
        longitude: addingLocation.lng
      });
      setAddingLocation(null);
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePromote = async () => {
    if (!selectedItem) return;
    try {
      await api.post(`/bucket-list/promote/${selectedItem.id}`);
      setSelectedItem(null);
      alert('Promoted to Trip Planner!');
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const [newUrl, setNewUrl] = useState('');
  const handleAddLink = async () => {
    if (!newUrl || !selectedItem) return;
    try {
      await api.post(`/bucket-list/${selectedItem.id}/links`, { url: newUrl });
      setNewUrl('');
      refresh();
      // Update local state for immediate feedback
      setSelectedItem({
        ...selectedItem,
        links: [...(selectedItem.links || []), { id: Date.now(), url: newUrl }]
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
      
      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapInteraction onMapClick={handleMapClick} />
          
          {items.map(item => (
            <Marker 
              key={item.id} 
              position={[item.latitude, item.longitude]}
              icon={item.status === 'promoted' ? promotedIcon : ideaIcon}
              eventHandlers={{
                click: () => setSelectedItem(item),
              }}
            >
              <Popup>{item.title} {item.status === 'promoted' && '(Promoted)'}</Popup>
            </Marker>
          ))}

          {addingLocation && (
            <Marker position={[addingLocation.lat, addingLocation.lng]} icon={ideaIcon}>
              <Popup>
                <div style={{ padding: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Location Name" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    style={{ display: 'block', marginBottom: '0.5rem', width: '100%' }}
                    autoFocus
                  />
                  <button className="btn btn-primary" onClick={handleSaveLocation} style={{ width: '100%', padding: '0.5rem' }}>Save Pin</button>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        
        {/* Overlay Hint */}
        <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'var(--bg-panel)', padding: '0.5rem 1rem', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.9rem' }}>
          Tap anywhere on the map to add a destination idea
        </div>
      </div>

      {/* Bottom Drawer for Selected Item */}
      {selectedItem && (
        <div className="card glass-panel" style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, 
          borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
          borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
          padding: '2rem',
          zIndex: 1000,
          boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
          maxHeight: '50vh', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedItem.title}</h2>
              <span style={{ 
                background: selectedItem.status === 'promoted' ? 'var(--accent-purple)' : 'var(--bg-panel)', 
                padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' 
              }}>
                {selectedItem.status === 'promoted' ? 'Planned Trip' : 'Bucket List Idea'}
              </span>
            </div>
            
            {selectedItem.status === 'idea' && (
              <button className="btn btn-primary" onClick={handlePromote} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowUpRight size={18} /> Promote to Trip Planner
              </button>
            )}
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>Inspiration Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {selectedItem.links?.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                  <LinkIcon size={16} /> {link.url}
                </a>
              ))}
              {(!selectedItem.links || selectedItem.links.length === 0) && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No links saved yet.</div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="input" placeholder="Paste a link..." value={newUrl} onChange={e => setNewUrl(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={handleAddLink}><Plus size={20} /></button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
