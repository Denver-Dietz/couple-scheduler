import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import OverviewPanel from './OverviewPanel';
import ItineraryPanel from './ItineraryPanel';
import WishlistPanel from './WishlistPanel';
import BudgetPanel from './BudgetPanel';
import LogisticsPanel from './LogisticsPanel';
import MapPanel from './MapPanel';
import { ArrowLeft } from 'lucide-react';

export default function TripDashboard({ tripId, onBack, activeUser }) {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrip = async () => {
    try {
      const data = await api.get(`/trips/${tripId}`);
      setTripData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
    const interval = setInterval(fetchTrip, 5000); // Simple real-time sync polling
    return () => clearInterval(interval);
  }, [tripId]);

  if (loading || !tripData) return <div className="p-4">Loading Trip...</div>;

  return (
    <div className="flex flex-col gap-4 h-full" style={{ minHeight: 'calc(100vh - 150px)' }}>
      <div className="flex items-center gap-4">
        <button className="btn btn-secondary flex items-center gap-2" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Trips
        </button>
        <h2 style={{ color: 'var(--accent-blue)', margin: 0 }}>{tripData.name || 'Unnamed Trip'}</h2>
      </div>

      {/* 2-Column, 3-Row Grid */}
      <div className="grid h-full" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1.5rem',
        flex: 1
      }}>
        {/* Row 1 */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <OverviewPanel tripData={tripData} refresh={fetchTrip} activeUser={activeUser} />
        </div>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <ItineraryPanel tripData={tripData} refresh={fetchTrip} activeUser={activeUser} />
        </div>
        
        {/* Row 2 */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <WishlistPanel tripData={tripData} refresh={fetchTrip} activeUser={activeUser} />
        </div>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <BudgetPanel tripData={tripData} refresh={fetchTrip} activeUser={activeUser} />
        </div>

        {/* Row 3 */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <LogisticsPanel tripData={tripData} refresh={fetchTrip} activeUser={activeUser} />
        </div>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <MapPanel tripData={tripData} refresh={fetchTrip} activeUser={activeUser} />
        </div>
      </div>
    </div>
  );
}
