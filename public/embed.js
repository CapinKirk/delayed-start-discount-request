(function(){
  try { if (window.__POR_EMBED_LOADED__) return; window.__POR_EMBED_LOADED__ = true; } catch {}
  // Try multiple ways to locate the loader script to read data- attributes
  const script = document.currentScript
    || document.getElementById('por-embed-loader')
    || document.querySelector('script[data-chat-config]')
    || document.querySelector('script[src*="/embed.js"]');
  const configId = (script && script.dataset && script.dataset.chatConfig) ? script.dataset.chatConfig : 'demo';
  const backendOrigin = (script && script.dataset && script.dataset.origin)
    ? script.dataset.origin.replace(/\/$/, '')
    : (function(){ try { return new URL(script && script.src ? script.src : '/embed.js', window.location.href).origin; } catch { return window.location.origin; } })();

  const sessionKey = 'por_chat_session_id';
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(sessionKey, sessionId);
  }

  const launcher = document.createElement('button');
  launcher.style.position = 'fixed';
  launcher.style.bottom = '16px';
  launcher.style.right = '16px';
  launcher.style.zIndex = '2147483647';
  launcher.style.width = '64px';
  launcher.style.height = '64px';
  launcher.style.borderRadius = '12px';
  launcher.style.overflow = 'hidden';
  launcher.style.padding = '0';
  launcher.style.border = 'none';
  launcher.style.outline = 'none';
  launcher.style.background = 'transparent';
  launcher.style.boxShadow = '0 12px 30px rgba(0,0,0,0.22)';
  launcher.style.transition = 'transform 150ms ease, box-shadow 150ms ease, opacity 200ms ease';
  const launcherImg = document.createElement('img');
  launcherImg.style.width = '100%';
  launcherImg.style.height = '100%';
  launcherImg.style.objectFit = 'contain';
  launcherImg.style.display = 'none';
  const launcherIcon = document.createElementNS('http://www.w3.org/2000/svg','svg');
  launcherIcon.setAttribute('viewBox','0 0 24 24');
  launcherIcon.style.width = '60px';
  launcherIcon.style.height = '60px';
  launcherIcon.style.background = 'transparent';
  launcherIcon.style.fill = '#fff';
  launcherIcon.innerHTML = '<circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.08"/><path d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9.5l-3.8 2.85A1 1 0 0 1 4 18.05V16a3 3 0 0 1-1-2V6z" fill="currentColor" opacity="0.9"/>';
  launcher.appendChild(launcherImg);
  launcher.appendChild(launcherIcon);
  launcher.addEventListener('mouseenter',()=>{ launcher.style.transform='translateY(-2px)'; launcher.style.boxShadow='0 16px 36px rgba(0,0,0,0.28)'; });
  launcher.addEventListener('mouseleave',()=>{ launcher.style.transform=''; launcher.style.boxShadow='0 12px 30px rgba(0,0,0,0.22)'; });
  document.body.appendChild(launcher);
  // removed decorative ring to avoid any circular border effect
  // Preload theme so launcher avatar shows before first click
  (async ()=>{ try { await applyTheme(); } catch {} })();
  // Idle attention bounce
  setInterval(()=>{
    try { launcher.animate([{ transform:'translateY(0)' }, { transform:'translateY(-4px)' }, { transform:'translateY(0)' }], { duration: 400, iterations: 1 }); } catch {}
  }, 12000);

  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.bottom = '18px';
  panel.style.right = '94px';
  panel.style.width = '420px';
  panel.style.height = '560px';
  panel.style.background = 'white';
  panel.style.border = '0';
  panel.style.borderRadius = '12px';
  panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
  panel.style.display = 'none';
  panel.style.display = 'none';
  panel.style.flexDirection = 'column';
  panel.style.display = 'none';
  panel.style.display = 'none';
  panel.style.overflow = 'hidden';
  panel.style.zIndex = '2147483647';

  const header = document.createElement('div');
  const headerInner = document.createElement('div');
  headerInner.style.display = 'flex';
  headerInner.style.alignItems = 'center';
  headerInner.style.gap = '8px';
  headerInner.style.minHeight = '44px';
  const avatar = document.createElement('img');
  avatar.style.width = '40px';
  avatar.style.height = '40px';
  avatar.style.borderRadius = '8px';
  avatar.style.objectFit = 'contain';
  avatar.style.boxShadow = 'none';
  const title = document.createElement('span');
  title.textContent = 'Chat with us';
  headerInner.appendChild(avatar);
  headerInner.appendChild(title);
  header.appendChild(headerInner);
  header.style.padding = '12px';
  header.style.background = '#111827';
  header.style.color = 'white';
  panel.appendChild(header);

  const messages = document.createElement('div');
  messages.style.flex = '1 1 auto';
  messages.style.display = 'flex';
  messages.style.flexDirection = 'column';
  messages.style.gap = '8px';
  messages.style.padding = '12px';
  messages.style.minHeight = '0';
  messages.style.overflowY = 'auto';
  panel.appendChild(messages);

  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.gap = '8px';
  form.style.padding = '12px';
  form.style.borderTop = '1px solid #e5e7eb';
  form.style.flex = '0 0 auto';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type a message';
  input.style.flex = '1';
  input.style.border = '1px solid #e5e7eb';
  input.style.borderRadius = '8px';
  input.style.padding = '8px';
  input.style.background = '#ffffff';
  input.style.color = '#111827';
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
    title.textContent = theme.greeting || 'Chat with us';
    const primary = (theme.colors && theme.colors.primary) || '#111827';
    header.style.background = primary;
    send.style.background = primary;
    if (theme.avatar_url) {
      avatar.src = theme.avatar_url;
      avatar.style.display = '';
      launcherImg.src = theme.avatar_url;
      launcherImg.onload = () => { launcherImg.style.display = ''; launcherIcon.style.display = 'none'; };
      launcherImg.onerror = () => { launcherImg.style.display = 'none'; launcherIcon.style.display = ''; };
      launcherIcon.style.display = 'none';
    } else {
      avatar.style.display = 'none';
      launcherIcon.style.display = '';
      launcherImg.style.display = 'none';
    }
    if (theme.position === 'bottom-left') {
      launcher.style.left = '16px';
      launcher.style.right = '';
      panel.style.left = '16px';
      panel.style.right = '';
    }
  }

  function currentQuery(){
    return window.location.search || '';
  }
  async function ensureConversation(){
    const res = await fetch(backendOrigin + '/api/chat/session'+currentQuery(), { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ session_id: sessionId, config_id: configId })});
    const data = await res.json();
    conversationId = data.conversation_id;
    await subscribeRealtime();
  }

  let lastSeq = 0;
  let lastServerT = 0;
  function addMessage(role, text){
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.margin = '6px 0';
    row.style.alignItems = 'flex-end';
    const bubble = document.createElement('div');
    bubble.textContent = text;
    bubble.style.maxWidth = '75%';
    bubble.style.padding = '8px 12px';
    bubble.style.borderRadius = '18px';
    bubble.style.lineHeight = '1.4';
    bubble.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    bubble.style.transition = 'transform 120ms ease, opacity 120ms ease';
    bubble.style.transform = 'translateY(4px)';
    bubble.style.opacity = '0';
    const isUser = role === 'user';
    if (isUser) {
      row.style.justifyContent = 'flex-end';
      bubble.style.background = 'linear-gradient(180deg, #0b93f6, #007aff)';
      bubble.style.color = 'white';
      bubble.style.borderBottomRightRadius = '4px';
    } else {
      const img = document.createElement('img');
      img.src = avatar.src || '';
      img.style.width = '32px';
      img.style.height = '32px';
      img.style.borderRadius = '999px';
      img.style.objectFit = 'cover';
      img.style.marginRight = '8px';
      img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.18)';
      row.appendChild(img);
      bubble.style.background = '#f2f2f7';
      bubble.style.color = '#111827';
      bubble.style.borderBottomLeftRadius = '4px';
    }
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    // animate in
    requestAnimationFrame(()=>{ bubble.style.transform = 'translateY(0)'; bubble.style.opacity = '1'; });
    try {
      const url = isUser ? 'https://assets.mixkit.co/active_storage/sfx/2576/2576-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3';
      new Audio(url).play().catch(()=>{});
    } catch {}
  }

  launcher.addEventListener('click', async () => {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    panel.animate([
      { transform:'scale(0.98)', opacity:0.98 },
      { transform:'scale(1)', opacity:1 }
    ], { duration: 150, iterations: 1 });
    if (panel.style.display === 'flex' && !conversationId) {
      await applyTheme();
      await ensureConversation();
      try {
        const hist = await fetch(backendOrigin + '/api/chat/history?conversation_id='+encodeURIComponent(conversationId));
        const hdata = await hist.json();
        (hdata.messages||[]).forEach(m => addMessage(m.role, m.text));
      } catch {}
      try {
        const cfg = await fetch(backendOrigin + '/api/widget/config?public_id='+encodeURIComponent(configId)).then(r=>r.json());
        if (cfg.greeting) {
          addMessage('agent', cfg.greeting);
          await fetch(backendOrigin + '/api/chat/send', { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ conversation_id: conversationId, text: cfg.greeting }) });
          await fetch(backendOrigin + '/api/ai/stream'+currentQuery(), { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ conversation_id: conversationId }) });
        }
      } catch {}
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
    fetch(backendOrigin + '/api/ai/stream'+currentQuery(), { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ conversation_id: conversationId }) }).catch(()=>{})
  });

  async function subscribeRealtime(){
    if (!window.supabase) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.js';
      document.head.appendChild(s);
      await new Promise(r => s.onload = r);
    }
    const boot = await fetch(backendOrigin + '/api/widget/bootstrap?public_id='+encodeURIComponent(configId)).then(r=>r.json());
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
      if (!messages.querySelector('#typing')){
        const tip = document.createElement('div');
        tip.id = 'typing';
        tip.style.display = 'inline-flex';
        tip.style.alignItems = 'center';
        tip.style.gap = '6px';
        const bubble = document.createElement('div');
        bubble.style.background = '#f2f2f7';
        bubble.style.color = '#111827';
        bubble.style.borderRadius = '18px';
        bubble.style.padding = '8px 12px';
        bubble.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        const dots = document.createElement('span');
        dots.textContent = '•••';
        dots.style.letterSpacing = '2px';
        dots.style.animation = 'por-dots 1s infinite';
        const label = document.createElement('span');
        label.textContent = (maskRoles ? unifiedDisplayName : 'Support') + ' is typing';
        label.style.fontSize = '12px';
        label.style.color = '#6b7280';
        bubble.appendChild(label);
        bubble.appendChild(dots);
        tip.appendChild(bubble);
        messages.appendChild(tip);
        const style = document.createElement('style');
        style.textContent = '@keyframes por-dots { 0%{opacity:.2} 50%{opacity:1} 100%{opacity:.2} }';
        document.head.appendChild(style);
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
    if (panel.style.display !== 'flex') panel.style.display = 'flex';
  }

  async function scheduleAutoOpen(){
    // bootstrap to fetch behavior config
    if (!window.supabase) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.js';
      document.head.appendChild(s);
      await new Promise(r => s.onload = r);
    }
    const boot = await fetch(backendOrigin + '/api/widget/bootstrap?public_id='+encodeURIComponent(configId)).then(r=>r.json());
    maskRoles = !!boot.mask_roles;
    unifiedDisplayName = boot.unified_display_name || 'Support';
    autoOpen = {
      enabled: !!boot.auto_open_enabled,
      delayMs: boot.auto_open_delay_ms || 5000,
      greeting: boot.auto_open_greeting || '',
      frequency: boot.auto_open_frequency || 'once_per_session'
    };
    // If the embedding site requests auto-pop, honor it regardless of server default
    try {
      if (script && script.dataset) {
        if (script.dataset.autopop === 'true') {
          autoOpen.enabled = true;
        }
        if (script.dataset.autopopDelayMs) {
          const ms = parseInt(script.dataset.autopopDelayMs, 10);
          if (!Number.isNaN(ms)) autoOpen.delayMs = ms;
        }
      }
    } catch {}
    if (shouldAutoOpen()) {
      setTimeout(async () => {
        openPanel();
        if (!conversationId) {
          await applyTheme();
          await ensureConversation();
        }
        if (autoOpen.greeting) {
          // enqueue greeting into pipeline like a real agent message
          addMessage('agent', autoOpen.greeting);
          try { await fetch(backendOrigin + '/api/chat/send', { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ conversation_id: conversationId, text: autoOpen.greeting }) }); } catch {}
          try {
            const r = await fetch(backendOrigin + '/api/ai/stream'+currentQuery(), { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ conversation_id: conversationId }) });
            const j = await r.json().catch(()=>null);
            if (j && j.text) { addMessage('agent', j.text); }
          } catch {}
        }
      }, autoOpen.delayMs);
    }
  }

  scheduleAutoOpen();
  function hexToRgba(hex, alpha){
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return 'rgba(17,24,39,'+alpha+')';
    const r = parseInt(m[1],16), g=parseInt(m[2],16), b=parseInt(m[3],16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
})();



