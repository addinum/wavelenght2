(() => {
  const screens = {
    landing: document.getElementById('landing'),
    searching: document.getElementById('searching'),
    chat: document.getElementById('chat'),
    inbox: document.getElementById('inbox'),
    thread: document.getElementById('thread'),
  };

  const nameInput = document.getElementById('wlHandleInput');
  const startBtn = document.getElementById('startBtn');
  const codeInput = document.getElementById('wlJoinCodeInput');
  const codeBtn = document.getElementById('codeBtn');
  const cancelSearchBtn = document.getElementById('cancelSearchBtn');
  const skipBtn = document.getElementById('skipBtn');
  const leaveBtn = document.getElementById('leaveBtn');
  const friendBtn = document.getElementById('friendBtn');
  const chatLog = document.getElementById('chatLog');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatWithLabel = document.getElementById('chatWithLabel');
  const typingIndicator = document.getElementById('typingIndicator');
  const leftToast = document.getElementById('leftToast');
  const toastFindBtn = document.getElementById('toastFindBtn');
  const dialFreq = document.getElementById('dialFreq');
  const onlineCount = document.getElementById('onlineCount');
  const scanLabel = document.getElementById('scanLabel');
  const scanSub = document.getElementById('scanSub');
  const contactsSection = document.getElementById('contactsSection');
  const contactsList = document.getElementById('contactsList');
  const emojiBtn = document.getElementById('emojiBtn');
  const emojiPanel = document.getElementById('emojiPanel');
  const friendRequestToast = document.getElementById('friendRequestToast');
  const friendRequestText = document.getElementById('friendRequestText');
  const friendAcceptBtn = document.getElementById('friendAcceptBtn');
  const friendDeclineBtn = document.getElementById('friendDeclineBtn');
  const friendCodeToast = document.getElementById('friendCodeToast');
  const friendCodeText = document.getElementById('friendCodeText');

  const inboxBtn = document.getElementById('inboxBtn');
  const inboxBadge = document.getElementById('inboxBadge');
  const inboxBackBtn = document.getElementById('inboxBackBtn');
  const inboxList = document.getElementById('inboxList');
  const avatarGrid = document.getElementById('avatarGrid');
  const chatAvatar = document.getElementById('chatAvatar');
  const inboxEmpty = document.getElementById('inboxEmpty');
  const threadBackBtn = document.getElementById('threadBackBtn');
  const threadWithLabel = document.getElementById('threadWithLabel');
  const threadAvatar = document.getElementById('threadAvatar');
  const threadLog = document.getElementById('threadLog');
  const threadForm = document.getElementById('threadForm');
  const threadInput = document.getElementById('threadInput');
  const micBtn = document.getElementById('micBtn');
  const recordBar = document.getElementById('recordBar');
  const recordTime = document.getElementById('recordTime');
  const recordCancelBtn = document.getElementById('recordCancelBtn');
  const recordSendBtn = document.getElementById('recordSendBtn');

  let ws = null;
  let typingTimeout = null;
  let remoteTypingTimeout = null;
  let currentStrangerName = 'Stranger';
  let pendingConnectByCode = false;
  let chatHistoryPushed = false;
  let reconnectAttempts = 0;
  let userInitiatedClose = false;
  let currentThreadContactId = null;
  let latestContacts = [];

  // ---------- Persistent device identity (for the inbox feature only) ----------
  const DEVICE_ID_KEY = 'wavelength_device_id';

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Math.random().toString(36).slice(2) + Date.now());
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }
  const myDeviceId = getDeviceId();

  // ---------- Contacts (legacy quick-reconnect codes, stored locally) ----------
  const CONTACTS_KEY = 'wavelength_contacts';

  function getLocalContacts() {
    try {
      return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveLocalContact(code, name) {
    const contacts = getLocalContacts().filter((c) => c.code !== code);
    contacts.unshift({ code, name: name || 'Stranger', addedAt: Date.now() });
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts.slice(0, 30)));
    renderLocalContacts();
  }

  function removeLocalContact(code) {
    const contacts = getLocalContacts().filter((c) => c.code !== code);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    renderLocalContacts();
  }

  function renderLocalContacts() {
    const contacts = getLocalContacts();
    if (contacts.length === 0) {
      contactsSection.classList.add('hidden');
      return;
    }
    contactsSection.classList.remove('hidden');
    contactsList.innerHTML = '';
    contacts.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'contact-row';
      row.innerHTML = `
        <span class="contact-name">${escapeHtml(c.name)}</span>
        <div class="contact-actions">
          <button class="btn-chip contact-connect" data-code="${c.code}">Connect</button>
          <button class="btn-chip btn-chip--muted contact-remove" data-code="${c.code}">✕</button>
        </div>`;
      contactsList.appendChild(row);
    });

    contactsList.querySelectorAll('.contact-connect').forEach((btn) => {
      btn.addEventListener('click', () => {
        codeInput.value = btn.dataset.code;
        codeBtn.click();
      });
    });
    contactsList.querySelectorAll('.contact-remove').forEach((btn) => {
      btn.addEventListener('click', () => removeLocalContact(btn.dataset.code));
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Timestamp helpers (for the WhatsApp-style Inbox) ----------

  // ---------- Chosen-avatar system (10 stylized presets, no real login needed) ----------
  // Note: these are original stylized SVG character faces, not licensed
  // anime artwork — a lightweight, on-brand alternative that doesn't need
  // any external image assets.
  const AVATAR_PRESETS = [
    { id: 'a1',  style: 'short', bg1: '#2b0f2e', bg2: '#ff2e93', hair: '#1c1116', skin: '#f2c9a0' },
    { id: 'a2',  style: 'long',  bg1: '#0f1f2e', bg2: '#3ba7ff', hair: '#3a2213', skin: '#e8b48a' },
    { id: 'a3',  style: 'short', bg1: '#2e0f14', bg2: '#ff6b4a', hair: '#0d0d0d', skin: '#c98a5e' },
    { id: 'a4',  style: 'long',  bg1: '#1a0f2e', bg2: '#b26bff', hair: '#5a2a0a', skin: '#f4d3b0' },
    { id: 'a5',  style: 'short', bg1: '#0f2e22', bg2: '#34e19a', hair: '#3a1a05', skin: '#e0a878' },
    { id: 'a6',  style: 'long',  bg1: '#2e2a0f', bg2: '#ffd23f', hair: '#1a1a1a', skin: '#f0c39a' },
    { id: 'a7',  style: 'short', bg1: '#0f172e', bg2: '#4a7dff', hair: '#2b170d', skin: '#d9a978' },
    { id: 'a8',  style: 'long',  bg1: '#2e0f28', bg2: '#ff4da6', hair: '#7a3b12', skin: '#f7dcc0' },
    { id: 'a9',  style: 'short', bg1: '#122e0f', bg2: '#8bd450', hair: '#141414', skin: '#b97b52' },
    { id: 'a10', style: 'long',  bg1: '#0f232e', bg2: '#59e3e3', hair: '#241608', skin: '#eccba3' },
  ];

  function findAvatarPreset(id) {
    return AVATAR_PRESETS.find((p) => p.id === id) || AVATAR_PRESETS[0];
  }

  function buildAvatarSVG(preset) {
    const hair = preset.style === 'long'
      ? `<path d="M8,45 Q8,10 50,8 Q92,10 92,45 L92,72 Q80,55 78,78 L78,50 Q50,40 22,50 L22,78 Q20,55 8,72 Z" fill="${preset.hair}"/>`
      : `<path d="M10,42 Q14,8 50,8 Q86,8 90,42 Q78,26 50,24 Q22,26 10,42 Z" fill="${preset.hair}"/>`;
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-${preset.id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${preset.bg1}"/>
            <stop offset="1" stop-color="${preset.bg2}"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#bg-${preset.id})"/>
        <circle cx="50" cy="57" r="25" fill="${preset.skin}"/>
        ${hair}
        <circle cx="41" cy="55" r="2.8" fill="#241620"/>
        <circle cx="59" cy="55" r="2.8" fill="#241620"/>
        <path d="M42,67 Q50,72 58,67" stroke="#241620" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      </svg>`;
  }

  const AVATAR_ID_KEY = 'wavelength_avatar_id';

  function getMyAvatarId() {
    return localStorage.getItem(AVATAR_ID_KEY) || 'a1';
  }

  function setMyAvatarId(id) {
    localStorage.setItem(AVATAR_ID_KEY, id);
    sendWs('set_avatar', { avatarId: id });
    renderAvatarPicker();
  }

  function renderAvatarPicker() {
    const selected = getMyAvatarId();
    avatarGrid.innerHTML = '';
    AVATAR_PRESETS.forEach((preset) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option' + (preset.id === selected ? ' avatar-option--selected' : '');
      btn.innerHTML = buildAvatarSVG(preset);
      btn.addEventListener('click', () => setMyAvatarId(preset.id));
      avatarGrid.appendChild(btn);
    });
  }

  // Renders a chosen-avatar SVG into any small circular avatar slot
  // (inbox rows, thread header, live chat header) given an avatar id.
  function renderAvatarInto(el, avatarId) {
    el.innerHTML = buildAvatarSVG(findAvatarPreset(avatarId || 'a1'));
  }

  function formatInboxTime(dateInput) {
    const date = new Date(dateInput);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    if (isYesterday) return 'Yesterday';
    const daysAgo = Math.floor((now - date) / 86400000);
    if (daysAgo < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function formatBubbleTime(dateInput) {
    return new Date(dateInput).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  renderLocalContacts();

  // ---------- Screen switching ----------
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.add('hidden'));
    screens[name].classList.remove('hidden');
  }

  function randomFreq() {
    return (Math.random() * (108 - 88) + 88).toFixed(1);
  }
  setInterval(() => { dialFreq.textContent = randomFreq(); }, 900);

  // ---------- Back button navigation (mobile & desktop) ----------
  // Every "deeper" screen push one history entry. The single popstate
  // handler below is the one place that decides where "back" goes,
  // so the phone's hardware back button and the on-screen back buttons
  // both funnel through the same logic and stay in sync.
  function pushNavState(screenName) {
    history.pushState({ screen: screenName }, '', location.href);
  }

  function pushChatHistoryState() {
    if (!chatHistoryPushed) {
      pushNavState('chat');
      chatHistoryPushed = true;
    }
  }

  window.addEventListener('popstate', () => {
    if (!screens.chat.classList.contains('hidden')) {
      // Live stranger chat: confirm before actually leaving.
      const reallyLeave = confirm('Leave this chat and go back to the main screen?');
      if (reallyLeave) {
        chatHistoryPushed = false;
        exitChatToLanding();
      } else {
        pushChatHistoryState(); // re-trap for next back press
      }
      return;
    }

    if (!screens.thread.classList.contains('hidden')) {
      // Thread -> Inbox, no confirmation needed.
      if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording(false);
      currentThreadContactId = null;
      showScreen('inbox');
      sendWs('get_contacts');
      return;
    }

    if (!screens.inbox.classList.contains('hidden')) {
      // Inbox -> Landing/home.
      showScreen('landing');
      return;
    }

    // On landing/searching already: no pushed state left to intercept,
    // so the next back press exits to the browser as normal.
  });

  function exitChatToLanding() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leave' }));
    }
    emojiPanel.classList.add('hidden');
    showScreen('landing');
    refreshInboxBadge();
  }

  // ---------- Sound + browser notification ----------
  let audioCtx = null;
  function playBeep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // audio not available — silently skip
    }
  }

  function notifyMatch(strangerName) {
    playBeep();
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification('Wavelength', { body: `Connected to ${strangerName}` });
    }
  }

  function notifyInboxMessage(name) {
    playBeep();
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification('Wavelength', { body: `New message from ${name}` });
    }
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  // ---------- WebSocket (single persistent connection for the whole app) ----------
  function connectSocket() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}`);

    ws.addEventListener('open', () => {
      reconnectAttempts = 0;
      ws.send(JSON.stringify({ type: 'identify', deviceId: myDeviceId }));
      const name = nameInput.value.trim();
      if (name) ws.send(JSON.stringify({ type: 'set_name', name }));
      ws.send(JSON.stringify({ type: 'set_avatar', avatarId: getMyAvatarId() }));
      refreshInboxBadge();

      if (pendingConnectByCode) {
        ws.send(JSON.stringify({ type: 'connect_code', code: pendingConnectByCode }));
        pendingConnectByCode = false;
      }
    });

    ws.addEventListener('message', (event) => {
      handleServerMessage(JSON.parse(event.data));
    });

    ws.addEventListener('close', () => {
      if (userInitiatedClose) {
        userInitiatedClose = false;
        return;
      }
      attemptReconnect();
    });
  }

  function attemptReconnect() {
    reconnectAttempts += 1;
    const delay = Math.min(1000 * reconnectAttempts, 5000);
    setTimeout(connectSocket, delay);
  }

  function sendWs(type, payload = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  function handleServerMessage(msg) {
    switch (msg.type) {
      case 'online_count':
        onlineCount.textContent = `${msg.count} ${msg.count === 1 ? 'person' : 'people'} online now`;
        break;

      case 'waiting':
        scanLabel.innerHTML = 'Scanning frequencies<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
        scanSub.textContent = 'Looking for someone else tuned in right now';
        showScreen('searching');
        break;

      case 'waiting_code':
        scanLabel.textContent = 'Waiting for your contact…';
        scanSub.textContent = `Share code ${msg.code} with them, or wait — they may already have it`;
        showScreen('searching');
        break;

      case 'matched':
        currentStrangerName = msg.strangerName || 'Stranger';
        chatLog.innerHTML = '';
        chatWithLabel.textContent = `Connected to ${currentStrangerName}`;
        renderAvatarInto(chatAvatar, msg.strangerAvatarId);
        showScreen('chat');
        pushChatHistoryState();
        addSystemBubble("You're connected. Say hi 👋");
        leftToast.classList.add('hidden');
        notifyMatch(currentStrangerName);
        chatInput.focus();
        break;

      case 'chat_message':
        addBubble(chatLog, msg.text, 'stranger');
        hideTyping();
        break;

      case 'typing':
        showTyping();
        break;

      case 'stranger_left':
        leftToast.classList.remove('hidden');
        addSystemBubble('The stranger disconnected.');
        break;

      case 'friend_request_received':
        friendRequestText.textContent = `${msg.fromName} wants to save each other as contacts`;
        friendRequestToast.classList.remove('hidden');
        break;

      case 'friend_response':
        if (!msg.accepted) addSystemBubble('They declined the contact request.');
        break;

      case 'friend_code':
        saveLocalContact(msg.code, msg.strangerName);
        friendCodeText.textContent = `Saved! You can now message ${msg.strangerName} anytime from your Inbox.`;
        friendCodeToast.classList.remove('hidden');
        addSystemBubble(`Saved as a contact. Message them anytime from your Inbox — no need to reconnect.`);
        setTimeout(() => friendCodeToast.classList.add('hidden'), 6000);
        break;

      // ---- Inbox events ----
      case 'contacts_list':
        latestContacts = msg.contacts || [];
        renderInboxList();
        updateInboxBadge();
        break;

      case 'thread_history':
        if (msg.contactId === currentThreadContactId) {
          threadLog.innerHTML = '';
          msg.messages.forEach((m) => {
            const who = m.fromId === myDeviceId ? 'me' : 'them';
            if (m.msgType === 'voice') {
              addVoiceBubble(m.audioData, m.duration, who, m.createdAt, m._id || m.id);
            } else {
              addThreadBubble(m.text, who, m.createdAt, m._id || m.id);
            }
          });
          if (msg.messages.some((m) => m.fromId === myDeviceId)) markThreadBubblesRead();
        }
        break;

      case 'inbox_message': {
        const isForMe = msg.toId === myDeviceId;
        const isFromMe = msg.fromId === myDeviceId;
        const otherPartyId = isFromMe ? msg.toId : msg.fromId;
        const who = isFromMe ? 'me' : 'them';

        if (!screens.thread.classList.contains('hidden') && currentThreadContactId === otherPartyId) {
          hideThreadTyping();
          if (msg.msgType === 'voice') {
            addVoiceBubble(msg.audioData, msg.duration, who, msg.createdAt, msg.id);
          } else {
            addThreadBubble(msg.text, who, msg.createdAt, msg.id);
          }
        } else if (isForMe) {
          const contact = latestContacts.find((c) => c.contactId === otherPartyId);
          notifyInboxMessage(contact ? contact.name : 'a contact');
        }
        sendWs('get_contacts'); // refresh unread counts / previews
        break;
      }

      case 'voice_note_rejected':
        addSystemBubble(msg.reason || "Couldn't send that voice note.");
        break;

      case 'inbox_typing':
        if (!screens.thread.classList.contains('hidden') && currentThreadContactId === msg.fromId) {
          showThreadTyping();
        }
        break;

      case 'read_receipt':
        if (!screens.thread.classList.contains('hidden') && currentThreadContactId === msg.byId) {
          markThreadBubblesRead();
        }
        break;
    }
  }

  function addBubble(logEl, text, who) {
    const div = document.createElement('div');
    div.className = `bubble bubble--${who}`;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    div.innerHTML = escapeHtml(text).replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  // WhatsApp-style bubble for the Inbox/Thread screen (includes timestamp + read ticks).
  function addThreadBubble(text, who, timestamp, msgId) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const linked = escapeHtml(text).replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    const row = document.createElement('div');
    row.className = `wa-bubble-row wa-bubble-row--${who === 'me' ? 'me' : 'them'}`;

    const bubble = document.createElement('div');
    bubble.className = `wa-bubble wa-bubble--${who === 'me' ? 'me' : 'them'}`;
    if (msgId) bubble.dataset.msgId = msgId;

    const tickHtml = who === 'me' ? '<span class="wa-tick">✓</span>' : '';
    bubble.innerHTML = `<span class="wa-bubble__text">${linked}</span><span class="wa-bubble__time">${formatBubbleTime(timestamp || Date.now())}${tickHtml}</span>`;

    row.appendChild(bubble);
    threadLog.appendChild(row);
    threadLog.scrollTop = threadLog.scrollHeight;
  }

  // Voice note bubble: play/pause button + a decorative waveform that fills
  // in as playback progresses, using the audio element's real currentTime.
  function addVoiceBubble(audioData, duration, who, timestamp, msgId) {
    const row = document.createElement('div');
    row.className = `wa-bubble-row wa-bubble-row--${who === 'me' ? 'me' : 'them'}`;

    const bubble = document.createElement('div');
    bubble.className = `wa-bubble wa-bubble--${who === 'me' ? 'me' : 'them'}`;
    if (msgId) bubble.dataset.msgId = msgId;

    const barCount = 28;
    let bars = '';
    for (let i = 0; i < barCount; i++) {
      // Deterministic pseudo-random heights so it looks like a waveform.
      const h = 6 + Math.round(14 * Math.abs(Math.sin(i * 12.9898 + (msgId ? msgId.length : 1))));
      bars += `<span style="height:${h}px" data-bar="${i}"></span>`;
    }

    const tickHtml = who === 'me' ? '<span class="wa-tick">✓</span>' : '';
    bubble.innerHTML = `
      <div class="wa-voice-bubble">
        <button type="button" class="wa-voice-play">▶</button>
        <div class="wa-voice-waveform">${bars}</div>
        <span class="wa-voice-duration">${formatDuration(duration)}</span>
      </div>
      <span class="wa-bubble__time">${formatBubbleTime(timestamp || Date.now())}${tickHtml}</span>
    `;

    const audio = new Audio(audioData);
    const playBtn = bubble.querySelector('.wa-voice-play');
    const waveformBars = bubble.querySelectorAll('.wa-voice-waveform span');
    const durationLabel = bubble.querySelector('.wa-voice-duration');

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        // Pause any other currently-playing voice note first.
        document.querySelectorAll('audio[data-wl-playing]').forEach((el) => {
          if (el !== audio) { el.pause(); el.currentTime = 0; }
        });
        audio.play().catch(() => {});
        audio.dataset.wlPlaying = 'true';
        playBtn.textContent = '⏸';
      } else {
        audio.pause();
        playBtn.textContent = '▶';
      }
    });

    audio.addEventListener('timeupdate', () => {
      const progress = audio.duration ? audio.currentTime / audio.duration : 0;
      const filledCount = Math.round(progress * barCount);
      waveformBars.forEach((bar, i) => bar.classList.toggle('wa-voice-played', i < filledCount));
      const remaining = Math.max(0, (audio.duration || duration) - audio.currentTime);
      durationLabel.textContent = formatDuration(remaining);
    });

    audio.addEventListener('ended', () => {
      playBtn.textContent = '▶';
      waveformBars.forEach((bar) => bar.classList.remove('wa-voice-played'));
      durationLabel.textContent = formatDuration(duration);
      delete audio.dataset.wlPlaying;
    });

    row.appendChild(bubble);
    threadLog.appendChild(row);
    threadLog.scrollTop = threadLog.scrollHeight;
  }

  function formatDuration(seconds) {
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  }

  function markThreadBubblesRead() {
    threadLog.querySelectorAll('.wa-bubble--me .wa-tick').forEach((tick) => {
      tick.textContent = '✓✓';
      tick.classList.add('wa-tick--read');
    });
  }

  // ---------- Inbox typing indicator ----------
  let threadTypingRow = null;
  let threadTypingHideTimeout = null;

  function showThreadTyping() {
    if (!threadTypingRow) {
      threadTypingRow = document.createElement('div');
      threadTypingRow.className = 'wa-typing-row';
      threadTypingRow.innerHTML = '<div class="wa-typing-bubble"><span></span><span></span><span></span></div>';
      threadLog.appendChild(threadTypingRow);
      threadLog.scrollTop = threadLog.scrollHeight;
    }
    clearTimeout(threadTypingHideTimeout);
    threadTypingHideTimeout = setTimeout(hideThreadTyping, 2500);
  }

  function hideThreadTyping() {
    if (threadTypingRow) {
      threadTypingRow.remove();
      threadTypingRow = null;
    }
  }

  function addSystemBubble(text) {
    const div = document.createElement('div');
    div.className = 'bubble bubble--system';
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function showTyping() {
    typingIndicator.classList.remove('hidden');
    clearTimeout(remoteTypingTimeout);
    remoteTypingTimeout = setTimeout(hideTyping, 2000);
  }
  function hideTyping() {
    typingIndicator.classList.add('hidden');
  }

  // ---------- Inbox rendering ----------
  function updateInboxBadge() {
    const totalUnread = latestContacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    if (totalUnread > 0) {
      inboxBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
      inboxBadge.classList.remove('hidden');
    } else {
      inboxBadge.classList.add('hidden');
    }
  }

  function refreshInboxBadge() {
    sendWs('get_contacts');
  }

  function renderInboxList() {
    inboxList.querySelectorAll('.inbox-row').forEach((el) => el.remove());
    if (latestContacts.length === 0) {
      inboxEmpty.classList.remove('hidden');
      return;
    }
    inboxEmpty.classList.add('hidden');

    latestContacts.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'inbox-row';
      const unread = c.unreadCount > 0;
      row.innerHTML = `
        <span class="inbox-row__avatar"></span>
        <div class="inbox-row__main">
          <div class="inbox-row__top">
            <span class="inbox-row__name">${escapeHtml(c.name)}</span>
            <span class="inbox-row__time${unread ? ' inbox-row__time--unread' : ''}">${formatInboxTime(c.lastAt)}</span>
          </div>
          <div class="inbox-row__bottom">
            <span class="inbox-row__preview">${c.lastMessage ? escapeHtml(c.lastMessage) : 'Say hi…'}</span>
            ${unread ? `<span class="inbox-row__badge">${c.unreadCount > 99 ? '99+' : c.unreadCount}</span>` : ''}
          </div>
        </div>
      `;
      renderAvatarInto(row.querySelector('.inbox-row__avatar'), c.avatar);
      row.addEventListener('click', () => openThread(c.contactId, c.name, c.avatar));
      inboxList.appendChild(row);
    });
  }

  function openThread(contactId, name, avatarId) {
    currentThreadContactId = contactId;
    threadWithLabel.textContent = name;
    renderAvatarInto(threadAvatar, avatarId);
    threadLog.innerHTML = '';
    threadTypingRow = null;
    showScreen('thread');
    pushNavState('thread');
    sendWs('open_thread', { contactId });
    threadInput.focus();
  }

  // ---------- Landing actions ----------
  startBtn.addEventListener('click', () => {
    requestNotificationPermission();
    pendingConnectByCode = false;
    showScreen('searching');
    scanLabel.innerHTML = 'Scanning frequencies<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
    scanSub.textContent = 'Looking for someone else tuned in right now';
    sendWs('find');
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startBtn.click();
  });
  nameInput.addEventListener('change', () => {
    const name = nameInput.value.trim();
    if (name) sendWs('set_name', { name });
  });

  codeBtn.addEventListener('click', () => {
    const code = codeInput.value.trim().toUpperCase();
    if (!code) return;
    requestNotificationPermission();
    showScreen('searching');
    sendWs('connect_code', { code });
  });

  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') codeBtn.click();
  });

  // ---------- Searching actions ----------
  cancelSearchBtn.addEventListener('click', () => {
    sendWs('leave');
    pendingConnectByCode = false;
    showScreen('landing');
  });

  // ---------- Chat actions (live random/paired chat) ----------
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    sendWs('chat_message', { text });
    addBubble(chatLog, text, 'me');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    emojiPanel.classList.add('hidden');
  });

  chatInput.addEventListener('input', () => {
    sendWs('typing');
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  chatInput.addEventListener('focus', () => {
    setTimeout(() => {
      chatInput.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 200);
  });

  skipBtn.addEventListener('click', () => {
    leftToast.classList.add('hidden');
    emojiPanel.classList.add('hidden');
    sendWs('skip');
    showScreen('searching');
    scanLabel.innerHTML = 'Scanning frequencies<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
    scanSub.textContent = 'Looking for someone else tuned in right now';
  });

  leaveBtn.addEventListener('click', () => {
    chatHistoryPushed = false;
    exitChatToLanding();
  });

  toastFindBtn.addEventListener('click', () => {
    leftToast.classList.add('hidden');
    sendWs('find');
    showScreen('searching');
  });

  // ---------- Friend requests ----------
  friendBtn.addEventListener('click', () => {
    sendWs('friend_request');
    addSystemBubble('Contact request sent.');
  });

  friendAcceptBtn.addEventListener('click', () => {
    friendRequestToast.classList.add('hidden');
    sendWs('friend_response', { accepted: true });
  });

  friendDeclineBtn.addEventListener('click', () => {
    friendRequestToast.classList.add('hidden');
    sendWs('friend_response', { accepted: false });
  });

  // ---------- Inbox / Thread navigation ----------
  inboxBtn.addEventListener('click', () => {
    showScreen('inbox');
    pushNavState('inbox');
    sendWs('get_contacts');
  });

  // On-screen back buttons just trigger a real browser "back" — the
  // popstate handler above is the single source of truth for where
  // that actually goes, so these stay in sync with the hardware back button.
  inboxBackBtn.addEventListener('click', () => {
    history.back();
  });

  threadBackBtn.addEventListener('click', () => {
    history.back();
  });

  let threadTypingSendTimeout = null;
  threadInput.addEventListener('input', () => {
    if (!currentThreadContactId) return;
    if (threadTypingSendTimeout) return; // throttle to once per ~1.2s
    sendWs('inbox_typing', { toDeviceId: currentThreadContactId });
    threadTypingSendTimeout = setTimeout(() => { threadTypingSendTimeout = null; }, 1200);
  });

  threadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = threadInput.value.trim();
    if (!text || !currentThreadContactId) return;
    sendWs('send_inbox_message', { toDeviceId: currentThreadContactId, text });
    threadInput.value = '';
  });

  // ---------- Voice note recording ----------
  const MAX_RECORD_SECONDS = 90;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordStartTime = null;
  let recordTimerInterval = null;
  let recordStream = null;

  function updateRecordTimeDisplay() {
    const elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
    recordTime.textContent = formatDuration(elapsed);
    if (elapsed >= MAX_RECORD_SECONDS) stopRecording(true); // auto-send at cap
  }

  async function startRecording() {
    if (!currentThreadContactId) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addSystemBubble("Voice notes aren't supported in this browser.");
      return;
    }
    try {
      recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      addSystemBubble('Microphone permission is needed to record a voice note.');
      return;
    }

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(recordStream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.start();

    recordStartTime = Date.now();
    recordTime.textContent = '0:00';
    micBtn.classList.add('wa-mic--recording');
    threadForm.classList.add('hidden');
    recordBar.classList.remove('hidden');
    recordTimerInterval = setInterval(updateRecordTimeDisplay, 250);
  }

  function stopRecording(send) {
    if (!mediaRecorder) return;
    clearInterval(recordTimerInterval);
    const durationSeconds = Math.max(1, Math.round((Date.now() - recordStartTime) / 1000));

    mediaRecorder.addEventListener('stop', () => {
      if (recordStream) recordStream.getTracks().forEach((t) => t.stop());
      if (send && recordedChunks.length > 0 && currentThreadContactId) {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          sendWs('send_inbox_voice', {
            toDeviceId: currentThreadContactId,
            audioData: reader.result, // data: URL, works directly as an <audio> src
            duration: durationSeconds,
          });
        };
        reader.readAsDataURL(blob);
      }
      recordedChunks = [];
      mediaRecorder = null;
    }, { once: true });

    mediaRecorder.stop();
    micBtn.classList.remove('wa-mic--recording');
    recordBar.classList.add('hidden');
    threadForm.classList.remove('hidden');
  }

  micBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      stopRecording(true);
    } else {
      startRecording();
    }
  });

  recordSendBtn.addEventListener('click', () => stopRecording(true));
  recordCancelBtn.addEventListener('click', () => stopRecording(false));

  // ---------- Emoji picker ----------
  const EMOJIS = ['😀','😂','😅','😉','😊','😍','😘','😜','🤔','😎','😢','😭','😡','👍','👎','🙏','👋','🎉','❤️','🔥','✨','💀','🤝','😴'];

  function buildEmojiPanel() {
    emojiPanel.innerHTML = '';
    EMOJIS.forEach((e) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-item';
      btn.textContent = e;
      btn.addEventListener('click', () => {
        chatInput.value += e;
        chatInput.focus();
      });
      emojiPanel.appendChild(btn);
    });
  }
  buildEmojiPanel();

  emojiBtn.addEventListener('click', () => {
    emojiPanel.classList.toggle('hidden');
  });

  // ---------- Real visible viewport height (fixes Android keyboard overlay gap) ----------
  function setAppHeight() {
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${h}px`);
  }
  setAppHeight();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
  }
  window.addEventListener('resize', setAppHeight);

  // ---------- Boot ----------
  renderAvatarPicker();
  connectSocket();
})();
