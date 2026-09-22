import React, { useState } from 'react';
import { api } from '../../utils/api';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowUpRight, Link as LinkIcon, Plus } from 'lucide-react';
import SelectedItemDrawer from "./SelectedItemDrawer";


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
      <SelectedItemDrawer
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        refresh={refresh}
      />

    </div>
  );
}
