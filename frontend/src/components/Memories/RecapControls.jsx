import React from 'react';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function RecapControls({ isMuted, setIsMuted, isPlaying, setIsPlaying, onClose }) {
  return (
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
  );
}
