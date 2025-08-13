"use client";
import { useEffect, useState } from 'react';

export default function SlackSettings(){
  const [channels, setChannels] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [manualId, setManualId] = useState<string>('');
  const [conn, setConn] = useState<any>(null);
  useEffect(() => { 
    fetch('/api/admin/slack/channels').then(r=>r.json()).then(d=>setChannels(d.channels||[]));
    fetch('/api/admin/slack/connection').then(r=>r.json()).then(d=>{ setConn(d.connection); setSelected(d.connection?.channel_id || ''); });
  }, []);
  async function save(){
    const channel_id = selected || manualId.trim();
    if (!channel_id) { alert('Enter a Channel ID or select one.'); return; }
    const res = await fetch('/api/admin/slack/connection', { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ channel_id }) });
    if (!res.ok) alert('Save failed');
  }
  return (
    <div className="p-4 bg-white rounded shadow space-y-3">
      <h2 className="text-lg font-medium">Slack Settings</h2>
      <a className="inline-block px-3 py-2 bg-black text-white rounded" href="/api/slack/oauth/start">Reconnect Slack</a>
      <div>
        <label className="block mb-1">Select Channel</label>
        <select value={selected} onChange={e=>setSelected(e.target.value)} className="border p-2 w-full">
          <option value="">Select…</option>
          {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1">Or enter Channel ID</label>
        <input className="border p-2 w-full" placeholder="e.g. C07NV9TQR51" value={manualId} onChange={e=>setManualId(e.target.value)} />
      </div>
      <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Save</button>
      <div className="text-sm text-gray-600">
        Interactivity URL: <code>/api/slack/interactivity</code><br/>
        Events URL: <code>/api/slack/events</code><br/>
        Commands: <code>/claim</code>, <code>/release</code>, <code>/closechat</code>
      </div>
    </div>
  );
}


