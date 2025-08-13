export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-3 text-[11px] text-gray-500">Diagnostics are logged to the browser console for each admin page.</div>
        {children}
      </main>
    </div>
  );
}




