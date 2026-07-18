import React from 'react';
import { Lock } from 'lucide-react';

export default function CheckInPending({ onRefresh, partnerName }) {
  return (
    <div className="card glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: '50%', marginBottom: '2rem' }}>
        <Lock size={64} color="var(--accent-purple)" />
      </div>
      
      <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Results Locked</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
        You've completed your check-in! We are waiting for {partnerName} to complete their check-in to reveal the results.
      </p>
      
      <button className="btn btn-ghost" onClick={onRefresh} style={{ color: 'var(--accent-purple)' }}>
        Refresh Status
      </button>
    </div>
  );
}
