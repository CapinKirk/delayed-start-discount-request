"use client";
import { useEffect, useState } from 'react';
import { tzGroups } from '@/lib/timezones';

type Row = { tz: string; weekday: number; start_local_time: string; end_local_time: string };

export default function HoursPage(){
  const [rows, setRows] = useState<Row[]>([]);
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  // tzGroups imported
  useEffect(() => { fetch('/api/admin/hours').then(r=>r.json()).then(d=> setRows(d.hours || [])); }, []);
  useEffect(() => { console.log('[admin/hours] rows', rows); }, [rows]);

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
      <p className="text-sm text-gray-600">Add one or more rows; a time is considered in-hours if it matches any row, in its timezone.</p>
      <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={add}>Add Row</button>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left">Region</th><th className="text-left">Timezone</th><th className="text-left">Weekday</th><th className="text-left">Start</th><th className="text-left">End</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <select className="border p-1 w-full" value={(r.tz.split('|')[0]||'GLOBAL')} onChange={e=>{
                  const z = r.tz.includes('|')? r.tz.split('|')[1]: r.tz;
                  update(i,'tz',`${e.target.value}|${z}`);
                }}>
                  {['GLOBAL','AMER','EMEA','APAC'].map(reg=> <option key={reg} value={reg}>{reg}</option>)}
                </select>
              </td>
              <td>
                {(() => {
                  const hasRegion = r.tz.includes('|');
                  const curZone = hasRegion ? r.tz.split('|')[1] : r.tz;
                  // Infer region from current zone if not encoded yet
                  const inferredRegion = hasRegion
                    ? (r.tz.split('|')[0] as any)
                    : (tzGroups.find(g => g.zones.includes(curZone))?.region || 'GLOBAL');
                  const zones = (tzGroups.find(g => g.region === inferredRegion)?.zones) || tzGroups[0].zones;
                  return (
                    <select
                      className="border p-1 w-full"
                      value={curZone}
                      onChange={e=>{
                        update(i,'tz', `${inferredRegion}|${e.target.value}`);
                      }}
                    >
                      {zones.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  );
                })()}
              </td>
              <td>
                <select className="border p-1" value={r.weekday} onChange={e=>update(i,'weekday',e.target.value)}>
                  {weekdays.map((w, idx)=> <option key={idx} value={idx}>{w}</option>)}
                </select>
              </td>
              <td><input className="border p-1" type="time" value={r.start_local_time} onChange={e=>update(i,'start_local_time',e.target.value)} /></td>
              <td><input className="border p-1" type="time" value={r.end_local_time} onChange={e=>update(i,'end_local_time',e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={save}>Save</button>
    </div>
  );
}



