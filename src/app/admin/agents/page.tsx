"use client";
import { useEffect, useState } from 'react';

type Agent = { id: string; slack_user_id: string; display_name: string; active: boolean; order_index: number };

export default function AgentsPage(){
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newUser, setNewUser] = useState('');
  const [newName, setNewName] = useState('');
  const [directory, setDirectory] = useState<{id:string;name:string}[]>([]);
  const [newAvatar, setNewAvatar] = useState('');
  const [newRegion, setNewRegion] = useState<'AMER'|'EMEA'|'APAC'|'GLOBAL'|''>('');

  async function load(){
    console.log('[admin/agents] load');
    const res = await fetch('/api/admin/agents');
    const data = await res.json();
    setAgents(data.agents || []);
  }
  useEffect(() => { load(); fetch('/api/admin/slack/users').then(r=>r.json()).then(d=> setDirectory(d.users||[])); }, []);
  

  async function add(){
    const res = await fetch('/api/admin/agents', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ slack_user_id: newUser, display_name: newName, order_index: agents.length, active: true, avatar_url: newAvatar || undefined, region: newRegion || undefined }) });
    if (res.ok) { setNewUser(''); setNewName(''); load(); } else alert('Add failed');
  }

  function move(i: number, dir: -1 | 1){
    const copy = [...agents];
    const j = i + dir;
    if (j < 0 || j >= copy.length) return;
    [copy[i], copy[j]] = [copy[j], copy[i]];
    copy.forEach((a, idx) => a.order_index = idx);
    setAgents(copy);
  }

  async function saveOrder(){
    const res = await fetch('/api/admin/agents', { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify(agents) });
    if (!res.ok) alert('Save failed');
  }

  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-lg font-medium">Agents (max 4)</h2>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Select Slack user</label>
            <select className="border p-2 w-full" value={newUser} onChange={e=>{ setNewUser(e.target.value); const n = directory.find(u=>u.id===e.target.value)?.name||''; setNewName(n); }}>
              <option value="">Choose…</option>
              {directory.map(u=> <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Display name</label>
            <input className="border p-2 w-full" placeholder="Display name" value={newName} onChange={e=>setNewName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Agent image URL (optional)</label>
            <input className="border p-2 w-full" placeholder="https://... transparent PNG recommended" value={newAvatar} onChange={e=>setNewAvatar(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Region</label>
            <select className="border p-2 w-full" value={newRegion} onChange={e=>setNewRegion(e.target.value as any)}>
              <option value="">Unspecified</option>
              <option value="GLOBAL">GLOBAL</option>
              <option value="AMER">AMER</option>
              <option value="EMEA">EMEA</option>
              <option value="APAC">APAC</option>
            </select>
          </div>
        </div>
        <button className="px-3 py-2 bg-indigo-600 text-white rounded-md" onClick={add} disabled={!newUser || !newName || agents.length>=4}>Add</button>
      </div>
      <ul className="space-y-2">
          {agents.map((a, i) => (
          <li key={a.id} className="border p-2 rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{a.display_name}</div>
              <div className="text-xs text-gray-600">{a.slack_user_id}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 border rounded" onClick={()=>move(i,-1)}>↑</button>
              <button className="px-2 py-1 border rounded" onClick={()=>move(i,1)}>↓</button>
              <label className="text-sm">Active <input type="checkbox" className="ml-1" checked={a.active} onChange={e=>setAgents(prev=> prev.map(p=> p.id===a.id? {...p, active:e.target.checked}:p))} /></label>
            </div>
          </li>
        ))}
      </ul>
      <button className="px-3 py-2 bg-black text-white rounded" onClick={saveOrder}>Save</button>
    </div>
  );
}



