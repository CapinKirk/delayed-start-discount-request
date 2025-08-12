export default function EmbedPage(){
  const id = process.env.NEXT_PUBLIC_WIDGET_PUBLIC_ID || (process.env.PUBLIC_WIDGET_CONFIG_ID || 'demo');
  const snippet = `<script src="/embed.js" data-chat-config="${id}" async></script>`;
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-medium mb-2">Embed Snippet</h2>
      <p className="text-sm text-gray-600 mb-2">Copy/paste into your site. Do not expose secrets.</p>
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{snippet}</pre>
    </div>
  );
}



