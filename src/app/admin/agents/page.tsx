"use client";
import { useEffect, useState } from 'react';

type Agent = { id: string; slack_user_id: string; display_name: string; active: boolean; order_index: number };

export default function AgentsPage(){
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newUser, setNewUser] = useState('');
  const [newName, setNewName] = useState('');

  async function load(){
    const res = await fetch('/api/admin/agents');
    const data = await res.json();
    setAgents(data.agents || []);
  }
  useEffect(() => { load(); }, []);

  async function add(){
    const res = await fetch('/api/admin/agents', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ slack_user_id: newUser, display_name: newName, order_index: agents.length, active: true }) });
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
      <div className="flex gap-2">
        <input className="border p-2 flex-1" placeholder="Slack user ID (e.g., U123)" value={newUser} onChange={e=>setNewUser(e.target.value)} />
        <input className="border p-2 flex-1" placeholder="Display name" value={newName} onChange={e=>setNewName(e.target.value)} />
        <button className="px-3 py-2 bg-black text-white rounded" onClick={add} disabled={!newUser || !newName || agents.length>=4}>Add</button>
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


