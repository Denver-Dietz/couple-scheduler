import React, { useState } from 'react';
import { api } from '../../utils/api';
import { DollarSign, Plus, Trash2 } from 'lucide-react';

export default function BudgetPanel({ tripData, refresh, activeUser }) {
  const [category, setCategory] = useState('');
  const [estimated, setEstimated] = useState('');
  const budget = tripData.budget || [];

  const handleAdd = async () => {
    if (!category || !estimated) return;
    await api.post(`/trips/${tripData.id}/budget`, {
      category, estimated: parseFloat(estimated), actual: 0, paid_by: 'Shared'
    });
    setCategory('');
    setEstimated('');
    refresh();
  };

  const handleDelete = async (itemId) => {
    await api.delete(`/trips/budget/${itemId}`);
    refresh();
  };

  const totalEst = budget.reduce((sum, i) => sum + i.estimated, 0);
  const totalAct = budget.reduce((sum, i) => sum + i.actual, 0);

  return (
    <div className="card h-full flex flex-col gap-4">
      <h3 style={{ color: 'var(--accent-emerald)', margin: 0 }}>Budget</h3>
      
      <div className="flex justify-between items-center p-3" style={{ background: 'var(--bg-panel)', borderRadius: '8px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${totalEst.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Actual</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: totalAct > totalEst ? '#ef4444' : 'var(--accent-emerald)' }}>${totalAct.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 mt-2">
        {budget.map(item => (
          <div key={item.id} className="p-3 flex items-center justify-between" style={{ background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: 500 }}>{item.category}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est: ${item.estimated} • Act: ${item.actual}</div>
            </div>
            <button onClick={() => handleDelete(item.id)} className="btn btn-outline" style={{ padding: '4px', border: 'none' }}><Trash2 size={14}/></button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-auto" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <input className="input" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} style={{ flex: 1 }} />
        <input className="input" type="number" placeholder="Est $" value={estimated} onChange={e => setEstimated(e.target.value)} style={{ width: '80px' }} />
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16}/></button>
      </div>
    </div>
  );
}
