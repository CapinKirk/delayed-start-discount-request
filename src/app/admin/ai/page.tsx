"use client";
import { useEffect, useState } from 'react';

export default function AIPage(){
  const [model, setModel] = useState('gpt-4o-mini');
  const [prompt, setPrompt] = useState('');
  const [kb, setKb] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [models, setModels] = useState<string[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  useEffect(()=>{ 
    fetch('/api/admin/ai-config').then(r=>r.json()).then(d=>{ if (d.ai){ setModel(d.ai.model||'gpt-4o-mini'); setPrompt(d.ai.system_prompt||''); setKb(d.ai.kb_text||''); setHasApiKey(!!d.ai.has_api_key); } });
    fetch('/api/ai/models').then(r=>r.json()).then(d=> setModels(d.models||[]));
  },[]);
  async function save(){
    try {
      const res = await fetch('/api/admin/ai-config', { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ model, system_prompt: prompt, kb_text: kb, api_key: apiKey || undefined }) });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) {
        console.error('[admin/ai] save error', data);
        alert('Save failed: ' + (data?.error || res.status));
      } else {
        console.log('[admin/ai] saved', data);
        if (data.saved_api_key) { setApiKey(''); setHasApiKey(true); }
      }
    } catch (e) {
      console.error('[admin/ai] save exception', e);
      alert('Save failed');
    }
  }
  async function test(){
    setTestOutput('');
    // create ephemeral conversation for preview (simplified)
    const session_id = crypto.randomUUID();
    const session = await fetch('/api/chat/session', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ session_id }) }).then(r=>r.json());
    await fetch('/api/chat/send', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ conversation_id: session.conversation_id, text: testInput }) });
    const res = await fetch('/api/ai/stream', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ conversation_id: session.conversation_id }) });
    const resp = await res.json();
    if (!res.ok) {
      alert('AI error: ' + (resp?.error || res.status));
      console.error('[admin/ai] test error', resp);
    }
    setTestOutput(resp.text||resp.detail||JSON.stringify(resp));
  }
  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-lg font-medium">AI Configuration</h2>
      <div className="text-xs text-gray-600">OpenAI key status: {hasApiKey? 'configured' : 'not set'}</div>
      <label className="block">Model
        <select className="border p-2 w-full" value={model} onChange={e=>setModel(e.target.value)}>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label className="block">System prompt
        <textarea className="border p-2 w-full" value={prompt} onChange={e=>setPrompt(e.target.value)} />
      </label>
      <label className="block">Knowledge base text
        <textarea className="border p-2 w-full" value={kb} onChange={e=>setKb(e.target.value)} />
      </label>
      <label className="block">AI API Key
        <input type="password" className="border p-2 w-full" placeholder="sk-..." value={apiKey} onChange={e=>setApiKey(e.target.value)} />
        <div className="text-xs text-gray-500 mt-1">Leave blank to keep existing key.</div>
      </label>
      <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Save</button>
      <div className="border-t pt-4 space-y-2">
        <h3 className="font-medium">Test Console</h3>
        <input className="border p-2 w-full" placeholder="Ask a question" value={testInput} onChange={e=>setTestInput(e.target.value)} />
        <button className="px-3 py-2 bg-black text-white rounded" onClick={test}>Run</button>
        {testOutput && <pre className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap">{testOutput}</pre>}
      </div>
      <div className="p-3 bg-white border border-gray-200 rounded-xl">
        <div className="text-sm font-medium mb-1">Diagnostics</div>
        <textarea readOnly className="w-full h-28 text-xs font-mono border rounded p-2 bg-gray-50" value={JSON.stringify({ model, prompt, kb_length: kb.length, apiKeyProvided: !!apiKey, has_api_key: hasApiKey }, null, 2)} />
      </div>
    </div>
  );
}



