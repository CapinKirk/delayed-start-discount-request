"use client";
import { useEffect, useState } from 'react';

export default function RoutingPage(){
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [suppressionMinutes, setSuppressionMinutes] = useState(5);
  useEffect(() => { fetch('/api/admin/routing').then(r=>r.json()).then(d=>{ if (d.routing){ setTimeoutSeconds(d.routing.timeout_seconds||30); setSuppressionMinutes(d.routing.human_suppression_minutes||5); } }); }, []);
  async function save(){
    const res = await fetch('/api/admin/routing', { method:'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ timeout_seconds: timeoutSeconds, human_suppression_minutes: suppressionMinutes }) });
    if (!res.ok) alert('Save failed');
  }
  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-lg font-medium">Routing Policy</h2>
      <label className="block">Timeout seconds
        <input className="border p-2 w-full" type="number" min={5} max={600} value={timeoutSeconds} onChange={e=>setTimeoutSeconds(parseInt(e.target.value||'0',10))} />
      </label>
      <label className="block">Human suppression minutes
        <input className="border p-2 w-full" type="number" min={1} max={120} value={suppressionMinutes} onChange={e=>setSuppressionMinutes(parseInt(e.target.value||'0',10))} />
      </label>
      <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Save</button>
    </div>
  );
}


