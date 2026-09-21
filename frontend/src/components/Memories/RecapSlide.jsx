import React from 'react';
import { BACKEND_URL } from '../../utils/api';

export default function RecapSlide({ memory, index, currentIndex }) {
  return (
    <div
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
  );
}
