"use client";
import { useEffect, useState } from 'react';

export default function AIPage(){
  const [model, setModel] = useState('gpt-5');
  const [prompt, setPrompt] = useState('');
  const [kb, setKb] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  useEffect(()=>{ fetch('/api/admin/ai-config').then(r=>r.json()).then(d=>{ if (d.ai){ setModel(d.ai.model||'gpt-5'); setPrompt(d.ai.system_prompt||''); setKb(d.ai.kb_text||''); } }); },[]);
  async function save(){
    const res = await fetch('/api/admin/ai-config', { method: 'PUT', headers: {'content-type':'application/json'}, body: JSON.stringify({ model, system_prompt: prompt, kb_text: kb }) });
    if (!res.ok) alert('Save failed');
  }
  async function test(){
    setTestOutput('');
    // create ephemeral conversation for preview (simplified)
    const session_id = crypto.randomUUID();
    const session = await fetch('/api/chat/session', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ session_id }) }).then(r=>r.json());
    await fetch('/api/chat/send', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ conversation_id: session.conversation_id, text: testInput }) });
    const resp = await fetch('/api/ai/stream', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ conversation_id: session.conversation_id }) }).then(r=>r.json());
    setTestOutput(resp.text||'');
  }
  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-lg font-medium">AI Configuration</h2>
      <label className="block">Model
        <input className="border p-2 w-full" value={model} onChange={e=>setModel(e.target.value)} />
      </label>
      <label className="block">System prompt
        <textarea className="border p-2 w-full" value={prompt} onChange={e=>setPrompt(e.target.value)} />
      </label>
      <label className="block">Knowledge base text
        <textarea className="border p-2 w-full" value={kb} onChange={e=>setKb(e.target.value)} />
      </label>
      <button className="px-3 py-2 bg-black text-white rounded" onClick={save}>Save</button>
      <div className="border-t pt-4 space-y-2">
        <h3 className="font-medium">Test Console</h3>
        <input className="border p-2 w-full" placeholder="Ask a question" value={testInput} onChange={e=>setTestInput(e.target.value)} />
        <button className="px-3 py-2 bg-black text-white rounded" onClick={test}>Run</button>
        {testOutput && <pre className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap">{testOutput}</pre>}
      </div>
    </div>
  );
}



