export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold tracking-tight">Slack Connection</h2>
        <p className="text-sm text-gray-600">Connect your Slack workspace and select a channel.</p>
        <a className="inline-block mt-3 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition" href="/api/slack/oauth/start">Connect Slack</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/admin/slack" className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 block hover:shadow transition">Slack Settings</a>
        <a href="/admin/agents" className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 block hover:shadow transition">Agents</a>
        <a href="/admin/hours" className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 block hover:shadow transition">Business Hours</a>
        <a href="/admin/routing" className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 block hover:shadow transition">Routing Policy</a>
        <a href="/admin/ai" className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 block hover:shadow transition">AI Config</a>
        <a href="/admin/widget" className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 block hover:shadow transition">Widget Settings</a>
        <a href="/admin/embed" className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 block hover:shadow transition">Embed Snippet</a>
      </div>
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold tracking-tight">Widget Embed</h2>
        <p className="text-sm text-gray-600">Copy the snippet and paste into your site.</p>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{`<script src="/embed.js" data-chat-config="${process.env.PUBLIC_WIDGET_CONFIG_ID || "demo"}" async></script>`}</pre>
      </div>
    </div>
  );
}



