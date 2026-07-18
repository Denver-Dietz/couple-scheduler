import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import ActivitiesTab from './ActivitiesTab';
import DestinationsTab from './DestinationsTab';

/**
 * Main wrapper for the unified Bucket List.
 * 
 * Why:
 * - Separates local activities (restaurants, museums) from major travel destinations
 *   so the UI doesn't conflate a Friday night dinner with a 2-week trip to Japan.
 */
export default function BucketListMain({ activeUser }) {
  const [tab, setTab] = useState('activities'); // 'activities', 'destinations'
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems();
  }, [tab]);

  const fetchItems = async () => {
    try {
      const res = await api.get('/bucket-list');
      setItems(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', minHeight: '80vh' }}>
      <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button 
          className={`btn ${tab === 'activities' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setTab('activities')}
        >
          Activities
        </button>
        <button 
          className={`btn ${tab === 'destinations' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => setTab('destinations')}
        >
          Destinations
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {tab === 'activities' && <ActivitiesTab items={items.filter(i => i.item_type === 'activity')} refresh={fetchItems} />}
        {tab === 'destinations' && <DestinationsTab items={items.filter(i => i.item_type === 'destination')} refresh={fetchItems} />}
      </div>
    </div>
  );
}
