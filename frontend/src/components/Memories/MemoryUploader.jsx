import React, { useState } from 'react';
import { Upload, X, MapPin } from 'lucide-react';
import { api } from '../../utils/api';

export default function MemoryUploader({ activeUser, onComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [eventType, setEventType] = useState('candid');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('user_id', activeUser);
    formData.append('file', file);
    formData.append('caption', caption);
    formData.append('event_type', eventType);
    formData.append('location', location);
    
    try {
      await api.uploadMemory(formData);
      onComplete();
    } catch (e) {
      console.error(e);
    }
    setUploading(false);
  };

  return (
    <div className="card glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      <button 
        className="btn btn-ghost" 
        style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem' }}
        onClick={onCancel}
      >
        <X size={20} />
      </button>
      <h3 style={{ margin: '0 0 1.5rem 0' }}>Upload a New Memory</h3>
      
      {!preview ? (
        <label style={{ 
          border: '2px dashed var(--border-color)', 
          borderRadius: '12px', 
          padding: '3rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          cursor: 'pointer',
          background: 'var(--bg-panel)'
        }}>
          <Upload size={32} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Click to browse or drag image here</span>
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
      ) : (
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '12px', maxHeight: '400px', objectFit: 'contain', background: '#000' }} />
          <button 
            className="btn" 
            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.5rem' }}
            onClick={() => { setFile(null); setPreview(null); }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Write a caption..." 
          value={caption} 
          onChange={(e) => setCaption(e.target.value)} 
        />
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="input" style={{ flex: 1 }} value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option value="candid">Candid 📸</option>
            <option value="date">Date ❤️</option>
            <option value="trip">Trip ✈️</option>
            <option value="milestone">Milestone 🏆</option>
          </select>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Location (Optional)" 
              style={{ paddingLeft: '2rem' }}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        
        <button 
          className="btn btn-primary" 
          style={{ padding: '1rem', marginTop: '1rem', fontWeight: 'bold' }}
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Memory'}
        </button>
      </div>
    </div>
  );
}
