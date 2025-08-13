"use client";
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [diag, setDiag] = useState('{}');
  useEffect(() => {
    try {
      setDiag(JSON.stringify({ url: window.location.href, time: new Date().toISOString() }, null, 2));
    } catch {}
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900 antialiased">
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-medium text-gray-900 leading-none">POR Chat Admin</h1>
          <nav className="flex flex-wrap gap-2">
            {[
              ['Home','/admin'],
              ['Slack','/admin/slack'],
              ['AI','/admin/ai'],
              ['Widget','/admin/widget'],
              ['Agents','/admin/agents'],
              ['Hours','/admin/hours'],
              ['Routing','/admin/routing'],
              ['Embed','/admin/embed'],
            ].map(([label, href]) => (
              <a key={href} className="px-3 py-1.5 rounded-md text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition" href={href as string}>{label}</a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6 space-y-4">
        {children}
        <div className="p-3 bg-white border border-gray-200 rounded-xl">
          <div className="text-sm font-medium mb-1">Diagnostics</div>
          <textarea readOnly className="w-full h-28 text-xs font-mono border rounded p-2 bg-gray-50" value={diag} />
        </div>
      </main>
    </div>
  );
}




