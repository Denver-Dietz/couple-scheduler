import React, { useState, useEffect, useRef } from 'react';
import { api, BACKEND_URL } from '../../utils/api';
import RecapControls from './RecapControls';
import RecapProgressBar from './RecapProgressBar';
import RecapSlide from './RecapSlide';

export default function RecapViewer({ onClose }) {
  const [recapData, setRecapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchRecap = async () => {
      try {
        const res = await api.get('/memories/recap');
        setRecapData(res.recap || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchRecap();
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && recapData.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= recapData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000); // 5 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isPlaying, recapData.length]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play blocked", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Generating your recap...</div>;

  if (recapData.length === 0) {
    return (
      <div className="card glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>No Recap Available</h3>
        <p style={{ color: 'var(--text-muted)' }}>Not enough memories to generate a recap yet.</p>
        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  const currentMemory = recapData[currentIndex];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'black',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {/* Audio Element */}
      <audio 
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
        loop
        muted={isMuted}
      />

      <RecapControls
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onClose={onClose}
      />

      <RecapProgressBar
        currentIndex={currentIndex}
        totalLength={recapData.length}
      />

      {/* The Slides */}
      {recapData.map((memory, index) => (
        <RecapSlide
          key={memory.id}
          memory={memory}
          index={index}
          currentIndex={currentIndex}
        />
      ))}
    </div>
  );
}
