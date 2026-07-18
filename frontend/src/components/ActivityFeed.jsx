import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

/**
 * A persistent ticker-tape feed at the bottom of the dashboard.
 * 
 * Why:
 * - Surfaces passive, ambient information (weather, news, quotes) without cluttering the main UI.
 * - Respects per-user settings to toggle specific feeds on/off.
 */
const QUOTES = [
  "Love is composed of a single soul inhabiting two bodies. - Aristotle",
  "The best thing to hold onto in life is each other. - Audrey Hepburn",
  "A successful marriage requires falling in love many times, always with the same person. - Mignon McLaughlin",
  "You don't love someone for their looks, or their clothes, or for their fancy car, but because they sing a song only you can hear. - Oscar Wilde",
  "To love and be loved is to feel the sun from both sides. - David Viscott",
  "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage. - Lao Tzu",
  "Grow old along with me! The best is yet to be. - Robert Browning",
  "The secret of a happy marriage is finding the right person. - Julia Child"
];

const getWeatherDescription = (code) => {
  if (code === 0) return { text: 'Clear sky', emoji: '☀️' };
  if (code === 1) return { text: 'Mainly clear', emoji: '🌤️' };
  if (code === 2) return { text: 'Partly cloudy', emoji: '⛅' };
  if (code === 3) return { text: 'Overcast', emoji: '☁️' };
  if ([45, 48].includes(code)) return { text: 'Fog', emoji: '🌫️' };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: 'Drizzle', emoji: '🌧️' };
  if ([61, 63, 65, 66, 67].includes(code)) return { text: 'Rain', emoji: '🌧️' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: 'Snow', emoji: '❄️' };
  if ([80, 81, 82].includes(code)) return { text: 'Showers', emoji: '🌦️' };
  if ([95, 96, 99].includes(code)) return { text: 'Thunderstorm', emoji: '⛈️' };
  return { text: 'Unknown', emoji: '🌡️' };
};

const ActivityFeed = ({ activeUser }) => {
  const [messages, setMessages] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const lastScrollY = useRef(window.scrollY);

  useEffect(() => {
    let active = true;

    const loadFeedData = async () => {
      try {
        // 1. Fetch settings
        const settingsData = await api.getSettings();
        const findSetting = (k, d) => settingsData.find(s => s.key === k)?.value || d;
        
        const zip = findSetting('weather_zipcode', '60601');
        const currentUser = activeUser || 'user1';
        let prefs = {
          appointment: true, goal: true, project: true,
          weather: true, quote: true, news: true
        };
        const prefsStr = findSetting(`activity_feed_preferences_${currentUser}`, '');
        if (prefsStr) {
          try { 
            const savedPrefs = JSON.parse(prefsStr); 
            prefs = { ...prefs, ...savedPrefs };
          } catch(e) {}
        }

        const newMessages = [];

        // 2. Quote
        if (prefs.quote) {
          // Use local date string to generate a daily static index
          const today = new Date().toLocaleDateString();
          let hash = 0;
          for (let i = 0; i < today.length; i++) {
            hash = today.charCodeAt(i) + ((hash << 5) - hash);
          }
          const quoteIndex = Math.abs(hash) % QUOTES.length;
          const dailyQuote = QUOTES[quoteIndex];
          newMessages.push(`✨ <strong>Quote of the Day:</strong> ${dailyQuote}`);
        }

        // 3. Weather
        if (prefs.weather) {
          try {
            const geoRes = await fetch(`https://api.zippopotam.us/us/${zip || '60601'}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const lat = geoData.places[0].latitude;
              const lon = geoData.places[0].longitude;
              const city = geoData.places[0]['place name'];
              const state = geoData.places[0]['state abbreviation'];
              
              const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`);
              const weatherData = await weatherRes.json();
              const current = weatherData.current_weather;
              const info = getWeatherDescription(current.weathercode);
              newMessages.push(`${info.emoji} <strong>Current Weather:</strong> ${Math.round(current.temperature)}°F, ${info.text} in ${city}, ${state}`);
            } else {
              newMessages.push(`🌡️ <strong>Weather:</strong> Invalid Zip Code (${zip})`);
            }
          } catch(err) {
            newMessages.push(`🌡️ <strong>Weather:</strong> Unavailable`);
          }
        }

        // 4. Breaking News
        if (prefs.news) {
          try {
            const newsRes = await fetch('https://api.rss2json.com/v1/api.json?rss_url=http://feeds.bbci.co.uk/news/world/rss.xml');
            const newsData = await newsRes.json();
            if (newsData.items && newsData.items.length > 0) {
              newMessages.push(`📰 <strong>Breaking News:</strong> ${newsData.items[0].title}`);
            }
          } catch(err) {}
        }

        // 5. Internal Activity
        try {
          const actData = await api.getRecentActivity();
          const currentUser = activeUser || 'user1';
          const oppositeUser = currentUser === 'user1' ? 'user2' : 'user1';
          
          for (const item of actData) {
            if (item.type === 'appointment' && prefs.appointment && item.user_id === oppositeUser) newMessages.push(item.text);
            if (item.type === 'goal' && prefs.goal && item.user_id === oppositeUser) newMessages.push(item.text);
            if (item.type === 'project' && prefs.project && item.user_id === oppositeUser) newMessages.push(item.text);
          }
        } catch(err) {}

        // No default fallback message needed.

        if (active) {
          setMessages(newMessages);
          setMessageIndex(0);
        }

      } catch (err) {
        console.error('Feed error:', err);
      }
    };

    loadFeedData();
    
    const handleRefresh = () => {
      loadFeedData();
    };
    window.addEventListener('app-refresh', handleRefresh);

    return () => { 
      active = false; 
      window.removeEventListener('app-refresh', handleRefresh);
    };
  }, [activeUser]);

  // Cycle messages every 12 seconds
  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Listen for scroll events to hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current + 10) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsVisible(true);
      }
      
      if (currentScrollY <= 10) {
        setIsVisible(true);
      }

      if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
         lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className={`activity-feed-container ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="activity-feed-content centered">
        <span 
          key={messageIndex} 
          className="activity-feed-text fade-in-out" 
          dangerouslySetInnerHTML={{ __html: messages[messageIndex] }} 
        />
      </div>
    </div>
  );
};

export default ActivityFeed;
