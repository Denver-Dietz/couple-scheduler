import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Bot, Key, Clock, Users, Save, RefreshCw, User, Activity, Settings } from 'lucide-react';

/**
 * Global Configuration Panel.
 * 
 * Why:
 * - Centralizes critical integration keys (Gemini, Telegram) and user preferences.
 * - Controls the background Python `bot.py` process directly via the `/api/bot/restart` endpoint.
 */
export default function SettingsPanel({ activeUser }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const currentUser = activeUser || 'user1';
  
  const [botState, setBotState] = useState('stopped'); // 'stopped', 'starting', 'running'
  const [geminiKey, setGeminiKey] = useState('');
  const [maptilerKey, setMaptilerKey] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState('');
  
  const [u1Name, setU1Name] = useState('User 1');
  const [u1Token, setU1Token] = useState('');
  const [u1Theme, setU1Theme] = useState('dark');
  
  const [u2Name, setU2Name] = useState('User 2');
  const [u2Token, setU2Token] = useState('');
  const [u2Theme, setU2Theme] = useState('dark');

  const [weatherZip, setWeatherZip] = useState('');
  
  // Home coordinates for calculating distances of local activities
  const [homeAddress, setHomeAddress] = useState('');
  const [homeLat, setHomeLat] = useState(null);
  const [homeLng, setHomeLng] = useState(null);
  const [homeSearchResults, setHomeSearchResults] = useState([]);
  const [searchingHome, setSearchingHome] = useState(false);
  const [homeLocChanged, setHomeLocChanged] = useState(false);
  const [noHomeMatches, setNoHomeMatches] = useState(false);

  const [feedPrefs, setFeedPrefs] = useState({
    appointment: true, goal: true, project: true, weather: true, quote: true, news: true
  });

  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const refreshBotStatus = async () => {
    try {
      const botStatus = await api.getBotStatus();
      setBotState(botStatus.status || (botStatus.running ? 'running' : 'stopped'));
    } catch (err) {
      console.error('Failed to get bot status:', err);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const s = await api.getSettings();
        const find = (k, d) => s.find(setting => setting.key === k)?.value || d;
        
        setGeminiKey(find('gemini_api_key', ''));
        setMaptilerKey(find('maptiler_api_key', 'J6Q9BvE0gL7zV8xP4nC3'));
        setAuthorizedUsers(find('authorized_users', ''));
        
        setU1Name(find('user1_name', 'User 1'));
        setU1Token(find('user1_telegram_bot_token', ''));
        setU1Theme(find('user1_theme', 'dark'));
        
        setU2Name(find('user2_name', 'User 2'));
        setU2Token(find('user2_telegram_bot_token', ''));
        setU2Theme(find('user2_theme', 'dark'));
        
        setWeatherZip(find('weather_zipcode', ''));
        setHomeAddress(find('home_address', ''));
        setHomeLat(parseFloat(find('home_latitude', '0')) || null);
        setHomeLng(parseFloat(find('home_longitude', '0')) || null);
        const prefsStr = find(`activity_feed_preferences_${currentUser}`, '');
        if (prefsStr) {
          try {
            const loadedPrefs = JSON.parse(prefsStr);
            // Clean up old keys
            const validKeys = ['appointment', 'goal', 'project', 'weather', 'quote', 'news'];
            const filteredPrefs = {};
            validKeys.forEach(k => {
              if (loadedPrefs[k] !== undefined) filteredPrefs[k] = loadedPrefs[k];
            });
            setFeedPrefs(prev => ({ ...prev, ...filteredPrefs }));
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
      refreshBotStatus();
    }
    load();

    // Listen to real-time events to update the bot status dynamically
    window.addEventListener('app-refresh', refreshBotStatus);
    return () => window.removeEventListener('app-refresh', refreshBotStatus);
  }, []);

  // Autocomplete search as you type
  useEffect(() => {
    if (!homeLocChanged || !homeAddress || homeAddress.length < 3) {
      setHomeSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingHome(true);
      setNoHomeMatches(false);
      try {
        const data = await api.get(`/geocoding/search?q=${encodeURIComponent(homeAddress)}`);
        setHomeSearchResults(data || []);
        setNoHomeMatches(!data || data.length === 0);
      } catch (e) {
        console.error('Home geocoding autocomplete error:', e);
      } finally {
        setSearchingHome(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [homeAddress, homeLocChanged]);

  const handleSearchHome = async () => {
    if (!homeAddress) return;
    setSearchingHome(true);
    setNoHomeMatches(false);
    setHomeSearchResults([]);
    try {
      const data = await api.get(`/geocoding/search?q=${encodeURIComponent(homeAddress)}`);
      setHomeSearchResults(data || []);
      setNoHomeMatches(!data || data.length === 0);
    } catch(e) {
      console.error('Home geocoding search error:', e);
    } finally {
      setSearchingHome(false);
    }
  };

  const handleSelectHome = (res) => {
    setHomeAddress(res.display_name);
    setHomeLat(parseFloat(res.lat));
    setHomeLng(parseFloat(res.lon));
    setHomeSearchResults([]);
    setHomeLocChanged(false);
    setNoHomeMatches(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatus('');
      const settings = [
        { key: 'gemini_api_key', value: geminiKey },
        { key: 'maptiler_api_key', value: maptilerKey },
        { key: 'authorized_users', value: authorizedUsers },
        { key: 'user1_name', value: u1Name },
        { key: 'user1_telegram_bot_token', value: u1Token },
        { key: 'user1_theme', value: u1Theme },
        { key: 'user2_name', value: u2Name },
        { key: 'user2_telegram_bot_token', value: u2Token },
        { key: 'user2_theme', value: u2Theme },
        { key: 'weather_zipcode', value: weatherZip },
        { key: 'home_address', value: homeAddress },
        { key: 'home_latitude', value: homeLat ? String(homeLat) : '' },
        { key: 'home_longitude', value: homeLng ? String(homeLng) : '' },
        { key: `activity_feed_preferences_${currentUser}`, value: JSON.stringify(feedPrefs) }
      ];
      await api.setSettingsBulk(settings);
      setStatus('All settings saved!');
    } catch (err) {
      setStatus('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRestartBot = async () => {
    try {
      setRestarting(true);
      setStatus('');
      const result = await api.restartBot();
      setBotState(result.status);
      if (result.status === 'restarting') {
        setStatus('Restarting bots in background...');
      } else {
        setStatus(result.status === 'running' ? 'Bots restarted!' : 'Bots failed to start.');
      }
    } catch (err) {
      setStatus('Failed to restart bot: ' + err.message);
    } finally {
      setRestarting(false);
    }
  };

  const updateFeedPref = async (key, checked) => {
    const newPrefs = { ...feedPrefs, [key]: checked };
    setFeedPrefs(newPrefs);
    try {
      await api.setSetting(`activity_feed_preferences_${currentUser}`, JSON.stringify(newPrefs));
      window.dispatchEvent(new Event('app-refresh'));
    } catch(e) {}
  };

  if (showAdvanced) {
    return (
      <div className="flex flex-col gap-6">
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowAdvanced(false)}
          style={{ alignSelf: 'flex-start' }}
        >
          ← Back to Profile Settings
        </button>

        {/* Bot Status & System Settings */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
            <h3 className="flex items-center gap-2">
              <Bot size={20} /> System & Bots
            </h3>
            <div className="flex items-center gap-4">
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600,
                backgroundColor: botState === 'running' ? 'rgba(16, 185, 129, 0.15)' : botState === 'starting' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: botState === 'running' ? 'var(--accent-emerald)' : botState === 'starting' ? '#f59e0b' : '#ef4444',
                border: `1px solid ${botState === 'running' ? 'rgba(16, 185, 129, 0.3)' : botState === 'starting' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: botState === 'running' ? 'var(--accent-emerald)' : botState === 'starting' ? '#f59e0b' : '#ef4444'
                }} />
                {botState === 'running' ? 'Running' : botState === 'starting' ? 'Starting...' : 'Stopped'}
              </span>
              <button className="btn btn-outline" onClick={handleRestartBot} disabled={restarting}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>
                <RefreshCw size={14} style={restarting || botState === 'starting' ? { animation: 'spin 1s linear infinite' } : {}} />
                {restarting || botState === 'starting' ? 'Restarting...' : 'Restart Bots'}
              </button>
            </div>
          </div>
          
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label className="label flex items-center gap-2"><Key size={14}/> Gemini API Key</label>
              <input type="password" className="input" value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)} placeholder="AIzaSy..." />
            </div>
            <div>
              <label className="label flex items-center gap-2"><Key size={14}/> MapTiler API Key</label>
              <input type="password" className="input" value={maptilerKey}
                onChange={e => setMaptilerKey(e.target.value)} placeholder="MapTiler API Key" />
            </div>
            <div>
              <label className="label flex items-center gap-2"><Users size={14}/> Authorized Telegram User IDs</label>
              <input type="text" className="input" value={authorizedUsers}
                onChange={e => setAuthorizedUsers(e.target.value)} placeholder="comma-separated" />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}
            style={{ padding: '0.6rem 1.5rem' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
          {status && <span style={{
            color: status.includes('Failed') ? '#ef4444' : 'var(--accent-emerald)',
            fontWeight: 500, fontSize: '0.9rem'
          }}>{status}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Active User Profile */}
        {currentUser === 'user1' && (
          <div className="card" style={{ borderTop: '4px solid var(--accent-emerald)' }}>
            <h3 className="flex items-center gap-2" style={{ marginBottom: '1.5rem', color: 'var(--accent-emerald)' }}>
              <User size={20} /> My Profile
            </h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Name</label>
                <input type="text" className="input" value={u1Name} onChange={e => setU1Name(e.target.value)} />
              </div>
              <div>
                <label className="label">Personal Bot Token</label>
                <input type="password" className="input" value={u1Token} onChange={e => setU1Token(e.target.value)} 
                  placeholder="From @BotFather" />
              </div>
              <div>
                <label className="label">Preferred Theme</label>
                <select className="input" value={u1Theme} onChange={e => {
                  setU1Theme(e.target.value);
                  document.documentElement.className = e.target.value;
                }}>
                  <option value="dark">Dark Mode</option>
                  <option value="theme-ocean">Ocean Glare</option>
                  <option value="theme-sunset">Sunset Glass</option>
                  <option value="theme-light">Minimal Light</option>
                  <option value="theme-neon-green">Neon Green</option>
                  <option value="theme-neon-purple">Neon Purple</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentUser === 'user2' && (
          <div className="card" style={{ borderTop: '4px solid var(--accent-purple)' }}>
            <h3 className="flex items-center gap-2" style={{ marginBottom: '1.5rem', color: 'var(--accent-purple)' }}>
              <User size={20} /> My Profile
            </h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Name</label>
                <input type="text" className="input" value={u2Name} onChange={e => setU2Name(e.target.value)} />
              </div>
              <div>
                <label className="label">Personal Bot Token</label>
                <input type="password" className="input" value={u2Token} onChange={e => setU2Token(e.target.value)} 
                  placeholder="From @BotFather" />
              </div>
              <div>
                <label className="label">Preferred Theme</label>
                <select className="input" value={u2Theme} onChange={e => {
                  setU2Theme(e.target.value);
                  document.documentElement.className = e.target.value;
                }}>
                  <option value="dark">Dark Mode</option>
                  <option value="theme-ocean">Ocean Glare</option>
                  <option value="theme-sunset">Sunset Glass</option>
                  <option value="theme-light">Minimal Light</option>
                  <option value="theme-neon-green">Neon Green</option>
                  <option value="theme-neon-purple">Neon Purple</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Banner, Location & Activity Feed Settings */}
      <div className="card" style={{ borderTop: '4px solid var(--accent-blue)', position: 'relative' }}>
        <h3 className="flex items-center gap-2" style={{ marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>
          <Activity size={20} /> Banner, Location & Activity Feed
        </h3>
        
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 flex-wrap" style={{ alignItems: 'flex-start' }}>
            <div>
              <label className="label">Weather Zip Code (US)</label>
              <input type="text" className="input" value={weatherZip} onChange={e => setWeatherZip(e.target.value)} 
                placeholder="e.g. 90210" style={{ maxWidth: '150px' }} />
            </div>
            
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <label className="label">Home / Reference Location (for sorting activities by distance)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input" 
                  value={homeAddress} 
                  onChange={e => {
                    setHomeAddress(e.target.value);
                    setHomeLocChanged(true);
                    setNoHomeMatches(false);
                  }} 
                  placeholder="Type city or address..." 
                />
                <button 
                  className="btn btn-outline" 
                  onClick={handleSearchHome} 
                  disabled={searchingHome || !homeAddress}
                  style={{ fontSize: '0.85rem' }}
                >
                  {searchingHome ? 'Searching...' : 'Search'}
                </button>
              </div>
              {noHomeMatches && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-pink, #f43f5e)', marginTop: '0.25rem', textAlign: 'left' }}>
                  No matches found. Try entering a city name or ZIP code.
                </div>
              )}
              {homeSearchResults.length > 0 && (
                <div style={{
                  background: 'var(--bg-panel, #222)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  borderRadius: '8px',
                  marginTop: '0.5rem',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 200,
                  position: 'absolute',
                  width: '100%',
                  left: 0
                }}>
                  {homeSearchResults.map(res => (
                    <div 
                      key={res.place_id} 
                      onClick={() => handleSelectHome(res)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                        color: 'var(--text-primary)',
                        textAlign: 'left'
                      }}
                      onMouseEnter={e => e.target.style.background = 'var(--border-color)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                      {res.display_name}
                    </div>
                  ))}
                </div>
              )}
              {homeLat && homeLng && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'left' }}>
                  Coordinates Configured: {homeLat.toFixed(4)}, {homeLng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="label" style={{ marginBottom: '0.75rem' }}>Items to Display in Feed</label>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {Object.keys(feedPrefs).map(key => (
                <label key={key} className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={feedPrefs[key]} 
                    onChange={e => updateFeedPref(key, e.target.checked)} 
                    style={{ accentColor: 'var(--accent-blue)', width: '1.2rem', height: '1.2rem' }} />
                  <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                    {key.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}
            style={{ padding: '0.6rem 1.5rem' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
          {status && <span style={{
            color: status.includes('Failed') ? '#ef4444' : 'var(--accent-emerald)',
            fontWeight: 500, fontSize: '0.9rem'
          }}>{status}</span>}
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowAdvanced(true)}
          disabled={currentUser === 'user2'}
          style={{ opacity: currentUser === 'user2' ? 0.5 : 1, cursor: currentUser === 'user2' ? 'not-allowed' : 'pointer' }}
          title={currentUser === 'user2' ? "Only User 1 can access advanced settings" : "Advanced System Settings"}
        >
          <Settings size={16} /> Advanced Settings
        </button>
      </div>
    </div>
  );
}
