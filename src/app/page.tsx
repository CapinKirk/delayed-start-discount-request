export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-6xl p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/admin/slack" className="group p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow transition block">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 text-xl">💬</span>
              <div className="text-xl font-semibold">Slack</div>
            </div>
            <div className="text-sm text-gray-600">Connect workspace and choose a channel for handoff.</div>
          </a>
          <a href="/admin/ai" className="group p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow transition block">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 text-xl">🧠</span>
              <div className="text-xl font-semibold">AI</div>
            </div>
            <div className="text-sm text-gray-600">Configure model, prompt, knowledge, and API key.</div>
          </a>
          <a href="/admin/widget" className="group p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow transition block">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-xl">🎛️</span>
              <div className="text-xl font-semibold">Widget</div>
            </div>
            <div className="text-sm text-gray-600">Set colors, avatar, and behavior.</div>
          </a>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Live Preview</div>
            <a className="text-sm text-indigo-700 hover:underline" href="/admin/widget">Open Widget Settings →</a>
          </div>
          <iframe srcDoc={`<!doctype html><html><body style=\"margin:0;padding:0;height:100vh\"><script src=\"/embed.js\" data-chat-config=\"${process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo'}\" data-origin=\"\" async></script></body></html>`} className="w-full h-[640px] border rounded-xl" />
        </div>
      </div>
    </div>
  );
}
