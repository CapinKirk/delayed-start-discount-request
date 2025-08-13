export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href:'/admin/slack', title:'Slack', desc:'Connect workspace and channel', icon:'💬' },
          { href:'/admin/agents', title:'Agents', desc:'Manage team, regions and avatars', icon:'👥' },
          { href:'/admin/hours', title:'Hours', desc:'Configure global/region time windows', icon:'⏰' },
          { href:'/admin/routing', title:'Routing', desc:'Timeout and AI suppression', icon:'🔄' },
          { href:'/admin/ai', title:'AI', desc:'Model, prompt, knowledge, API key', icon:'🧠' },
          { href:'/admin/widget', title:'Widget', desc:'Branding, behavior, preview', icon:'🎛️' },
          { href:'/admin/embed', title:'Embed', desc:'Install snippet on your site', icon:'📋' },
        ].map(card => (
          <a key={card.href} href={card.href} className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition block">
            <div className="text-3xl mb-3" aria-hidden>{card.icon}</div>
            <div className="text-base font-semibold text-gray-900">{card.title}</div>
            <div className="text-sm text-gray-600">{card.desc}</div>
          </a>
        ))}
      </div>
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold tracking-tight">Widget Embed</h2>
        <p className="text-sm text-gray-600">Copy the snippet and paste into your site.</p>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{`<script src="/embed.js" data-chat-config="${process.env.PUBLIC_WIDGET_CONFIG_ID || "demo"}" async></script>`}</pre>
      </div>
    </div>
  );
}



