import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import ScheduleDateModal from './ScheduleDateModal';

export default function RandomDate({ onBack, datesData, onSchedule, activeUser }) {
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentIdea, setCurrentIdea] = useState(null);
  const [shuffledOnce, setShuffledOnce] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const intervalRef = useRef(null);

  const imagesWithIdeas = datesData.ideas.filter(i => i.hasImage);

  const startShuffle = () => {
    if (imagesWithIdeas.length === 0) return;
    setIsShuffling(true);
    setShuffledOnce(true);
    
    intervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * imagesWithIdeas.length);
      setCurrentIdea(imagesWithIdeas[randomIndex]);
    }, 100);
  };

  const stopShuffle = () => {
    setIsShuffling(false);
    clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onBack} className="btn btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, color: 'var(--accent-emerald)' }}>Random Date</h2>
      </div>

      <div className="card" style={{ padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {currentIdea ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <img 
              src={currentIdea.imageUrl} 
              alt={currentIdea.title} 
              style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px' }} 
            />
            {!isShuffling && (
              <>
                <h3 style={{ margin: 0 }}>{currentIdea.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{currentIdea.description}</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Click Shuffle to find a date idea!
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button 
          className="btn btn-primary" 
          onClick={startShuffle}
          style={{ flex: 1, ...(isShuffling ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
        >
          {shuffledOnce && !isShuffling ? 'Shuffle Again' : 'Shuffle'}
        </button>
        
        <button 
          className="btn" 
          onClick={stopShuffle}
          disabled={!isShuffling}
          style={{ flex: 1, background: isShuffling ? 'var(--accent-purple)' : 'var(--bg-color)', color: isShuffling ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)', ...( !isShuffling ? { opacity: 0.5 } : {}) }}
        >
          Stop
        </button>

        <button 
          className="btn" 
          onClick={() => setShowModal(true)}
          disabled={isShuffling || !shuffledOnce}
          style={{ flex: 1, background: (!isShuffling && shuffledOnce) ? 'var(--accent-emerald)' : 'var(--bg-color)', color: (!isShuffling && shuffledOnce) ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)', ...( (isShuffling || !shuffledOnce) ? { opacity: 0.5 } : {}) }}
        >
          Make it a Date
        </button>
      </div>

      {showModal && currentIdea && (
        <ScheduleDateModal 
          idea={currentIdea} 
          onClose={() => setShowModal(false)}
          onSchedule={() => {
            setShowModal(false);
            onSchedule();
          }}
        />
      )}
    </div>
  );
}
