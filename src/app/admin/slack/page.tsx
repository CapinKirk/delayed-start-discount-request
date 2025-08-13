"use client";
import { useEffect, useState } from 'react';

export default function SlackSettings(){
  const [channels, setChannels] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [manualId, setManualId] = useState<string>('');
  const [conn, setConn] = useState<any>(null);
  const [logs, setLogs] = useState<string>('');
  useEffect(() => { 
    fetch('/api/admin/slack/channels')
      .then(async r=>({ status:r.status, body: await r.text() }))
      .then(({status, body})=>{ setLogs(l=>l+`GET /api/admin/slack/channels -> ${status}\n${body}\n\n`); try{ const d=JSON.parse(body); setChannels(d.channels||[]);}catch{}});
    fetch('/api/admin/slack/connection')
      .then(async r=>({ status:r.status, body: await r.text() }))
      .then(({status, body})=>{ setLogs(l=>l+`GET /api/admin/slack/connection -> ${status}\n${body}\n\n`); try{ const d=JSON.parse(body); setConn(d.connection); setSelected(d.connection?.channel_id||''); }catch{} });
  }, []);
  async function reloadChannels(){
    const r = await fetch('/api/admin/slack/channels');
    const text = await r.text();
    setLogs(l=>l+`RELOAD /api/admin/slack/channels -> ${r.status}\n${text}\n\n`);
    try{ const d = JSON.parse(text); setChannels(d.channels||[]);}catch{}
  }
  async function save(){
    const channel_id = selected || manualId.trim();
    if (!channel_id) { alert('Enter a Channel ID or select one.'); return; }
    try{
      const res = await fetch('/api/admin/slack/connection', { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ channel_id }) });
      const text = await res.text();
      setLogs(l=>l+`PUT /api/admin/slack/connection -> ${res.status}\n${text}\n\n`);
      if (!res.ok) alert('Save failed');
    } catch(e:any){
      setLogs(l=>l+`PUT /api/admin/slack/connection threw\n${String(e?.stack||e)}\n\n`);
      alert('Save failed');
    }
  }
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Slack Settings</h2>
      <a className="inline-block px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md transition" href="/api/slack/oauth/start">Reconnect Slack</a>
      <div>
        <label className="block mb-1 text-sm text-gray-700">Select Channel</label>
        <select value={selected} onFocus={reloadChannels} onChange={e=>setSelected(e.target.value)} className="border border-gray-300 rounded-md p-2 w-full bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition">
          <option value="">Select…</option>
          {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
        </select>
        <button type="button" className="mt-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 transition" onClick={reloadChannels}>Reload channels</button>
      </div>
      <div>
        <label className="block mb-1 text-sm text-gray-700">Or enter Channel ID</label>
        <input className="border border-gray-300 rounded-md p-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="e.g. C07NV9TQR51" value={manualId} onChange={e=>setManualId(e.target.value)} />
      </div>
      <button className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md transition" onClick={save}>Save</button>
      <div className="text-sm text-gray-600">
        Interactivity URL: <code>/api/slack/interactivity</code><br/>
        Events URL: <code>/api/slack/events</code><br/>
        Commands: <code>/claim</code>, <code>/release</code>, <code>/closechat</code>
        <div className="mt-2">Current connection: <code>{conn ? JSON.stringify(conn) : 'null'}</code></div>
      </div>
      <div>
        <label className="block mb-1 text-sm text-gray-700">Debug logs</label>
        <textarea className="border border-gray-300 rounded p-2 w-full h-64 font-mono text-xs bg-gray-50" readOnly value={logs} />
      </div>
    </div>
  );
}


