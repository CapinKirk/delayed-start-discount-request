"use client";
import { useEffect, useState } from 'react';

export default function WidgetSettingsPage(){
  const [theme, setTheme] = useState<any>(null);
  const publicId = process.env.NEXT_PUBLIC_WIDGET_PUBLIC_ID || (process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo');

  useEffect(() => {
    fetch(`/api/admin/widget-theme?public_id=${publicId}`).then(r=>r.json()).then(d=>setTheme(d.theme || {}));
  }, []);

  if (!theme) return <div className="p-4 bg-white rounded shadow">Loading…</div>;

  async function save(){
    const payload = { public_id: publicId, ...theme };
    const res = await fetch('/api/admin/widget-theme', { method: 'PUT', headers: { 'content-type':'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) alert('Save failed');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-4 bg-white rounded shadow space-y-4">
        <h2 className="text-lg font-medium">Widget Settings</h2>
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
        <label className="block">Greeting
          <input className="border p-2 w-full" value={theme.greeting || ''} onChange={e=>setTheme({...theme, greeting: e.target.value})} />
        </label>
        <label className="block">Avatar URL
          <input className="border p-2 w-full" placeholder="https://..." value={theme.avatar_url || ''} onChange={e=>setTheme({...theme, avatar_url: e.target.value})} />
        </label>
        <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Save</button>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-medium mb-2">Live Preview</h2>
        <iframe srcDoc={`<!doctype html><html><body><script src="/embed.js" data-chat-config="${publicId}" data-origin="${location.origin}" async></script></body></html>`} className="w-full h-[520px] border rounded" />
      </div>
    </div>
  );
}



