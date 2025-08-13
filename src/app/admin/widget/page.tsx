"use client";
import { useEffect, useState } from 'react';

export default function WidgetSettingsPage(){
  const [theme, setTheme] = useState<any>(null);
  const publicId = process.env.NEXT_PUBLIC_WIDGET_PUBLIC_ID || (process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo');

  useEffect(() => {
    console.log('[admin/widget] load theme', { publicId });
    fetch(`/api/admin/widget-theme?public_id=${publicId}`).then(r=>r.json()).then(d=>setTheme(d.theme || {}));
  }, []);

  // Inject real widget into page lower-right for natural preview
  useEffect(() => {
    const id = 'por-embed-loader';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = '/embed.js';
    (s as any).dataset = { chatConfig: publicId, origin: window.location.origin } as any;
    s.async = true;
    document.body.appendChild(s);
    return () => { /* keep widget available while on page */ };
  }, [publicId]);

  if (!theme) return <div className="p-4 bg-white rounded shadow">Loading…</div>;

  async function save(){
    const payload = { public_id: publicId, ...theme };
    console.log('[admin/widget] save', payload);
    const res = await fetch('/api/admin/widget-theme', { method: 'PUT', headers: { 'content-type':'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) alert('Save failed');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Widget Settings</h2>
        <label className="block">Mask roles
          <input type="checkbox" className="ml-2" checked={!!theme.mask_roles} onChange={e=>setTheme({...theme, mask_roles: e.target.checked})} />
        </label>
        <label className="block">Unified display name
          <input className="border p-2 w-full" value={theme.unified_display_name || ''} onChange={e=>setTheme({...theme, unified_display_name: e.target.value})} />
        </label>
        <label className="block">Auto open enabled
          <input type="checkbox" className="ml-2" checked={!!theme.auto_open_enabled} onChange={e=>setTheme({...theme, auto_open_enabled: e.target.checked})} />
        </label>
        <label className="block">Auto open delay (ms)
          <input type="number" className="border p-2 w-full" value={theme.auto_open_delay_ms || 0} onChange={e=>setTheme({...theme, auto_open_delay_ms: parseInt(e.target.value||'0',10)})} />
        </label>
        <label className="block">Auto open greeting
          <textarea className="border p-2 w-full" value={theme.auto_open_greeting || ''} onChange={e=>setTheme({...theme, auto_open_greeting: e.target.value})} />
        </label>
        <label className="block">Auto open frequency
          <select className="border p-2 w-full" value={theme.auto_open_frequency || 'once_per_session'} onChange={e=>setTheme({...theme, auto_open_frequency: e.target.value})}>
            <option value="once_per_session">Once per session</option>
            <option value="every_visit">Every visit</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">Primary color
            <input className="border p-2 w-full" type="color" value={(theme.colors?.primary) || '#111827'} onChange={e=>setTheme({...theme, colors:{ ...(theme.colors||{}), primary: e.target.value }})} />
          </label>
          <label className="block">Avatar URL
            <input className="border p-2 w-full" placeholder="https://..." value={theme.avatar_url || ''} onChange={e=>setTheme({...theme, avatar_url: e.target.value})} />
          </label>
        </div>
        <label className="block">Greeting
          <input className="border p-2 w-full" value={theme.greeting || ''} onChange={e=>setTheme({...theme, greeting: e.target.value})} />
        </label>
        <button className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md transition" onClick={save}>Save</button>
      </div>
      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold tracking-tight mb-2">Live Preview</h2>
        <p className="text-sm text-gray-600">The widget is loaded on this page and anchored to the lower-right corner. Use the launcher to preview.</p>
      </div>
    </div>
  );
}



