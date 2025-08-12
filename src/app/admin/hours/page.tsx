"use client";
import { useEffect, useState } from 'react';

type Row = { tz: string; weekday: number; start_local_time: string; end_local_time: string };

export default function HoursPage(){
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { fetch('/api/admin/hours').then(r=>r.json()).then(d=> setRows(d.hours || [])); }, []);

  function update(i: number, field: keyof Row, value: string){
    setRows(prev => prev.map((r, idx) => idx===i? { ...r, [field]: value } as any : r));
  }
  async function save(){
    const res = await fetch('/api/admin/hours', { method:'PUT', headers:{'content-type':'application/json'}, body: JSON.stringify(rows) });
    if (!res.ok) alert('Save failed');
  }
  function add(){ setRows(prev => [...prev, { tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', weekday: 1, start_local_time: '09:00', end_local_time: '17:00' }]); }
  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-lg font-medium">Business Hours</h2>
      <button className="px-3 py-2 bg-black text-white rounded" onClick={add}>Add Row</button>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left">TZ</th><th className="text-left">Weekday (0-6)</th><th className="text-left">Start</th><th className="text-left">End</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><input className="border p-1" value={r.tz} onChange={e=>update(i,'tz',e.target.value)} /></td>
              <td><input className="border p-1 w-16" type="number" min={0} max={6} value={r.weekday} onChange={e=>update(i,'weekday',e.target.value)} /></td>
              <td><input className="border p-1" value={r.start_local_time} onChange={e=>update(i,'start_local_time',e.target.value)} /></td>
              <td><input className="border p-1" value={r.end_local_time} onChange={e=>update(i,'end_local_time',e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Save</button>
    </div>
  );
}



