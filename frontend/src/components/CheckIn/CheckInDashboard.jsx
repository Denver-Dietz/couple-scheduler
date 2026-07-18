import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function CheckInDashboard({ activeUser, monthYear, myName, partnerName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const resultData = await api.getCheckInResults(monthYear, activeUser);
        setData(resultData);
      } catch (e) {
        console.error("Failed to fetch results", e);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [activeUser, monthYear]);

  if (loading) return <div>Loading Results...</div>;
  if (!data || data.locked) return <div>Results are locked or unavailable.</div>;

  const userResponse = data.responses.find(r => r.user_id === activeUser);
  const partnerResponse = data.responses.find(r => r.user_id !== activeUser);

  const categories = [
    { key: 'communication_score', label: 'Communication' },
    { key: 'intimacy_score', label: 'Intimacy' },
    { key: 'quality_time_score', label: 'Quality Time' },
    { key: 'teamwork_score', label: 'Teamwork' }
  ];

  const renderComparisonRow = (cat) => {
    const myScore = userResponse[cat.key];
    const partnerScore = partnerResponse[cat.key];
    const diff = Math.abs(myScore - partnerScore);
    const isSignificant = diff >= 3;

    return (
      <div key={cat.key} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '1rem', 
        borderBottom: '1px solid var(--border-color)',
        background: isSignificant ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
      }}>
        <div style={{ flex: 1, fontWeight: 'bold' }}>
          {cat.label}
          {isSignificant && <AlertCircle size={16} color="var(--accent-red)" style={{ display: 'inline', marginLeft: '0.5rem', verticalAlign: 'text-bottom' }} />}
        </div>
        <div style={{ width: '80px', textAlign: 'center', color: 'var(--accent-emerald)' }}>{myScore}</div>
        <div style={{ width: '80px', textAlign: 'center', color: 'var(--accent-purple)' }}>{partnerScore}</div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>{monthYear} Results</h2>
        
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1 }}>Category</div>
          <div style={{ width: '80px', textAlign: 'center' }}>{myName}</div>
          <div style={{ width: '80px', textAlign: 'center' }}>{partnerName}</div>
        </div>
        
        {categories.map(renderComparisonRow)}
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{myName}'s Notes</h4>
            <p style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', minHeight: '80px' }}>
              {userResponse.notes || 'No notes provided.'}
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{partnerName}'s Notes</h4>
            <p style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', minHeight: '80px' }}>
              {partnerResponse.notes || 'No notes provided.'}
            </p>
          </div>
        </div>
      </div>

      <div className="card glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>6-Month Trend (Average)</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month_year" stroke="var(--text-muted)" />
              <YAxis domain={[1, 10]} stroke="var(--text-muted)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }} />
              <Legend />
              <Line type="monotone" dataKey="overall_avg" name="Overall Avg" stroke="var(--accent-purple)" strokeWidth={3} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="avg_comm" name="Comm." stroke="#10b981" />
              <Line type="monotone" dataKey="avg_intimacy" name="Intimacy" stroke="#ef4444" />
              <Line type="monotone" dataKey="avg_quality" name="Quality Time" stroke="#f59e0b" />
              <Line type="monotone" dataKey="avg_team" name="Teamwork" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
