import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  Check, X, Plus, Trash2, Calendar, MapPin, 
  DollarSign, Flame, Compass, Search, Loader2, ArrowUpDown, Clock
} from 'lucide-react';

// Custom SVG component for overlapping drawing cards
const CardsIcon = ({ size = 20, className, style }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
  >
    <rect x="3" y="6" width="11" height="14" rx="2" transform="rotate(-8 3 6)" />
    <rect x="10" y="4" width="11" height="14" rx="2" transform="rotate(6 10 4)" />
  </svg>
);

export default function ActivitiesTab({ items, refresh }) {
  // Tabs: 'draw' or 'browse'
  const [subTab, setSubTab] = useState('draw');
  
  // Draw tab states
  const [energyFilter, setEnergyFilter] = useState('any');
  const [budgetFilter, setBudgetFilter] = useState('any');
  const [drawnItem, setDrawnItem] = useState(null);
  const [noMatches, setNoMatches] = useState(false);

  // General add/edit states
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEnergy, setNewEnergy] = useState('2');
  const [newBudget, setNewBudget] = useState('2');
  const [newLatitude, setNewLatitude] = useState(null);
  const [newLongitude, setNewLongitude] = useState(null);
  const [newAddress, setNewAddress] = useState('');

  // Location search states
  const [placeQuery, setPlaceQuery] = useState('');
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeResults, setPlaceResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Sorting state for Browse
  // Options: 'alpha', 'energy', 'budget', 'distance'
  const [sortBy, setSortBy] = useState('alpha');

  // Reference coordinates for distance
  const [refCoords, setRefCoords] = useState(null);

  // Scheduler state
  const [schedulingItem, setSchedulingItem] = useState(null);
  const [schedStart, setSchedStart] = useState('');
  const [schedEnd, setSchedEnd] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Deletion confirmation state
  const [deletingItem, setDeletingItem] = useState(null);

  // Load home settings coordinates and browser geolocation on mount
  useEffect(() => {
    // 1. Try browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRefCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: 'browser'
          });
        },
        () => {
          // If denied, fallback to DB home settings
          loadHomeSettings();
        }
      );
    } else {
      loadHomeSettings();
    }

    async function loadHomeSettings() {
      try {
        const settings = await api.getSettings();
        const latVal = settings.find(s => s.key === 'home_latitude')?.value;
        const lngVal = settings.find(s => s.key === 'home_longitude')?.value;
        if (latVal && lngVal) {
          setRefCoords({
            lat: parseFloat(latVal),
            lng: parseFloat(lngVal),
            source: 'settings'
          });
        }
      } catch (e) {
        console.error('Failed to load home coordinates:', e);
      }
    }
  }, []);

  // Compute Haversine distance in miles
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleDraw = () => {
    setNoMatches(false);
    let pool = items.filter(i => i.status !== 'completed');
    if (energyFilter !== 'any') pool = pool.filter(i => i.effort_level === energyFilter);
    if (budgetFilter !== 'any') pool = pool.filter(i => i.estimated_cost === budgetFilter);
    
    if (pool.length === 0) {
      setNoMatches(true);
      return;
    }
    
    const randIndex = Math.floor(Math.random() * pool.length);
    setDrawnItem(pool[randIndex]);
  };

  const handleSearchPlaces = async (queryOverride) => {
    const query = queryOverride || placeQuery;
    if (!query) return;
    setIsSearchingPlaces(true);
    setPlaceResults([]);
    try {
      let path = `/geocoding/search?q=${encodeURIComponent(query)}&type=activity`;
      if (refCoords) {
        path += `&lat=${refCoords.lat}&lon=${refCoords.lng}`;
      }
      const data = await api.get(path);
      const results = data || [];
      setPlaceResults(results);
      if (results.length > 0) {
        handleSelectPlace(results[0]);
      }
    } catch(e) {
      console.error('Place search error:', e);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    // Keep custom activity name if typed, otherwise prefill with venue
    if (!newTitle) {
      setNewTitle(place.name || place.display_name.split(',')[0]);
    }
    setNewLatitude(parseFloat(place.lat));
    setNewLongitude(parseFloat(place.lon));
    setNewAddress(place.display_name);
    
    // Automatically set effort level and budget if estimated by search
    if (place.effort_level) {
      setNewEnergy(String(place.effort_level));
    }
    if (place.estimated_cost) {
      setNewBudget(String(place.estimated_cost));
    }
    
    setPlaceResults([]);
    setPlaceQuery('');
  };

  const handleAdd = async () => {
    if (!newTitle) return;
    try {
      await api.post('/bucket-list', {
        item_type: 'activity',
        title: newTitle,
        effort_level: newEnergy,
        estimated_cost: newBudget,
        latitude: newLatitude,
        longitude: newLongitude,
        address: newAddress
      });
      setNewTitle('');
      setNewLatitude(null);
      setNewLongitude(null);
      setNewAddress('');
      setSelectedPlace(null);
      setShowAdd(false);
      refresh();
    } catch (e) {
      console.error('Failed to create activity:', e);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await api.deleteBucketListItem(deletingItem.id);
      setDeletingItem(null);
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenSchedule = (item) => {
    // Default to tomorrow 7 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    const startStr = tomorrow.toISOString().slice(0, 16);
    
    tomorrow.setHours(21, 0, 0, 0);
    const endStr = tomorrow.toISOString().slice(0, 16);

    setSchedulingItem(item);
    setSchedStart(startStr);
    setSchedEnd(endStr);
  };

  const handleSaveSchedule = async () => {
    if (!schedulingItem || !schedStart || !schedEnd) return;
    setSavingSchedule(true);
    try {
      // 1. Create commitment in Calendar
      await api.createCommitment({
        title: `Date: ${schedulingItem.title}`,
        start_time: schedStart.replace('T', ' ') + ':00',
        end_time: schedEnd.replace('T', ' ') + ':00',
        is_fixed: true,
        user_id: 'both',
        is_date: true,
        date_idea_id: schedulingItem.id,
        place: schedulingItem.title,
        address: schedulingItem.address || '',
        latitude: schedulingItem.latitude,
        longitude: schedulingItem.longitude
      });

      // 2. Mark bucket list item completed (scheduled)
      await api.put(`/bucket-list/${schedulingItem.id}`, { status: 'completed' });
      
      setSchedulingItem(null);
      refresh();
      // Broadcast refresh to Calendar/Activity feed
      window.dispatchEvent(new Event('app-refresh'));
    } catch (e) {
      console.error('Failed to schedule activity:', e);
      alert('Failed to schedule: ' + e.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  // Helper to render flames for effort level
  const renderEffort = (level) => {
    const count = parseInt(level) || 1;
    return (
      <span className="flex items-center gap-0.5 text-orange" title={`Effort level: ${level}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Flame key={i} size={14} fill="currentColor" style={{ color: 'var(--accent-orange, #f97316)' }} />
        ))}
      </span>
    );
  };

  // Helper to render dollar signs for budget
  const renderBudget = (cost) => {
    const count = parseInt(cost) || 1;
    return (
      <span className="flex items-center text-emerald" title={`Budget level: ${cost}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <DollarSign 
            key={i} 
            size={14} 
            className={i < count ? 'opacity-100' : 'opacity-30'} 
            style={{ color: i < count ? 'var(--accent-emerald, #10b981)' : 'var(--text-muted)' }} 
          />
        ))}
      </span>
    );
  };

  // Process activities list
  const activeActivities = items
    .filter(i => i.status !== 'completed')
    .map(item => {
      const distance = refCoords && item.latitude && item.longitude 
        ? calculateDistance(refCoords.lat, refCoords.lng, item.latitude, item.longitude)
        : null;
      return { ...item, distance };
    });

  // Sort activities
  const sortedActivities = [...activeActivities].sort((a, b) => {
    if (sortBy === 'alpha') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'energy') {
      return (parseInt(a.effort_level) || 0) - (parseInt(b.effort_level) || 0);
    }
    if (sortBy === 'budget') {
      return (parseInt(a.estimated_cost) || 0) - (parseInt(b.estimated_cost) || 0);
    }
    if (sortBy === 'distance') {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    }
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Sub-Tab Navigation Switcher */}
      <div style={{ display: 'flex', background: 'var(--bg-panel, rgba(30, 30, 30, 0.5))', padding: '0.4rem', borderRadius: '12px', width: 'fit-content', margin: '0 auto', gap: '0.25rem', border: '1px solid var(--border-color)' }}>
        <button 
          className={`btn ${subTab === 'draw' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSubTab('draw')}
          style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}
        >
          <CardsIcon size={16} /> Draw a Card
        </button>
        <button 
          className={`btn ${subTab === 'browse' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSubTab('browse')}
          style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}
        >
          <Compass size={16} /> Browse Activities ({activeActivities.length})
        </button>
      </div>

      {/* DRAW TAB */}
      {subTab === 'draw' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', width: '100%' }} className="animate-fade-in">
          {/* Filters */}
          <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Energy Level</label>
              <select className="input" value={energyFilter} onChange={e => setEnergyFilter(e.target.value)} style={{ minWidth: '150px' }}>
                <option value="any">Any</option>
                <option value="1">1 - Chill (Movie night)</option>
                <option value="2">2 - Moderate (Dinner out)</option>
                <option value="3">3 - High (Hiking, Event)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Budget</label>
              <select className="input" value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)} style={{ minWidth: '150px' }}>
                <option value="any">Any</option>
                <option value="1">$ - Free / Cheap</option>
                <option value="2">$$ - Moderate</option>
                <option value="3">$$$ - Expensive</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleDraw} style={{ padding: '1.5rem 3rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '50px', background: 'var(--accent-purple)', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)' }}>
            <CardsIcon size={32} /> Draw a Card
          </button>

          {noMatches && (
            <div style={{ color: 'var(--accent-pink)', marginTop: '1rem', fontWeight: 'bold' }}>
              No activities found matching your filters! Try adjusting them or adding a new activity.
            </div>
          )}

          {/* Drawn Card Modal */}
          {drawnItem && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div className="card glass-panel" style={{ padding: '3rem', borderRadius: '24px', maxWidth: '450px', width: '90%', textAlign: 'center', transform: 'scale(1.1)', border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', color: 'var(--accent-purple)', fontWeight: 700 }}>Activity Picked!</span>
                <h2 style={{ fontSize: '2rem', margin: '1rem 0', color: 'var(--text-primary)' }}>{drawnItem.title}</h2>
                {drawnItem.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    <MapPin size={14} /> {drawnItem.address.split(',').slice(0, 2).join(',')}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', color: 'var(--text-primary)', marginBottom: '2.5rem', background: 'var(--bg-panel)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Effort</span>
                    {renderEffort(drawnItem.effort_level)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Budget</span>
                    {renderBudget(drawnItem.estimated_cost)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn btn-ghost" onClick={() => setDrawnItem(null)} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>
                    Close
                  </button>
                  <button className="btn btn-primary" onClick={() => { handleOpenSchedule(drawnItem); setDrawnItem(null); }} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', background: 'var(--accent-purple)' }}>
                    Schedule Activity
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BROWSE TAB */}
      {subTab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }} className="animate-fade-in">
          
          {/* Top Panel: Sort Controls & Add Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-panel, rgba(30, 30, 30, 0.4))', padding: '0.35rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowUpDown size={14} /> Sort:
              </span>
              <button 
                onClick={() => setSortBy('alpha')}
                className={`btn ${sortBy === 'alpha' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px' }}
              >
                A-Z
              </button>
              <button 
                onClick={() => setSortBy('energy')}
                className={`btn ${sortBy === 'energy' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px' }}
              >
                Effort
              </button>
              <button 
                onClick={() => setSortBy('budget')}
                className={`btn ${sortBy === 'budget' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px' }}
              >
                Budget
              </button>
              <button 
                onClick={() => setSortBy('distance')}
                className={`btn ${sortBy === 'distance' ? 'btn-primary' : 'btn-ghost'}`}
                disabled={!refCoords}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px', opacity: refCoords ? 1 : 0.5 }}
                title={!refCoords ? "Configure a Home Location in Settings to sort by distance" : "Sort by nearest distance"}
              >
                Distance
              </button>
            </div>

            <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#fff' }}>
              <Plus size={18} /> Add Activity
            </button>
          </div>

          {/* Add Activity Form Panel */}
          {showAdd && (
            <div className="card glass-panel animate-fade-in" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Add New Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Form fields */}
                <div>
                  <label className="label">Activity Title</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Activity name (e.g. Cave Canoeing, Picnic, Laser Tag)" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                  />
                </div>

                <div style={{ height: '1px', background: 'var(--border-color)' }} />

                {/* Geocoding / Venue search input */}
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Find a Place to do this Activity</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. Lost River Caverns (Defaults to Activity Title)" 
                      value={placeQuery}
                      onChange={e => setPlaceQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearchPlaces(placeQuery || newTitle)}
                    />
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleSearchPlaces(placeQuery || newTitle)} 
                      disabled={isSearchingPlaces || (!placeQuery && !newTitle)}
                      style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {isSearchingPlaces ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      Search Places
                    </button>
                  </div>
                  
                  {placeResults.length > 0 && (
                    <div style={{
                      background: 'var(--bg-panel, #222)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      marginTop: '0.5rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                      textAlign: 'left'
                    }}>
                      {placeResults.map(place => (
                        <div 
                          key={place.place_id} 
                          onClick={() => handleSelectPlace(place)}
                          style={{
                            padding: '0.6rem 0.8rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            borderBottom: '1px solid var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                          onMouseEnter={e => e.target.style.background = 'var(--border-color)'}
                          onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                          {place.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="label">Effort Level</label>
                    <select className="input" value={newEnergy} onChange={e => setNewEnergy(e.target.value)}>
                      <option value="1">1 - Chill (Movie, Coffee)</option>
                      <option value="2">2 - Moderate (Dinner, Arcade)</option>
                      <option value="3">3 - Active (Hiking, Theme Park)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Estimated Budget</label>
                    <select className="input" value={newBudget} onChange={e => setNewBudget(e.target.value)}>
                      <option value="1">$ - Low / Free</option>
                      <option value="2">$$ - Moderate</option>
                      <option value="3">$$$ - High</option>
                    </select>
                  </div>
                </div>

                {selectedPlace && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                    <MapPin size={16} />
                    <div style={{ textAlign: 'left' }}>
                      <strong>Location Attached:</strong> {newTitle} ({newLatitude.toFixed(4)}, {newLongitude.toFixed(4)})
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{newAddress}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={handleAdd} disabled={!newTitle} style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#fff' }}>
                    Save Activity
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setSelectedPlace(null); setNewTitle(''); setNewAddress(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Activities list cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            {sortedActivities.map(activity => (
              <div 
                key={activity.id} 
                className="card glass-panel" 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  gap: '1rem',
                  border: '1px solid var(--border-color)',
                  transition: 'transform 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 600 }}>{activity.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {renderEffort(activity.effort_level)}
                    <span style={{ color: 'var(--border-color)', fontSize: '0.8rem' }}>•</span>
                    {renderBudget(activity.estimated_cost)}
                    
                    {activity.address && (
                      <>
                        <span style={{ color: 'var(--border-color)', fontSize: '0.8rem' }}>•</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }} title={activity.address}>
                          <MapPin size={12} /> {activity.address.split(',')[0]}
                        </span>
                      </>
                    )}

                    {activity.distance !== null && (
                      <>
                        <span style={{ color: 'var(--border-color)', fontSize: '0.8rem' }}>•</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                          {activity.distance.toFixed(1)} mi
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => handleOpenSchedule(activity)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderRadius: '8px' }}
                  >
                    <Calendar size={14} /> Schedule
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setDeletingItem(activity)}
                    style={{ padding: '0.4rem', color: 'var(--text-muted)', borderRadius: '8px' }}
                    title="Delete activity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {sortedActivities.length === 0 && (
              <div className="card" style={{ padding: '3rem', color: 'var(--text-muted)', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                No active activities found. Create one to get started!
              </div>
            )}
          </div>

        </div>
      )}

      {/* SCHEDULING DIALOG MODAL */}
      {schedulingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card glass-panel" style={{ padding: '2rem', borderRadius: '20px', maxWidth: '450px', width: '90%', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-purple)' }}>Schedule Activity</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Select a date and time to lock in <strong>{schedulingItem.title}</strong> onto your calendar. This removes it from the Draw pool.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label className="label flex items-center gap-1.5"><Clock size={14} /> Start Time</label>
                <input 
                  type="datetime-local" 
                  className="input" 
                  value={schedStart} 
                  onChange={e => setSchedStart(e.target.value)} 
                />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Clock size={14} /> End Time</label>
                <input 
                  type="datetime-local" 
                  className="input" 
                  value={schedEnd} 
                  onChange={e => setSchedEnd(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setSchedulingItem(null)} disabled={savingSchedule}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveSchedule} disabled={savingSchedule} style={{ background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>
                {savingSchedule ? 'Scheduling...' : 'Lock it In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETION CONFIRMATION MODAL */}
      {deletingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} className="animate-fade-in">
          <div className="card glass-panel" style={{ padding: '2rem', borderRadius: '20px', maxWidth: '400px', width: '90%', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <Trash2 size={48} style={{ color: '#ef4444', margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Delete Activity</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Are you sure you want to delete <strong>{deletingItem.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeletingItem(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleDelete} style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
