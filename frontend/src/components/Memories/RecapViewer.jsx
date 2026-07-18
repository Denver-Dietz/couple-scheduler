import React, { useState, useEffect, useRef } from 'react';
import { api, BACKEND_URL } from '../../utils/api';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

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

      {/* Controls */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1001, display: 'flex', gap: '1rem' }}>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '0.5rem' }} onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '0.5rem' }} onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '0.5rem' }} onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '4px', background: 'rgba(255,255,255,0.2)', zIndex: 1001 }}>
        <div style={{ 
          height: '100%', 
          background: 'white', 
          width: `${((currentIndex + 1) / recapData.length) * 100}%`,
          transition: 'width 0.5s ease'
        }}></div>
      </div>

      {/* The Slides */}
      {recapData.map((memory, index) => (
        <div 
          key={memory.id}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* Ken Burns effect via CSS animation inline (or injected style) */}
          <style>
            {`
              @keyframes kenburns-${memory.id} {
                0% { transform: scale(1) translate(0, 0); }
                100% { transform: scale(1.1) translate(${index % 2 === 0 ? '-2%' : '2%'}, ${index % 3 === 0 ? '2%' : '-2%'}); }
              }
            `}
          </style>
          
          <img 
            src={`${BACKEND_URL}${memory.storage_url}`} 
            alt="Memory"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              animation: index === currentIndex ? `kenburns-${memory.id} 10s ease-out forwards` : 'none'
            }}
          />
          
          {/* Caption Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '10%',
            left: '10%',
            right: '10%',
            textAlign: 'center',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            padding: '2rem',
            borderRadius: '12px'
          }}>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0' }}>{new Date(memory.captured_at + 'Z').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
            <p style={{ fontSize: '1.5rem', margin: 0 }}>{memory.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
