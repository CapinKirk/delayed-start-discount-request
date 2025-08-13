export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900 antialiased">
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-medium text-gray-900 leading-none">POR Chat Admin</h1>
          <nav className="hidden sm:flex gap-2">
            <a className="px-3 py-1.5 rounded-md text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition" href="/admin">Home</a>
            <a className="px-3 py-1.5 rounded-md text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition" href="/admin/slack">Slack</a>
            <a className="px-3 py-1.5 rounded-md text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition" href="/admin/ai">AI</a>
            <a className="px-3 py-1.5 rounded-md text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition" href="/admin/widget">Widget</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        {children}
      </main>
    </div>
  );
}




