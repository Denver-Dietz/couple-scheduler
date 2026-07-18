import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { api } from '../utils/api';

/**
 * Renders the Telegram Command Reference cheat sheet.
 * 
 * Why:
 * - Centralizes documentation for bot interactions so users can easily reference
 *   all available CLI-style commands from within the dashboard UI.
 */
export default function CommandReference() {
  const [user1Name, setUser1Name] = useState("user1");
  const [user2Name, setUser2Name] = useState("user2");

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const data = await api.getSettings();
        const u1 = data.find(s => s.key === 'user1_name')?.value || "user1";
        const u2 = data.find(s => s.key === 'user2_name')?.value || "user2";
        setUser1Name(u1.replace(/ /g, "").toLowerCase());
        setUser2Name(u2.replace(/ /g, "").toLowerCase());
      } catch (err) {
        console.error("Could not load user names:", err);
      }
    };
    fetchNames();
  }, []);

  const commands = [
    { cmd: '/work <day> <start>-<end>', desc: 'Set a work shift', example: '/work Monday 9am-5pm' },
    { cmd: '/work off <day>', desc: 'Mark a day off', example: '/work off Friday' },
    { cmd: '/work list', desc: 'Show upcoming shifts', example: '/work list' },
    { cmd: '/appointment <desc>', desc: 'Add a fixed event', example: '/appointment Dentist Fri 2pm' },
    { cmd: '/goal <desc>', desc: 'Add a flexible habit', example: '/goal Gym 3x a week for 45m' },
    { cmd: '/project <desc>', desc: 'Add a project', example: '/project Build shed 4 hours' },
    { cmd: '/idea <desc>', desc: 'Add a date idea', example: '/idea Try the new sushi place' },
    { cmd: '/trip <dest>', desc: 'Add a Dream Board destination', example: '/trip Tokyo' },
    { cmd: '[Send Photo]', desc: 'Upload a photo to Memories', example: 'Send an image with a caption' }
  ];

  return (
    <div className="card mt-6" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem' }}>
      <h3 className="flex items-center gap-2 mb-6" style={{ color: 'var(--accent-blue)' }}>
        <Terminal size={20} /> Telegram Commands Reference
      </h3>
      
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(59, 130, 246, 0.2)' }}>
            <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Command</th>
            <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Description</th>
            <th style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Example</th>
          </tr>
        </thead>
        <tbody>
          {commands.map((c, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '0.5rem' }}><code style={{ color: 'var(--accent-emerald)', background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '4px' }}>{c.cmd}</code></td>
              <td style={{ padding: '0.5rem' }}>{c.desc}</td>
              <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}><i>{c.example}</i></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Journal
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-purple)' }}>/journal &lt;entry&gt;</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Write a journal entry (with smart edit option)</span>
            </li>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-purple)' }}>/read{user1Name}</code> or <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-purple)' }}>/read{user2Name}</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Read the latest entry by a user</span>
            </li>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-purple)' }}>/list{user1Name}</code> or <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-purple)' }}>/list{user2Name}</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>List recent journal entries by a user</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Viewing & Management
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-blue)' }}>/today</code> or <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-blue)' }}>/week</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>View the generated schedule</span>
            </li>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-blue)' }}>/list</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>List all your goals, projects & appointments</span>
            </li>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-blue)' }}>/peek</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>View your partner's constraints</span>
            </li>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-blue)' }}>/generate</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Force the system to build a new schedule</span>
            </li>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-blue)' }}>/reset</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Clear the bot's conversation memory</span>
            </li>
            <li style={{ fontSize: '0.9rem' }}>
              <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-emerald)' }}>📷 Photo</code>
              <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Send a photo to upload to Memories</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
