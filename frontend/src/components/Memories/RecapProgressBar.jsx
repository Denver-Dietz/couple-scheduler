import React from 'react';

export default function RecapProgressBar({ currentIndex, totalLength }) {
  return (
    <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '4px', background: 'rgba(255,255,255,0.2)', zIndex: 1001 }}>
      <div style={{
        height: '100%',
        background: 'white',
        width: `${((currentIndex + 1) / totalLength) * 100}%`,
        transition: 'width 0.5s ease'
      }}></div>
    </div>
  );
}
