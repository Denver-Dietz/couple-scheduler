import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowUpRight, Link as LinkIcon, Plus, Search, MapPin, Loader2, Layers } from 'lucide-react';

const MAP_STYLES = [
  { id: 'voyager', name: 'Voyager (Clean)', url: 'https://api.maptiler.com/maps/voyager/style.json?key=ReuTy2IY21j68ggRSvub' },
  { id: 'streets', name: 'Streets', url: 'https://api.maptiler.com/maps/streets-v2/style.json?key=ReuTy2IY21j68ggRSvub' },
  { id: 'dark', name: 'Dark Theme', url: 'https://api.maptiler.com/maps/dataviz-dark/style.json?key=ReuTy2IY21j68ggRSvub' },
  { id: 'hybrid', name: 'Satellite Hybrid', url: 'https://api.maptiler.com/maps/hybrid/style.json?key=ReuTy2IY21j68ggRSvub' },
  { id: 'outdoor', name: 'Outdoors', url: 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=ReuTy2IY21j68ggRSvub' }
];

export default function DestinationsTab({ items, refresh }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [addingLocation, setAddingLocation] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  
  // Map Style & Search states
  const [activeStyle, setActiveStyle] = useState(MAP_STYLES[0].url);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: activeStyle,
      center: [12, 42], // Default centered near Europe/Global view
      zoom: 2.2
    });

    mapInstanceRef.current = map;

    // Add navigation controls (zoom, rotate)
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    // Handle map clicks to drop a pin manually
    map.on('click', (e) => {
      // If clicking directly on a marker, prevent adding a new pin
      if (e.originalEvent.target.closest('.custom-map-marker')) {
        return;
      }
      
      const { lng, lat } = e.lngLat;
      setAddingLocation({ lat, lng });
      setNewTitle('');
      setSelectedItem(null);
    });

    return () => {
      map.remove();
    };
  }, []);

  // Update map style dynamically when activeStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setStyle(activeStyle);
    }
  }, [activeStyle]);

  // Update markers when items, addingLocation, or map style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const drawMarkers = () => {
      // Clear existing markers from map
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Draw pins for each saved bucket list destination
      items.forEach(item => {
        const el = document.createElement('div');
        el.className = `custom-map-marker ${item.status === 'promoted' ? 'promoted' : 'idea'}`;
        el.innerHTML = `
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="currentColor" class="marker-svg">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="var(--bg-panel, #222)"></circle>
          </svg>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedItem(item);
          setAddingLocation(null);
          
          // Smoothly center map on selected saved pin
          map.flyTo({
            center: [item.longitude, item.latitude],
            zoom: 6,
            essential: true
          });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([item.longitude, item.latitude])
          .addTo(map);
        
        markersRef.current.push(marker);
      });

      // Draw pin for temporary addingLocation
      if (addingLocation) {
        const el = document.createElement('div');
        el.className = 'custom-map-marker temp';
        el.innerHTML = `
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="currentColor" class="marker-svg">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="var(--bg-panel, #222)"></circle>
          </svg>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([addingLocation.lng, addingLocation.lat])
          .addTo(map);
        
        markersRef.current.push(marker);
      }
    };

    if (map.isStyleLoaded()) {
      drawMarkers();
    } else {
      map.on('style.load', drawMarkers);
    }
  }, [items, addingLocation, activeStyle]);

  // Debounced geocoding search querying Nominatim API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
          {
            headers: {
              'User-Agent': 'CoupleScheduler/1.0'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (e) {
        console.error('Error querying location search API:', e);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce to avoid spamming the public OSM endpoint

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [lng, lat],
        zoom: 10,
        essential: true
      });
    }

    setAddingLocation({ lat, lng });
    
    // Extract short name for prefilling (e.g. "Paris" instead of "Paris, Île-de-France, France")
    const shortName = result.display_name.split(',')[0];
    setNewTitle(shortName);
    setSelectedItem(null);
    setSearchQuery('');
    setSearchResults([]);
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
      <style>{`
        .custom-map-marker {
          cursor: pointer;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .custom-map-marker:hover {
          transform: scale(1.22) translateY(-4px);
          z-index: 100;
        }
        .custom-map-marker.idea {
          color: var(--accent-blue, #3b82f6);
        }
        .custom-map-marker.promoted {
          color: var(--accent-purple, #a855f7);
        }
        .custom-map-marker.temp {
          color: var(--accent-emerald, #10b981);
        }
        
        .search-container {
          position: absolute;
          top: 15px;
          left: 15px;
          z-index: 10;
          width: 320px;
          max-width: calc(100% - 30px);
        }
        .search-box {
          display: flex;
          align-items: center;
          background: var(--bg-panel, rgba(30, 30, 30, 0.85));
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          border-radius: 24px;
          padding: 0.5rem 1rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .search-input {
          background: transparent !important;
          border: none !important;
          color: var(--text-color, #fff) !important;
          font-size: 0.95rem;
          width: 100%;
          margin-left: 0.5rem;
          outline: none;
        }
        .search-results {
          background: var(--bg-panel, rgba(30, 30, 30, 0.95));
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          border-radius: 12px;
          margin-top: 0.5rem;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 12px 36px rgba(0,0,0,0.4);
        }
        .search-item {
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-size: 0.85rem;
          border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
          transition: background 0.2s;
          color: var(--text-color, #fff);
          text-align: left;
        }
        .search-item:hover {
          background: var(--border-color, rgba(255, 255, 255, 0.1));
        }
        .search-item:last-child {
          border-bottom: none;
        }
        
        .style-selector-container {
          position: absolute;
          top: 15px;
          right: 15px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-panel, rgba(30, 30, 30, 0.85));
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          border-radius: 20px;
          padding: 0.35rem 0.75rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .style-select {
          background: transparent !important;
          border: none !important;
          color: var(--text-color, #fff) !important;
          font-size: 0.85rem;
          cursor: pointer;
          outline: none;
          padding-right: 0.5rem;
        }
        .style-select option {
          background: var(--bg-panel, #222);
          color: #fff;
        }
        
        .save-panel {
          position: absolute;
          top: 70px;
          right: 15px;
          z-index: 10;
          width: 300px;
          max-width: calc(100% - 30px);
          background: var(--bg-panel, rgba(30, 30, 30, 0.85));
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          text-align: left;
        }
        .save-panel h3 {
          margin: 0 0 0.75rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .maplibregl-popup-close-button {
          color: #fff;
        }
      `}</style>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        
        {/* Map Container Element */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating Search Bar */}
        <div className="search-container">
          <div className="search-box">
            {isSearching ? <Loader2 size={18} className="animate-spin text-muted" /> : <Search size={18} />}
            <input
              type="text"
              placeholder="Search destination (e.g. Hawaii)"
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(result => (
                <div
                  key={result.place_id}
                  className="search-item"
                  onClick={() => handleSelectResult(result)}
                >
                  {result.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Tile Layer Switcher */}
        <div className="style-selector-container">
          <Layers size={16} className="text-muted" style={{ marginRight: '0.2rem' }} />
          <select
            className="style-select"
            value={activeStyle}
            onChange={e => setActiveStyle(e.target.value)}
          >
            {MAP_STYLES.map(style => (
              <option key={style.id} value={style.url}>
                {style.name}
              </option>
            ))}
          </select>
        </div>

        {/* Floating Add Location Save Form */}
        {addingLocation && (
          <div className="save-panel animate-fade-in">
            <h3>Add Destination Pin</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Lat: {addingLocation.lat.toFixed(4)}, Lng: {addingLocation.lng.toFixed(4)}
            </div>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSaveLocation(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
              <input
                type="text"
                className="input"
                placeholder="Destination Name"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#fff' }}
                >
                  Save Pin
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setAddingLocation(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Overlay Instruction Hint */}
        {!addingLocation && (
          <div style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, background: 'rgba(255, 255, 255, 0.95)', color: '#1f2937', fontWeight: 500, padding: '0.5rem 1.25rem', borderRadius: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', border: '1px solid rgba(0, 0, 0, 0.15)', fontSize: '0.85rem', pointerEvents: 'none' }}>
            Click anywhere on the map or search to drop a pin
          </div>
        )}
      </div>

      {/* Bottom Drawer for Selected Item */}
      {selectedItem && (
        <div className="card glass-panel animate-fade-in" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
          borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
          padding: '2rem',
          zIndex: 10,
          boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
          maxHeight: '40vh', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', textAlign: 'left' }}>
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

          <div style={{ textAlign: 'left' }}>
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
