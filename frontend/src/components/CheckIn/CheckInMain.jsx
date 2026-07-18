import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import CheckInForm from './CheckInForm';
import CheckInPending from './CheckInPending';
import CheckInDashboard from './CheckInDashboard';

/**
 * Main Check-In container logic.
 * 
 * Why:
 * - Manages the complex 3-state flow of monthly relationship check-ins:
 *   1. Form (unsubmitted)
 *   2. Pending (waiting for partner)
 *   3. Dashboard (both submitted, showing results)
 * - Listens to the global `app-refresh` event to update state in real-time if the partner submits
 *   their form via the Telegram bot, avoiding a redundant SSE connection.
 */
export default function CheckInMain({ activeUser, u1Name, u2Name }) {
  const [loading, setLoading] = useState(true);
  const [checkinData, setCheckinData] = useState(null);

  const myName = activeUser === 'user1' ? u1Name : u2Name;
  const partnerName = activeUser === 'user1' ? u2Name : u1Name;

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getCurrentCheckIn(activeUser);
      setCheckinData(data);
    } catch (e) {
      console.error("Failed to fetch checkin status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Listen to global app-refresh instead of maintaining a separate SSE connection
    window.addEventListener('app-refresh', fetchStatus);
    return () => window.removeEventListener('app-refresh', fetchStatus);
  }, [activeUser]);

  if (loading) return <div>Loading Check-In...</div>;
  if (!checkinData) return <div>Failed to load Check-In data.</div>;

  const { status, has_submitted, checkin } = checkinData;

  if (status === 'completed') {
    return <CheckInDashboard activeUser={activeUser} monthYear={checkin.month_year} myName={myName} partnerName={partnerName} />;
  }

  if (has_submitted) {
    return <CheckInPending onRefresh={fetchStatus} partnerName={partnerName} />;
  }

  return <CheckInForm activeUser={activeUser} onComplete={fetchStatus} partnerName={partnerName} />;
}
