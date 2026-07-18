import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Plus, Trash2, Map, Star } from 'lucide-react';
import TripDashboard from './TripDashboard';

export default function TripPlannerMain({ activeUser }) {
  const [trips, setTrips] = useState([]);
  const [bucketDestinations, setBucketDestinations] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [newTripName, setNewTripName] = useState('');

  const fetchTripsAndDestinations = async () => {
    try {
      setLoading(true);
      const [tripsData, bucketData] = await Promise.all([
        api.get('/trips'),
        api.get('/bucket-list')
      ]);
      
      setTrips(tripsData);
      
      // Filter bucket list to only destinations
      const destinations = (bucketData || []).filter(item => item.item_type === 'destination');
      
      // Filter out destinations that already have a trip (naive matching by name or destination)
      const existingTripNames = new Set(tripsData.map(t => (t.name || '').toLowerCase()));
      const existingTripDests = new Set(tripsData.map(t => (t.destination || '').toLowerCase()));
      
      const unplannedDestinations = destinations.filter(dest => {
        const title = (dest.title || '').toLowerCase();
        return !existingTripNames.has(title) && !existingTripNames.has(`trip to ${title}`) && !existingTripDests.has(title);
      });
      
      setBucketDestinations(unplannedDestinations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeTripId) {
      fetchTripsAndDestinations();
    }
  }, [activeTripId]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!newTripName) return;
    
    await api.post('/trips', {
      name: newTripName, dates: '', destination: '', cover_photo: '', mood_tags: '', progress: 0
    });
    setIsCreatingTrip(false);
    setNewTripName('');
    fetchTripsAndDestinations();
  };

  const handleCreateFromBucketList = async (destinationTitle) => {
    try {
      const resp = await api.post('/trips', {
        name: `Trip to ${destinationTitle}`, 
        dates: '', 
        destination: destinationTitle, 
        cover_photo: '', 
        mood_tags: '', 
        progress: 0
      });
      if (resp.id) {
        setActiveTripId(resp.id);
      }
    } catch (err) {
      console.error("Failed to create trip from bucket list", err);
    }
  };

  const confirmDelete = async () => {
    if (tripToDelete) {
      await api.delete(`/trips/${tripToDelete}`);
      setTripToDelete(null);
      fetchTripsAndDestinations();
    }
  };

  if (activeTripId) {
    return <TripDashboard tripId={activeTripId} onBack={() => setActiveTripId(null)} activeUser={activeUser} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2" style={{ color: 'var(--accent-blue)', margin: 0 }}>
          <Map size={24} /> Trip Planner
        </h2>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setIsCreatingTrip(true)}>
          <Plus size={16} /> New Trip
        </button>
      </div>
      
      {loading ? (
        <div>Loading trips...</div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {trips.length === 0 && bucketDestinations.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted" style={{ background: 'var(--bg-panel)', borderRadius: '12px' }}>
              No trips planned and no destinations in your Bucket List. Click "New Trip" to get started!
            </div>
          ) : (
            <>
              {trips.map(trip => (
                <div key={trip.id} className="card hoverable cursor-pointer flex flex-col" onClick={() => setActiveTripId(trip.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 style={{ margin: 0 }}>{trip.name || 'Unnamed Trip'}</h3>
                    <button className="btn btn-outline" style={{ padding: '4px', border: 'none' }} onClick={(e) => { e.stopPropagation(); setTripToDelete(trip.id); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{trip.dates || 'Dates TBD'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{trip.destination || 'Destination TBD'}</div>
                  
                  <div className="mt-auto">
                    <div style={{ width: '100%', background: 'var(--bg-panel)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${trip.progress}%`, background: 'var(--accent-emerald)', height: '100%' }} />
                    </div>
                  </div>
                </div>
              ))}
              
              {bucketDestinations.map(dest => (
                <div 
                  key={dest.id} 
                  className="card hoverable cursor-pointer flex flex-col" 
                  style={{ border: '1px dashed var(--accent-orange)' }}
                  onClick={() => handleCreateFromBucketList(dest.title)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 style={{ margin: 0, color: 'var(--accent-orange)' }}>{dest.title}</h3>
                    <div style={{ background: 'var(--accent-orange)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      BUCKET LIST
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Click to start planning this trip!
                  </div>
                  <div className="mt-auto flex items-center gap-2" style={{ color: 'var(--accent-orange)', fontSize: '0.9rem' }}>
                    <Star size={16} /> Idea saved from Someday Board
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="modal-overlay flex-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div className="card glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>Delete Trip</h3>
            <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete this trip? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setTripToDelete(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmDelete} style={{ background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Trip Modal */}
      {isCreatingTrip && (
        <div className="modal-overlay flex-center animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div className="card glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>New Trip</h3>
            <form onSubmit={handleCreateTrip}>
              <div className="form-group">
                <label>Trip Name</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  placeholder="e.g. Summer in Tokyo" 
                  value={newTripName} 
                  onChange={e => setNewTripName(e.target.value)} 
                  autoFocus 
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setIsCreatingTrip(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
