"use client";
import { useEffect, useState } from 'react';

export default function RoutingPage(){
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [suppressionSeconds, setSuppressionSeconds] = useState(300);
  useEffect(() => { fetch('/api/admin/routing').then(r=>r.json()).then(d=>{ if (d.routing){ setTimeoutSeconds(d.routing.timeout_seconds||30); setSuppressionSeconds(((d.routing.human_suppression_minutes||5)*60)); } }); }, []);
  async function save(){
    const minutes = Math.max(1, Math.round((suppressionSeconds||0)/60));
    const res = await fetch('/api/admin/routing', { method:'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ timeout_seconds: timeoutSeconds, human_suppression_minutes: minutes }) });
    if (!res.ok) alert('Save failed');
  }
  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-lg font-medium">Routing Policy</h2>
      <label className="block">Timeout (seconds)
        <input className="border p-2 w-full" type="number" min={5} max={600} value={timeoutSeconds} onChange={e=>setTimeoutSeconds(parseInt(e.target.value||'0',10))} title="How long to wait for the currently assigned agent before reassigning to the next agent or falling back to AI." />
      </label>
      <label className="block">AI suppression window (seconds)
        <input className="border p-2 w-full" type="number" min={60} max={7200} value={suppressionSeconds} onChange={e=>setSuppressionSeconds(parseInt(e.target.value||'0',10))} title="How long AI should pause after an agent reacts or replies. After this, AI may resume if no human activity occurs." />
      </label>
      <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Save</button>
    </div>
  );
}



