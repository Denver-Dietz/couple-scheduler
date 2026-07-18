import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import { ArrowLeft, Heart, X } from 'lucide-react';
import ScheduleDateModal from './ScheduleDateModal';

export default function MatchGame({ onBack, datesData, activeUser, onSchedule }) {
  const [swipes, setSwipes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchPopup, setShowMatchPopup] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [ideaToSchedule, setIdeaToSchedule] = useState(null);
  const [animatingDir, setAnimatingDir] = useState(null);
  
  const fetchSwipes = async () => {
    try {
      const data = await api.getSwipes();
      setSwipes(data);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSwipes();
  }, []);

  // Shuffle the base ideas once when the data loads so categories are mixed
  const shuffledIdeas = React.useMemo(() => {
    if (!datesData?.ideas) return [];
    const shuffled = [...datesData.ideas];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [datesData?.ideas]);

  // Filter ideas to only ones with images, and ones the active user HAS NOT swiped on yet
  const availableIdeas = React.useMemo(() => {
    return shuffledIdeas.filter(idea => idea.hasImage).filter(idea => {
      const swipeRecord = swipes.find(s => s.date_idea_id === idea.id);
      if (!swipeRecord) return true;
      const mySwipe = activeUser === 'user1' ? swipeRecord.user1_swipe : swipeRecord.user2_swipe;
      return mySwipe === 'none';
    });
  }, [shuffledIdeas, swipes, activeUser]);

  const handleSwipe = async (direction, idea) => {
    try {
      await api.swipe({
        user_id: activeUser,
        date_idea_id: idea.id,
        direction: direction
      });
      
      // Update local state
      const existing = swipes.find(s => s.date_idea_id === idea.id) || { date_idea_id: idea.id, user1_swipe: 'none', user2_swipe: 'none' };
      const newSwipeRecord = { ...existing };
      if (activeUser === 'user1') newSwipeRecord.user1_swipe = direction;
      else newSwipeRecord.user2_swipe = direction;
      
      setSwipes(prev => [...prev.filter(s => s.date_idea_id !== idea.id), newSwipeRecord]);

      // Check for match
      if (direction === 'right') {
        const otherSwipe = activeUser === 'user1' ? existing.user2_swipe : existing.user1_swipe;
        if (otherSwipe === 'right') {
          setShowMatchPopup(idea);
        }
      }

      setCurrentIndex(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwipeAction = (direction, idea) => {
    if (animatingDir) return;
    setAnimatingDir(direction);
    setTimeout(() => {
      handleSwipe(direction, idea);
      setAnimatingDir(null);
    }, 300);
  };

  const handleKeyDown = useCallback((e) => {
    if (showMatchPopup || showGallery || currentIndex >= availableIdeas.length) return;
    if (e.key === 'ArrowLeft') {
      handleSwipeAction('left', availableIdeas[currentIndex]);
    } else if (e.key === 'ArrowRight') {
      handleSwipeAction('right', availableIdeas[currentIndex]);
    }
  }, [currentIndex, availableIdeas, showMatchPopup, showGallery, animatingDir]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleReset = async () => {
    try {
      await api.resetSwipes();
      await fetchSwipes();
      setCurrentIndex(0);
    } catch(e) {
      console.error(e);
    }
  };

  const handleSchedule = (idea) => {
    setIdeaToSchedule(idea);
  };

  const matchedIdeas = datesData.ideas.filter(idea => {
    const rec = swipes.find(s => s.date_idea_id === idea.id);
    return rec && rec.user1_swipe === 'right' && rec.user2_swipe === 'right';
  });

  if (showGallery) {
    return (
      <div className="flex flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => setShowGallery(false)} className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={16} /> Back to Game
        </button>
        <h2 style={{ color: 'var(--accent-purple)' }}>Our Matches</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {matchedIdeas.map(idea => (
             <div key={idea.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img src={idea.imageUrl} alt={idea.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>{idea.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{idea.description}</p>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => handleSchedule(idea)}>
                  Make it a Date
                </button>
              </div>
            </div>
          ))}
          {matchedIdeas.length === 0 && <p>No matches yet. Keep swiping!</p>}
        </div>
        {ideaToSchedule && (
          <ScheduleDateModal 
            idea={ideaToSchedule} 
            onClose={() => setIdeaToSchedule(null)}
            onSchedule={() => {
              setIdeaToSchedule(null);
              onSchedule();
            }}
          />
        )}
      </div>
    );
  }

  const currentCard = availableIdeas[currentIndex];

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '600px', margin: '0 auto', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <button onClick={onBack} className="btn btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, color: 'var(--accent-purple)' }}>Match Game</h2>
        <button onClick={() => setShowGallery(true)} className="btn btn-ghost" style={{ color: 'var(--accent-purple)' }}>
          Our Matches
        </button>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        {currentCard ? (
          <div 
            className="card" 
            style={{ 
              width: '100%', 
              height: 'auto',
              minHeight: '500px',
              display: 'flex', 
              flexDirection: 'column', 
              border: '1px solid var(--border-color)', 
              position: 'relative', 
              zIndex: 10,
              textAlign: 'center',
              overflow: 'hidden',
              transition: animatingDir ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
              transform: animatingDir === 'left' ? 'translateX(-150%) rotate(-15deg)' : animatingDir === 'right' ? 'translateX(150%) rotate(15deg)' : 'translateX(0) rotate(0)',
              opacity: animatingDir ? 0 : 1
            }}
          >
             <img src={currentCard.imageUrl} alt={currentCard.title} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
             <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <h3 style={{ margin: '0 0 0.5rem 0' }}>{currentCard.title}</h3>
               <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>{currentCard.description}</p>
             </div>
          </div>
        ) : (
          <div className="card" style={{ width: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
             <h3 style={{ color: 'var(--text-muted)' }}>You've seen all ideas!</h3>
             <button className="btn btn-primary" onClick={handleReset} style={{ marginTop: '1rem' }}>Play Again (Reset Swipes)</button>
          </div>
        )}
      </div>

      {currentCard && (
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
          <button className="btn" style={{ padding: '1rem', borderRadius: '50%', background: 'var(--bg-color)', border: '2px solid var(--accent-red)', color: 'var(--accent-red)' }}
                  onClick={() => handleSwipeAction('left', currentCard)}>
            <X size={32} />
          </button>
          <button className="btn" style={{ padding: '1rem', borderRadius: '50%', background: 'var(--bg-color)', border: '2px solid var(--accent-emerald)', color: 'var(--accent-emerald)' }}
                  onClick={() => handleSwipeAction('right', currentCard)}>
            <Heart size={32} />
          </button>
        </div>
      )}

      {showMatchPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center', background: 'var(--panel-bg)', animation: 'popIn 0.5s ease-out' }}>
            <Heart size={64} color="var(--accent-red)" style={{ margin: '0 auto', animation: 'pulse 1s infinite' }} />
            <h2 style={{ color: 'var(--accent-emerald)', marginTop: '1rem' }}>It's a Match!</h2>
            <p>You both swiped right on:</p>
            <h3>{showMatchPopup.title}</h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-primary" onClick={() => setShowMatchPopup(null)}>Keep Playing</button>
              <button className="btn" style={{ background: 'var(--accent-purple)', color: '#fff' }} onClick={() => { setShowMatchPopup(null); setShowGallery(true); }}>See Matches</button>
            </div>
          </div>
        </div>
      )}
      {ideaToSchedule && !showGallery && (
        <ScheduleDateModal 
          idea={ideaToSchedule} 
          onClose={() => setIdeaToSchedule(null)}
          onSchedule={() => {
            setIdeaToSchedule(null);
            onSchedule();
          }}
        />
      )}

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

