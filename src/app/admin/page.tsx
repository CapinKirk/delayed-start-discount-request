export default function AdminHome() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-medium">Slack Connection</h2>
        <p className="text-sm text-gray-600">Connect your Slack workspace and select a channel.</p>
        <a className="inline-block mt-2 px-3 py-2 bg-black text-white rounded" href="/api/slack/oauth/start">Connect Slack</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/slack" className="p-4 bg-white rounded shadow block">Slack Settings</a>
        <a href="/admin/agents" className="p-4 bg-white rounded shadow block">Agents</a>
        <a href="/admin/hours" className="p-4 bg-white rounded shadow block">Business Hours</a>
        <a href="/admin/routing" className="p-4 bg-white rounded shadow block">Routing Policy</a>
        <a href="/admin/ai" className="p-4 bg-white rounded shadow block">AI Config</a>
        <a href="/admin/widget" className="p-4 bg-white rounded shadow block">Widget Settings</a>
        <a href="/admin/embed" className="p-4 bg-white rounded shadow block">Embed Snippet</a>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-medium">Widget Embed</h2>
        <p className="text-sm text-gray-600">Copy the snippet and paste into your site.</p>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{`<script src="/embed.js" data-chat-config="${process.env.PUBLIC_WIDGET_CONFIG_ID || "demo"}" async></script>`}</pre>
      </div>
    </div>
  );
}



