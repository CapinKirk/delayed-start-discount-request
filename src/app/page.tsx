import Script from 'next/script';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-6xl p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { href:'/admin/slack', title:'Slack', desc:'Connect workspace and choose a channel', icon:'💬' },
            { href:'/admin/agents', title:'Agents', desc:'Manage team, regions and avatars', icon:'👥' },
            { href:'/admin/hours', title:'Hours', desc:'Global/AMER/EMEA/APAC windows', icon:'⏰' },
            { href:'/admin/routing', title:'Routing', desc:'Timeout and AI suppression', icon:'🔄' },
            { href:'/admin/ai', title:'AI', desc:'Model, prompt, knowledge, API key', icon:'🧠' },
            { href:'/admin/widget', title:'Widget', desc:'Branding and behavior', icon:'🎛️' },
            { href:'/admin/embed', title:'Embed', desc:'Install snippet', icon:'📋' },
          ].map(card => (
            <a key={card.href} href={card.href} className="group p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow transition block">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 text-xl">{card.icon}</span>
                <div className="text-xl font-semibold text-gray-900">{card.title}</div>
              </div>
              <div className="text-sm text-gray-700">{card.desc}</div>
            </a>
          ))}
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Widget is embedded at the lower-right corner of this page</div>
            <a className="text-sm text-indigo-700 hover:underline" href="/admin/widget">Open Widget Settings →</a>
          </div>
          <div className="text-sm text-gray-600">No boxed preview. Use the real launcher in the corner to test.</div>
        </div>
      </div>
      <Script
        src="/embed.js"
        strategy="afterInteractive"
        data-chat-config={process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo'}
        data-origin=""
      />
    </div>
  );
}
