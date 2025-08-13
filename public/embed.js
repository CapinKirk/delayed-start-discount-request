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
  const launcherInner = document.createElement('span');
  launcherInner.style.display = 'inline-flex';
  launcherInner.style.alignItems = 'center';
  launcherInner.style.gap = '8px';
  const avatarSmall = document.createElement('img');
  avatarSmall.style.width = '20px';
  avatarSmall.style.height = '20px';
  avatarSmall.style.borderRadius = '999px';
  avatarSmall.style.border = '2px solid rgba(255,255,255,0.9)';
  avatarSmall.style.background = '#fff';
  avatarSmall.style.objectFit = 'cover';
  const launcherLabel = document.createElement('span');
  launcherLabel.textContent = 'Chat';
  launcherInner.appendChild(avatarSmall);
  launcherInner.appendChild(launcherLabel);
  launcher.appendChild(launcherInner);
  launcher.style.position = 'fixed';
  launcher.style.bottom = '16px';
  launcher.style.right = '16px';
  launcher.style.zIndex = '2147483647';
  launcher.style.padding = '10px 14px';
  launcher.style.borderRadius = '999px';
  launcher.style.background = '#111827';
  launcher.style.color = 'white';
  launcher.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
  launcher.style.transition = 'transform 150ms ease, box-shadow 150ms ease, opacity 200ms ease';
  launcher.addEventListener('mouseenter',()=>{ launcher.style.transform='translateY(-2px)'; launcher.style.boxShadow='0 12px 28px rgba(0,0,0,0.2)'; });
  launcher.addEventListener('mouseleave',()=>{ launcher.style.transform=''; launcher.style.boxShadow='0 8px 20px rgba(0,0,0,0.15)'; });
  // subtle attention pulse
  launcher.animate([
    { transform:'scale(1)', opacity:1 },
    { transform:'scale(1.05)', opacity:0.96 },
    { transform:'scale(1)', opacity:1 }
  ], { duration: 1500, iterations: 1, delay: 2000 });
  document.body.appendChild(launcher);

  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.bottom = '80px';
  panel.style.right = '16px';
  panel.style.width = '420px';
  panel.style.height = '560px';
  panel.style.background = 'white';
  panel.style.border = '1px solid #e5e7eb';
  panel.style.borderRadius = '12px';
  panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
  panel.style.display = 'none';
  panel.style.overflow = 'hidden';
  panel.style.zIndex = '2147483647';

  const header = document.createElement('div');
  const headerInner = document.createElement('div');
  headerInner.style.display = 'flex';
  headerInner.style.alignItems = 'center';
  headerInner.style.gap = '8px';
  const avatar = document.createElement('img');
  avatar.style.width = '32px';
  avatar.style.height = '32px';
  avatar.style.borderRadius = '999px';
  avatar.style.border = '2px solid rgba(255,255,255,0.9)';
  avatar.style.background = '#fff';
  avatar.style.objectFit = 'cover';
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
  messages.style.flex = '1';
  messages.style.padding = '12px';
  messages.style.height = '460px';
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
    title.textContent = theme.greeting || 'Chat with us';
    const primary = (theme.colors && theme.colors.primary) || '#111827';
    header.style.background = primary;
    launcher.style.background = primary;
    if (theme.avatar_url) {
      avatar.src = theme.avatar_url;
      avatar.style.display = '';
      avatarSmall.src = theme.avatar_url;
      avatarSmall.style.display = '';
    } else {
      avatar.style.display = 'none';
      avatarSmall.style.display = 'none';
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
    const isUser = role === 'user';
    if (isUser) {
      row.style.justifyContent = 'flex-end';
      bubble.style.background = '#0b93f6';
      bubble.style.color = 'white';
      bubble.style.borderBottomRightRadius = '4px';
    } else {
      const img = document.createElement('img');
      img.src = avatar.src || '';
      img.style.width = '26px';
      img.style.height = '26px';
      img.style.borderRadius = '999px';
      img.style.border = '2px solid rgba(255,255,255,0.9)';
      img.style.objectFit = 'cover';
      img.style.marginRight = '8px';
      row.appendChild(img);
      bubble.style.background = '#e9e9eb';
      bubble.style.color = '#111827';
      bubble.style.borderBottomLeftRadius = '4px';
    }
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    try { new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3').play().catch(()=>{}); } catch {}
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
    fetch(backendOrigin + '/api/ai/stream'+currentQuery(), { method:'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ conversation_id: conversationId }) }).catch(()=>{})
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
      if (!messages.querySelector('#typing')){
        const tip = document.createElement('div');
        tip.id = 'typing';
        tip.style.display = 'inline-flex';
        tip.style.alignItems = 'center';
        tip.style.gap = '6px';
        const dots = document.createElement('span');
        dots.textContent = '•••';
        dots.style.letterSpacing = '2px';
        dots.style.animation = 'por-dots 1s infinite';
        const label = document.createElement('span');
        label.textContent = (maskRoles ? unifiedDisplayName : 'Support') + ' is typing';
        label.style.fontSize = '12px';
        label.style.color = '#6b7280';
        tip.appendChild(label);
        tip.appendChild(dots);
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



