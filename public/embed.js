(function(){
  const script = document.currentScript;
  const configId = script?.dataset?.chatConfig || 'demo';
  const backendOrigin = (script?.dataset?.origin) ? script.dataset.origin.replace(/\/$/, '') : (function(){ try { return new URL(script.src, window.location.href).origin; } catch { return window.location.origin; } })();

  const sessionKey = 'por_chat_session_id';
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(sessionKey, sessionId);
  }

  const launcher = document.createElement('button');
  launcher.textContent = 'Chat';
  launcher.style.position = 'fixed';
  launcher.style.bottom = '16px';
  launcher.style.right = '16px';
  launcher.style.zIndex = '2147483647';
  launcher.style.padding = '10px 14px';
  launcher.style.borderRadius = '999px';
  launcher.style.background = '#111827';
  launcher.style.color = 'white';
  document.body.appendChild(launcher);

  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.bottom = '70px';
  panel.style.right = '16px';
  panel.style.width = '360px';
  panel.style.height = '480px';
  panel.style.background = 'white';
  panel.style.border = '1px solid #e5e7eb';
  panel.style.borderRadius = '12px';
  panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
  panel.style.display = 'none';
  panel.style.overflow = 'hidden';
  panel.style.zIndex = '2147483647';

  const header = document.createElement('div');
  header.textContent = 'Chat with us';
  header.style.padding = '12px';
  header.style.background = '#111827';
  header.style.color = 'white';
  panel.appendChild(header);

  const messages = document.createElement('div');
  messages.style.flex = '1';
  messages.style.padding = '12px';
  messages.style.height = '380px';
  messages.style.overflowY = 'auto';
  panel.appendChild(messages);

  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.gap = '8px';
  form.style.padding = '12px';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type a message';
  input.style.flex = '1';
  input.style.border = '1px solid #e5e7eb';
  input.style.borderRadius = '8px';
  input.style.padding = '8px';
  const send = document.createElement('button');
  send.type = 'submit';
  send.textContent = 'Send';
  send.style.padding = '8px 12px';
  send.style.background = '#111827';
  send.style.color = 'white';
  send.style.borderRadius = '8px';
  form.appendChild(input);
  form.appendChild(send);
  panel.appendChild(form);

  document.body.appendChild(panel);

  let conversationId = null;
  let realtimeChannel = null;
  let typingAI = false;
  let typingAgent = false;
  let maskRoles = true;
  let unifiedDisplayName = 'Support';
  let autoOpen = { enabled:false, delayMs:5000, greeting:'', frequency:'once_per_session' };

  async function applyTheme(){
    const res = await fetch(backendOrigin + '/api/widget/config?public_id='+encodeURIComponent(configId));
    const theme = await res.json();
    header.textContent = theme.greeting || 'Chat with us';
    header.style.background = (theme.colors && theme.colors.primary) || '#111827';
    launcher.style.background = (theme.colors && theme.colors.primary) || '#111827';
    if (theme.position === 'bottom-left') {
      launcher.style.left = '16px';
      launcher.style.right = '';
      panel.style.left = '16px';
      panel.style.right = '';
    }
  }

  async function ensureConversation(){
    const res = await fetch(backendOrigin + '/api/chat/session', { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ session_id: sessionId, config_id: configId })});
    const data = await res.json();
    conversationId = data.conversation_id;
    await subscribeRealtime();
  }

  let lastSeq = 0;
  let lastServerT = 0;
  function addMessage(role, text){
    const div = document.createElement('div');
    const name = role === 'user' ? 'You' : (maskRoles ? unifiedDisplayName : (role === 'agent' ? 'Support' : 'Assistant'));
    div.textContent = name + ': ' + text;
    div.style.margin = '6px 0';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  launcher.addEventListener('click', async () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block' && !conversationId) {
      await applyTheme();
      await ensureConversation();
      const hist = await fetch(backendOrigin + '/api/chat/history?conversation_id='+encodeURIComponent(conversationId));
      const hdata = await hist.json();
      (hdata.messages||[]).forEach(m => addMessage(m.role, m.text));
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value='';
    addMessage('user', text);
    await fetch(backendOrigin + '/api/chat/send', { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ conversation_id: conversationId, text }) });
    // Trigger AI on server; realtime will deliver
    fetch(backendOrigin + '/api/ai/stream', { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ conversation_id: conversationId }) }).catch(()=>{})
  });

  async function subscribeRealtime(){
    if (!window.supabase) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.js';
      document.head.appendChild(s);
      await new Promise(r => s.onload = r);
    }
    const boot = await fetch(backendOrigin + '/api/widget/bootstrap').then(r=>r.json());
    const supabase = window.supabase.createClient(boot.supabaseUrl, boot.supabaseAnonKey);
    maskRoles = !!boot.mask_roles;
    unifiedDisplayName = boot.unified_display_name || 'Support';
    autoOpen = {
      enabled: !!boot.auto_open_enabled,
      delayMs: boot.auto_open_delay_ms || 5000,
      greeting: boot.auto_open_greeting || '',
      frequency: boot.auto_open_frequency || 'once_per_session'
    };
    realtimeChannel = supabase.channel('conversation_'+conversationId, { config: { broadcast: { self: true } } });
    realtimeChannel.on('broadcast', { event: 'message.created' }, ({ payload }) => {
      if (payload.seq && payload.seq < lastSeq) return; // monotonic
      lastSeq = payload.seq || lastSeq;
      lastServerT = payload.t || lastServerT;
      addMessage(payload.role, payload.text);
    });
    realtimeChannel.on('broadcast', { event: 'ai.delta' }, ({ payload }) => {
      if (payload.seq && payload.seq < lastSeq) return;
      lastSeq = payload.seq || lastSeq;
      lastServerT = payload.t || lastServerT;
      typingAI = true;
      // Generic typing indicator
      if (!messages.querySelector('#typing')){
        const tip = document.createElement('div');
        tip.id = 'typing';
        tip.textContent = (maskRoles ? unifiedDisplayName : 'Support') + ' is typing…';
        tip.style.fontSize = '12px';
        tip.style.color = '#6b7280';
        messages.appendChild(tip);
      }
    });
    realtimeChannel.on('broadcast', { event: 'ai.done' }, async ({ payload }) => {
      if (payload.seq && payload.seq < lastSeq) return;
      lastSeq = payload.seq || lastSeq;
      lastServerT = payload.t || lastServerT;
      // Fetch latest AI message for text, or rely on server response; for now no-op
      typingAI = false;
      const tip = messages.querySelector('#typing');
      if (tip) tip.remove();
    });
    // remove role-disclosing banners
    realtimeChannel.on('broadcast', { event: 'closed' }, ({ payload }) => {
      if (payload.seq && payload.seq < lastSeq) return;
      lastSeq = payload.seq || lastSeq;
      lastServerT = payload.t || lastServerT;
      const div = document.createElement('div');
      div.textContent = 'Chat ended';
      div.style.background = '#fee2e2';
      div.style.padding = '6px 8px';
      div.style.borderRadius = '6px';
      messages.appendChild(div);
    });
    await realtimeChannel.subscribe();
  }

  // Reconnect with backoff
  let reconnectDelay = 500;
  async function reconnect(){
    try {
      await subscribeRealtime();
      reconnectDelay = 500;
      // gap fill
      const hist = await fetch(backendOrigin + '/api/chat/history?conversation_id='+encodeURIComponent(conversationId));
      const hdata = await hist.json();
      (hdata.messages||[]).forEach(m => addMessage(m.role, m.text));
    } catch {
      setTimeout(reconnect, Math.min(10000, reconnectDelay += (Math.random()*reconnectDelay)));
    }
  }

  // Auto open logic
  function shouldAutoOpen(){
    if (!autoOpen.enabled) return false;
    if (autoOpen.frequency === 'every_visit') return true;
    const key = 'por_chat_auto_opened';
    const opened = sessionStorage.getItem(key);
    if (opened) return false;
    sessionStorage.setItem(key, '1');
    return true;
  }

  function openPanel(){
    if (panel.style.display !== 'block') panel.style.display = 'block';
  }

  async function scheduleAutoOpen(){
    // bootstrap to fetch behavior config
    if (!window.supabase) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.js';
      document.head.appendChild(s);
      await new Promise(r => s.onload = r);
    }
    const boot = await fetch(backendOrigin + '/api/widget/bootstrap').then(r=>r.json());
    maskRoles = !!boot.mask_roles;
    unifiedDisplayName = boot.unified_display_name || 'Support';
    autoOpen = {
      enabled: !!boot.auto_open_enabled,
      delayMs: boot.auto_open_delay_ms || 5000,
      greeting: boot.auto_open_greeting || '',
      frequency: boot.auto_open_frequency || 'once_per_session'
    };
    if (shouldAutoOpen()) {
      setTimeout(async () => {
        openPanel();
        if (!conversationId) {
          await applyTheme();
          await ensureConversation();
        }
        if (autoOpen.greeting) {
          addMessage('agent', autoOpen.greeting);
        }
      }, autoOpen.delayMs);
    }
  }

  scheduleAutoOpen();
})();



