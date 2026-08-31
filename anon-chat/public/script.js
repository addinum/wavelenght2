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
  const accountBar = document.getElementById('accountBar');
  const accountBarText = document.getElementById('accountBarText');
  const accountModal = document.getElementById('accountModal');
  const accountModalClose = document.getElementById('accountModalClose');
  const authTabsView = document.getElementById('authTabsView');
  const accountEditView = document.getElementById('accountEditView');
  const tabSignup = document.getElementById('tabSignup');
  const tabLogin = document.getElementById('tabLogin');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const signupEmail = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const signupError = document.getElementById('signupError');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const accountEmailLabel = document.getElementById('accountEmailLabel');
  const editAccountForm = document.getElementById('editAccountForm');
  const editEmail = document.getElementById('editEmail');
  const editPassword = document.getElementById('editPassword');
  const editCurrentPassword = document.getElementById('editCurrentPassword');
  const editError = document.getElementById('editError');
  const editSuccess = document.getElementById('editSuccess');
  const signOutBtn = document.getElementById('signOutBtn');
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
  const threadPresenceLabel = document.getElementById('threadPresenceLabel');
  const replyComposer = document.getElementById('replyComposer');
  const replyComposerPreview = document.getElementById('replyComposerPreview');
  const replyComposerClose = document.getElementById('replyComposerClose');
  const threadAvatar = document.getElementById('threadAvatar');
  const threadLog = document.getElementById('threadLog');
  const threadForm = document.getElementById('threadForm');
  const threadInput = document.getElementById('threadInput');
  const micBtn = document.getElementById('micBtn');
  const gifBtn = document.getElementById('gifBtn');
  const gifPickerModal = document.getElementById('gifPickerModal');
  const gifPickerClose = document.getElementById('gifPickerClose');
  const gifSearchForm = document.getElementById('gifSearchForm');
  const gifSearchInput = document.getElementById('gifSearchInput');
  const gifPickerStatus = document.getElementById('gifPickerStatus');
  const gifResults = document.getElementById('gifResults');
  const recordBar = document.getElementById('recordBar');
  const recordTime = document.getElementById('recordTime');
  const recordCancelBtn = document.getElementById('recordCancelBtn');
  const recordSendBtn = document.getElementById('recordSendBtn');
  const callBtn = document.getElementById('callBtn');
  const incomingCallModal = document.getElementById('incomingCallModal');
  const incomingCallAvatar = document.getElementById('incomingCallAvatar');
  const incomingCallName = document.getElementById('incomingCallName');
  const callAcceptBtn = document.getElementById('callAcceptBtn');
  const callDeclineBtn = document.getElementById('callDeclineBtn');
  const activeCallBar = document.getElementById('activeCallBar');
  const activeCallAvatar = document.getElementById('activeCallAvatar');
  const activeCallName = document.getElementById('activeCallName');
  const activeCallStatus = document.getElementById('activeCallStatus');
  const callHangupBtn = document.getElementById('callHangupBtn');
  const callBarMain = document.getElementById('callBarMain');
  const callBarControls = document.getElementById('callBarControls');
  const callDuration = document.getElementById('callDuration');
  const callQuality = document.getElementById('callQuality');
  const callSpeakerBtn = document.getElementById('callSpeakerBtn');
  const callMuteBtn = document.getElementById('callMuteBtn');
  const remoteAudio = document.getElementById('remoteAudio');

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
  let selectedReply = null;
  let presenceById = new Map();

  // ---------- Inbox WebRTC voice calls ----------
  let peerConnection = null;
  let localCallStream = null;
  let activeCallContactId = null;
  let activeCallContactName = 'Contact';
  let activeCallContactAvatar = 'boy1';
  let pendingIncomingCall = null;
  let callStartedAt = null;
  let callTimerInterval = null;
  let isCallMuted = false;
  let isSpeakerOn = true;
  let pendingIceCandidates = [];
  let callDisconnectTimer = null;
  let callReconnectInProgress = false;
  let callStatsTimer = null;
  let callHistory = [];
  let activeCallDirection = 'outgoing';
  loadCallHistory();
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' }
    ],
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  // ---------- Persistent device identity (for the inbox feature only) ----------
  const DEVICE_ID_KEY = 'wavelength_device_id';

  // Add your GIPHY Web API key here. GIPHY requires an API key for search.
  // Keep the key in the frontend config because GIPHY's Search endpoint is a client-side API.
  const GIPHY_API_KEY ="Dw0k6Lxznqo0D34MwiTwmakhcvyHcYqX";
  const GIPHY_SEARCH_URL = 'https://api.giphy.com/v1/gifs/search';

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Math.random().toString(36).slice(2) + Date.now());
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }
  let myDeviceId = getDeviceId();
  let myAccountEmail = localStorage.getItem('wavelength_account_email') || null;

  // ---------- Account (optional email login on top of the anonymous system) ----------
  function updateAccountBarDisplay() {
    if (myAccountEmail) {
      accountBarText.textContent = `👤 Signed in as ${myAccountEmail}`;
    } else {
      accountBarText.textContent = '🔐 Sign in to keep your inbox everywhere';
    }
  }

  function showAccountModal() {
    signupError.classList.add('hidden');
    loginError.classList.add('hidden');
    editError.classList.add('hidden');
    editSuccess.classList.add('hidden');
    if (myAccountEmail) {
      authTabsView.classList.add('hidden');
      accountEditView.classList.remove('hidden');
      accountEmailLabel.textContent = myAccountEmail;
      editEmail.value = '';
      editPassword.value = '';
      editCurrentPassword.value = '';
    } else {
      authTabsView.classList.remove('hidden');
      accountEditView.classList.add('hidden');
    }
    accountModal.classList.remove('hidden');
  }

  function hideAccountModal() {
    accountModal.classList.add('hidden');
  }

  accountBar.addEventListener('click', showAccountModal);
  accountModalClose.addEventListener('click', hideAccountModal);
  accountModal.addEventListener('click', (e) => {
    if (e.target === accountModal) hideAccountModal();
  });

  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('auth-tab--active');
    tabLogin.classList.remove('auth-tab--active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('auth-tab--active');
    tabSignup.classList.remove('auth-tab--active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    signupError.classList.add('hidden');
    sendWs('signup', { email: signupEmail.value.trim(), password: signupPassword.value });
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    sendWs('login', { email: loginEmail.value.trim(), password: loginPassword.value });
  });

  editAccountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    editError.classList.add('hidden');
    editSuccess.classList.add('hidden');
    sendWs('update_account', {
      currentPassword: editCurrentPassword.value,
      newEmail: editEmail.value.trim() || undefined,
      newPassword: editPassword.value || undefined,
    });
  });

  signOutBtn.addEventListener('click', () => {
    // Signing out just forgets the "logged in" display on THIS browser —
    // the account itself still exists and can be logged back into anytime.
    // The deviceId (and its contacts/inbox) stays exactly as it is.
    myAccountEmail = null;
    localStorage.removeItem('wavelength_account_email');
    updateAccountBarDisplay();
    hideAccountModal();
  });

  function handleAuthSuccess(msg) {
    myAccountEmail = msg.email;
    localStorage.setItem('wavelength_account_email', msg.email);
    updateAccountBarDisplay();

    if (msg.deviceId && msg.deviceId !== myDeviceId) {
      // Logging in from a different browser/incognito: switch to the
      // account's canonical deviceId so its contacts/inbox come into view.
      myDeviceId = msg.deviceId;
      localStorage.setItem(DEVICE_ID_KEY, myDeviceId);
      sendWs('identify', { deviceId: myDeviceId });
      const name = nameInput.value.trim();
      if (name) sendWs('set_name', { name });
      sendWs('set_avatar', { avatarId: getMyAvatarId() });
    }

    hideAccountModal();
    refreshInboxBadge();
  }

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

  // ---------- Chosen-avatar system (10 real image avatars) ----------
  const AVATAR_IDS = ['boy1', 'boy2', 'boy3', 'boy4', 'boy5', 'girl1', 'girl2', 'girl3', 'girl4', 'girl5'];

  function isValidAvatarId(id) {
    return AVATAR_IDS.includes(id);
  }

  function avatarSrc(id) {
    return `avatars/${isValidAvatarId(id) ? id : 'boy1'}.jpg`;
  }

  const AVATAR_ID_KEY = 'wavelength_avatar_id';

  function getMyAvatarId() {
    const stored = localStorage.getItem(AVATAR_ID_KEY);
    return isValidAvatarId(stored) ? stored : 'boy1';
  }

  function setMyAvatarId(id) {
    localStorage.setItem(AVATAR_ID_KEY, id);
    sendWs('set_avatar', { avatarId: id });
    renderAvatarPicker();
  }

  function renderAvatarPicker() {
    const selected = getMyAvatarId();
    avatarGrid.innerHTML = '';
    AVATAR_IDS.forEach((id) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option' + (id === selected ? ' avatar-option--selected' : '');
      btn.innerHTML = `<img src="${avatarSrc(id)}" alt="Avatar option" loading="lazy">`;
      btn.addEventListener('click', () => setMyAvatarId(id));
      avatarGrid.appendChild(btn);
    });
  }

  // Renders the chosen avatar image into any small circular avatar slot
  // (inbox rows, thread header, live chat header) given an avatar id.
  function renderAvatarInto(el, avatarId) {
    el.innerHTML = `<img src="${avatarSrc(avatarId)}" alt="Avatar">`;
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
      ws.send(JSON.stringify({ type: 'whoami' }));
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

      case 'whoami_result':
        if (msg.account && msg.account.email) {
          myAccountEmail = msg.account.email;
          localStorage.setItem('wavelength_account_email', myAccountEmail);
          updateAccountBarDisplay();
        }
        break;

      case 'auth_success':
        handleAuthSuccess(msg);
        break;

      case 'auth_error':
        if (!authTabsView.classList.contains('hidden')) {
          const activeError = signupForm.classList.contains('hidden') ? loginError : signupError;
          activeError.textContent = msg.error;
          activeError.classList.remove('hidden');
        } else {
          editError.textContent = msg.error;
          editError.classList.remove('hidden');
        }
        break;

      case 'account_updated':
        myAccountEmail = msg.email;
        localStorage.setItem('wavelength_account_email', myAccountEmail);
        updateAccountBarDisplay();
        editSuccess.textContent = 'Saved!';
        editSuccess.classList.remove('hidden');
        editCurrentPassword.value = '';
        editPassword.value = '';
        editEmail.value = '';
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
        latestContacts.forEach(c => presenceById.set(c.contactId, { online: !!c.online, lastSeenAt: c.lastSeenAt }));
        renderInboxList();
        updateInboxBadge();
        break;

      case 'contact_deleted':
        if (msg.ok) {
          latestContacts = latestContacts.filter((c) => c.contactId !== msg.contactId);
          if (currentThreadContactId === msg.contactId) {
            currentThreadContactId = null;
            showScreen('inbox');
          }
          renderInboxList();
          updateInboxBadge();
        } else {
          alert('Could not delete this contact. Please try again.');
        }
        break;

      case 'thread_history':
        if (msg.contactId === currentThreadContactId) {
          threadLog.innerHTML = '';
          msg.messages.forEach((m) => {
            const who = m.fromId === myDeviceId ? 'me' : 'them';
            if (m.msgType === 'voice') {
              addVoiceBubble(m.audioData, m.duration, who, m.createdAt, m._id || m.id, m);
            } else if (m.msgType === 'gif') {
              addGifBubble(m.gifData, who, m.createdAt, m._id || m.id, m);
            } else {
              addThreadBubble(m.text, who, m.createdAt, m._id || m.id, m);
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
            addVoiceBubble(msg.audioData, msg.duration, who, msg.createdAt, msg.id, msg);
          } else if (msg.msgType === 'gif') {
            addGifBubble(msg.gifData, who, msg.createdAt, msg.id, msg);
          } else {
            addThreadBubble(msg.text, who, msg.createdAt, msg.id, msg);
          }
        } else if (isForMe) {
          const contact = latestContacts.find((c) => c.contactId === otherPartyId);
          notifyInboxMessage(contact ? contact.name : 'a contact');
        }
        sendWs('get_contacts'); // refresh unread counts / previews
        break;
      }

      case 'message_status':
        updateMessageStatus(msg.id, msg.status);
        break;

      case 'message_edited':
        updateMessageText(msg.id, msg.text, true);
        break;

      case 'message_deleted':
        updateMessageDeleted(msg.id);
        break;

      case 'message_reactions':
        updateMessageReactions(msg.id, msg.reactions || []);
        break;

      case 'presence':
        presenceById.set(msg.deviceId, { online: !!msg.online, lastSeenAt: msg.lastSeenAt || new Date().toISOString() });
        updateContactPresence(msg.deviceId);
        if (currentThreadContactId === msg.deviceId) updateThreadPresence(msg.deviceId);
        break;

      case 'voice_note_rejected':
        addSystemBubble(msg.reason || "Couldn't send that voice note.");
        break;

      case 'call_invite':
        if (activeCallContactId || pendingIncomingCall) break;
        pendingIncomingCall = msg;
        incomingCallName.textContent = msg.fromName || 'Contact';
        setCallAvatar(incomingCallAvatar, msg.fromAvatar || 'boy1');
        incomingCallModal.classList.remove('hidden');
        break;

      case 'call_signal':
        handleCallSignal(msg);
        break;

      case 'call_end':
        if (pendingIncomingCall && pendingIncomingCall.fromId === msg.fromId) {
          pendingIncomingCall = null;
          incomingCallModal.classList.add('hidden');
        }
        if (activeCallContactId === msg.fromId) endCall(false);
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
  function addThreadBubble(text, who, timestamp, msgId, meta = {}) {
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

    bubble.innerHTML = `<div class="wa-bubble__reply-placeholder"></div><span class="wa-bubble__text">${linked}</span><span class="wa-bubble__time">${formatBubbleTime(timestamp || Date.now())}</span>`;
    decorateThreadBubble(bubble, meta, who);

    row.appendChild(bubble);
    threadLog.appendChild(row);
    threadLog.scrollTop = threadLog.scrollHeight;
  }

  // GIF bubble: displays the animated GIF inside a compact WhatsApp-style bubble.
  function addGifBubble(gifData, who, timestamp, msgId, meta = {}) {
    const source = String(gifData || '');
    const isDataGif = /^data:image\/gif;base64,/i.test(source);
    const isRemoteGif = /^https:\/\/(?:[a-z0-9-]+\.)*giphy\.com\//i.test(source);
    if (!isDataGif && !isRemoteGif) return;

    const row = document.createElement('div');
    row.className = `wa-bubble-row wa-bubble-row--${who === 'me' ? 'me' : 'them'}`;

    const bubble = document.createElement('div');
    bubble.className = `wa-bubble wa-bubble--${who === 'me' ? 'me' : 'them'} wa-gif-bubble`;
    if (msgId) bubble.dataset.msgId = msgId;

    const img = document.createElement('img');
    img.className = 'wa-gif-image';
    img.src = source;
    img.alt = 'GIF';
    img.loading = 'lazy';
    img.decoding = 'async';

    const timeMeta = document.createElement('span');
    timeMeta.className = 'wa-bubble__time wa-gif-time';
    timeMeta.innerHTML = `${formatBubbleTime(timestamp || Date.now())}${who === 'me' ? '<span class="wa-tick">✓</span>' : ''}`;

    const replyPlaceholder = document.createElement('div');
    replyPlaceholder.className = 'wa-bubble__reply-placeholder';
    bubble.appendChild(replyPlaceholder);
    bubble.appendChild(img);
    bubble.appendChild(timeMeta);
    decorateThreadBubble(bubble, meta, who);
    row.appendChild(bubble);
    threadLog.appendChild(row);
    threadLog.scrollTop = threadLog.scrollHeight;
  }

  // Voice note bubble: play/pause button + a decorative waveform that fills
  // in as playback progresses, using the audio element's real currentTime.
  function addVoiceBubble(audioData, duration, who, timestamp, msgId, meta = {}) {
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

    bubble.innerHTML = `<div class="wa-bubble__reply-placeholder"></div>
      <div class="wa-voice-bubble">
        <button type="button" class="wa-voice-play">▶</button>
        <div class="wa-voice-waveform">${bars}</div>
        <span class="wa-voice-duration">${formatDuration(duration)}</span>
      </div>
      <span class="wa-bubble__time">${formatBubbleTime(timestamp || Date.now())}</span>
    `;
    decorateThreadBubble(bubble, meta, who);

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

  function messagePreview(meta) {
    if (!meta) return 'Message';
    if (meta.deleted) return 'Message deleted';
    if (meta.msgType === 'gif') return '🎞️ GIF';
    if (meta.msgType === 'voice') return '🎤 Voice message';
    return String(meta.text || 'Message').slice(0, 180);
  }

  function decorateThreadBubble(bubble, meta = {}, who = 'them') {
    if (!bubble) return;
    if (meta.id || bubble.dataset.msgId) bubble.dataset.msgId = meta.id || bubble.dataset.msgId;
    bubble.dataset.fromId = meta.fromId || '';
    bubble.dataset.toId = meta.toId || '';
    const reply = meta.replyTo;
    const replyBox = bubble.querySelector('.wa-bubble__reply-placeholder');
    if (replyBox && reply && reply.id) {
      replyBox.className = 'wa-bubble__reply';
      replyBox.innerHTML = `<strong>↩ ${escapeHtml(reply.fromId === myDeviceId ? 'You' : 'Contact')}</strong><span>${escapeHtml(messagePreview(reply))}</span>`;
    } else if (replyBox) replyBox.remove();

    const time = bubble.querySelector('.wa-bubble__time');
    if (time && who === 'me') {
      const status = meta.read ? 'read' : meta.delivered ? 'delivered' : 'sent';
      time.innerHTML = `${formatBubbleTime(meta.createdAt || Date.now())}<span class="wa-tick ${status === 'read' ? 'wa-tick--read' : ''}" data-status="${status}">${status === 'sent' ? '✓' : '✓✓'}</span>${meta.editedAt ? '<span class="wa-edited">edited</span>' : ''}`;
    }
    renderReactionBar(bubble, meta.reactions || []);
    attachBubbleActions(bubble, meta, who);
  }

  function attachBubbleActions(bubble, meta, who) {
    if (bubble.querySelector('.wa-message-actions')) return;
    const actions = document.createElement('div');
    actions.className = 'wa-message-actions';
    actions.innerHTML = `<button type="button" data-action="reply">↩</button><button type="button" data-action="react">😊</button>${who === 'me' && meta.msgType === 'text' ? '<button type="button" data-action="edit">✎</button>' : ''}${who === 'me' ? '<button type="button" data-action="delete">🗑</button>' : ''}`;
    actions.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'reply') setReplyFromBubble(bubble);
      if (action === 'react') showReactionChoices(bubble);
      if (action === 'edit') editBubble(bubble);
      if (action === 'delete') deleteBubble(bubble);
    });
    bubble.appendChild(actions);
    let pressTimer = null;
    bubble.addEventListener('contextmenu', e => { e.preventDefault(); toggleBubbleActions(bubble); });
    bubble.addEventListener('touchstart', () => { pressTimer = setTimeout(() => toggleBubbleActions(bubble), 500); }, { passive: true });
    ['touchend','touchmove','touchcancel'].forEach(ev => bubble.addEventListener(ev, () => clearTimeout(pressTimer), { passive: true }));
    bubble.addEventListener('click', e => { if (e.target.closest('button')) return; if (window.matchMedia('(max-width: 520px)').matches) toggleBubbleActions(bubble); });
  }

  function toggleBubbleActions(bubble) {
    document.querySelectorAll('.wa-bubble.show-actions').forEach(b => { if (b !== bubble) b.classList.remove('show-actions'); });
    bubble.classList.toggle('show-actions');
  }

  function setReplyFromBubble(bubble) {
    const id = bubble.dataset.msgId;
    if (!id) return;
    const textEl = bubble.querySelector('.wa-bubble__text');
    selectedReply = { id, fromId: bubble.dataset.fromId || '', msgType: bubble.classList.contains('wa-gif-bubble') ? 'gif' : bubble.querySelector('.wa-voice-bubble') ? 'voice' : 'text', text: textEl ? textEl.textContent : (bubble.querySelector('.wa-gif-image') ? '🎞️ GIF' : '🎤 Voice message') };
    replyComposerPreview.textContent = messagePreview(selectedReply);
    replyComposer.classList.remove('hidden');
    threadInput.focus();
  }

  function clearReply() { selectedReply = null; replyComposer.classList.add('hidden'); }

  function showReactionChoices(bubble) {
    let picker = bubble.querySelector('.wa-reaction-picker');
    if (picker) { picker.remove(); return; }
    picker = document.createElement('div');
    picker.className = 'wa-reaction-picker';
    ['❤️','😂','👍','😮','😢','🔥'].forEach(emoji => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = emoji;
      b.addEventListener('click', () => { sendWs('message_reaction', { id: bubble.dataset.msgId, emoji }); picker.remove(); });
      picker.appendChild(b);
    });
    bubble.appendChild(picker);
  }

  function renderReactionBar(bubble, reactions) {
    let bar = bubble.querySelector('.wa-reactions');
    if (!reactions || !reactions.length) { if (bar) bar.remove(); return; }
    const counts = {};
    reactions.forEach(r => counts[r.emoji] = (counts[r.emoji] || 0) + 1);
    if (!bar) { bar = document.createElement('div'); bar.className = 'wa-reactions'; bubble.appendChild(bar); }
    bar.innerHTML = Object.entries(counts).map(([e,c]) => `<span>${e}${c > 1 ? `<b>${c}</b>` : ''}</span>`).join('');
  }

  function updateMessageStatus(id, status) {
    const bubble = threadLog.querySelector(`[data-msg-id="${CSS.escape(String(id))}"]`);
    if (!bubble) return;
    const tick = bubble.querySelector('.wa-tick');
    if (!tick) return;
    tick.dataset.status = status;
    tick.textContent = status === 'sent' ? '✓' : '✓✓';
    tick.classList.toggle('wa-tick--read', status === 'read');
  }

  function updateMessageText(id, text, edited) {
    const bubble = threadLog.querySelector(`[data-msg-id="${CSS.escape(String(id))}"]`);
    if (!bubble) return;
    const textEl = bubble.querySelector('.wa-bubble__text');
    if (textEl) textEl.textContent = text;
    if (edited && !bubble.querySelector('.wa-edited')) { const time = bubble.querySelector('.wa-bubble__time'); if (time) { const e = document.createElement('span'); e.className='wa-edited'; e.textContent='edited'; time.appendChild(e); } }
  }

  function updateMessageDeleted(id) {
    const bubble = threadLog.querySelector(`[data-msg-id="${CSS.escape(String(id))}"]`);
    if (!bubble) return;
    bubble.classList.add('wa-bubble--deleted');
    bubble.querySelectorAll('img,.wa-voice-bubble,.wa-message-actions,.wa-reactions,.wa-reaction-picker').forEach(el => el.remove());
    const text = bubble.querySelector('.wa-bubble__text');
    if (text) text.textContent = 'This message was deleted'; else { const t = document.createElement('span'); t.className='wa-bubble__text'; t.textContent='This message was deleted'; bubble.prepend(t); }
  }

  function updateMessageReactions(id, reactions) {
    const bubble = threadLog.querySelector(`[data-msg-id="${CSS.escape(String(id))}"]`);
    if (bubble) renderReactionBar(bubble, reactions);
  }

  function editBubble(bubble) {
    if (!bubble.dataset.msgId) return;
    const current = bubble.querySelector('.wa-bubble__text')?.textContent || '';
    const next = window.prompt('Edit message', current);
    if (next === null || !next.trim() || next.trim() === current) return;
    sendWs('message_edit', { id: bubble.dataset.msgId, text: next.trim() });
  }

  function deleteBubble(bubble) {
    if (!bubble.dataset.msgId) return;
    if (window.confirm('Delete this message for everyone?')) sendWs('message_delete', { id: bubble.dataset.msgId });
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

  function formatLastSeen(dateValue) {
    if (!dateValue) return 'Offline';
    const d = new Date(dateValue); if (Number.isNaN(d.getTime())) return 'Offline';
    const diff = Math.max(0, Date.now() - d.getTime());
    if (diff < 60000) return 'Last seen just now';
    if (diff < 3600000) return `Last seen ${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `Last seen ${Math.floor(diff / 3600000)}h ago`;
    return `Last seen ${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
  }

  function updateThreadPresence(id) {
    const p = presenceById.get(id);
    if (!threadPresenceLabel) return;
    threadPresenceLabel.textContent = p?.online ? 'Online' : formatLastSeen(p?.lastSeenAt);
    threadPresenceLabel.classList.toggle('online', !!p?.online);
  }

  function updateContactPresence(id) { renderInboxList(); }

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
            <span class="inbox-row__preview">${c.online ? '<span class="presence-dot">●</span> Online' : (c.lastMessage ? escapeHtml(c.lastMessage) : formatLastSeen(c.lastSeenAt))}</span>
            <div class="inbox-row__actions">
              ${unread ? `<span class="inbox-row__badge">${c.unreadCount > 99 ? '99+' : c.unreadCount}</span>` : ''}
              <button type="button" class="inbox-row__delete" aria-label="Delete contact" title="Delete contact">🗑</button>
            </div>
          </div>
        </div>
      `;
      renderAvatarInto(row.querySelector('.inbox-row__avatar'), c.avatar);
      row.addEventListener('click', () => openThread(c.contactId, c.name, c.avatar));
      row.querySelector('.inbox-row__delete').addEventListener('click', (event) => {
        event.stopPropagation();
        if (window.confirm(`Delete ${c.name || 'this contact'} from your Inbox?`)) {
          sendWs('delete_contact', { contactId: c.contactId });
        }
      });
      inboxList.appendChild(row);
    });
  }

  function setCallAvatar(el, avatarId) {
    renderAvatarInto(el, avatarId || 'boy1');
  }

  function loadCallHistory() {
    try { callHistory = JSON.parse(localStorage.getItem('wavelength_call_history') || '[]'); } catch (_) { callHistory = []; }
  }

  function saveCallHistory(entry) {
    try {
      callHistory.unshift(entry);
      callHistory = callHistory.slice(0, 50);
      localStorage.setItem('wavelength_call_history', JSON.stringify(callHistory));
    } catch (_) {}
  }

  function startCallQualityMonitor() {
    clearInterval(callStatsTimer);
    callQuality.textContent = 'Good';
    callStatsTimer = setInterval(async () => {
      if (!peerConnection) return;
      try {
        const stats = await peerConnection.getStats();
        let packetsLost = 0, packetsReceived = 0, jitter = 0;
        stats.forEach(r => {
          if (r.type === 'inbound-rtp' && r.kind === 'audio') {
            packetsLost += r.packetsLost || 0;
            packetsReceived += r.packetsReceived || 0;
            jitter = Math.max(jitter, r.jitter || 0);
          }
        });
        const lossPct = packetsReceived + packetsLost ? (packetsLost / (packetsReceived + packetsLost)) * 100 : 0;
        callQuality.textContent = lossPct > 8 || jitter > 0.08 ? 'Poor' : lossPct > 3 || jitter > 0.04 ? 'Fair' : 'Good';
      } catch (_) {}
    }, 3000);
  }

  function stopCallQualityMonitor() {
    clearInterval(callStatsTimer);
    callStatsTimer = null;
    if (callQuality) callQuality.textContent = 'Good';
  }

  function formatCallDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function startCallTimer() {
    if (!callStartedAt) callStartedAt = Date.now();
    clearInterval(callTimerInterval);
    callDuration.textContent = '0:00';
    callTimerInterval = setInterval(() => {
      if (callStartedAt) callDuration.textContent = formatCallDuration(Date.now() - callStartedAt);
    }, 1000);
  }

  function stopCallTimer() {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
    callStartedAt = null;
    callDuration.textContent = '0:00';
  }

  function showActiveCall(name, avatar, status) {
    activeCallName.textContent = name || 'Contact';
    activeCallStatus.textContent = status || 'Calling…';
    setCallAvatar(activeCallAvatar, avatar);
    activeCallBar.classList.remove('hidden');
    activeCallBar.classList.remove('expanded');
    callBarMain.setAttribute('aria-expanded', 'false');
    callDuration.textContent = '0:00';
    if (callQuality) callQuality.textContent = 'Good';
    callMuteBtn.setAttribute('aria-pressed', String(isCallMuted));
    updateSpeakerButton();
  }

  function hideCallUI() {
    incomingCallModal.classList.add('hidden');
    activeCallBar.classList.add('hidden');
    activeCallBar.classList.remove('expanded');
    callBarMain.setAttribute('aria-expanded', 'false');
    stopCallTimer();
    stopCallQualityMonitor();
  }

  function setCallConnected() {
    activeCallStatus.textContent = 'Connected';
    startCallTimer();
    startCallQualityMonitor();
  }

  const isMobileCallDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  function updateSpeakerButton() {
    callSpeakerBtn.setAttribute('aria-pressed', String(isSpeakerOn));
    const label = callSpeakerBtn.querySelector('span');
    if (label) label.textContent = isSpeakerOn ? 'Speaker' : 'Receiver';
    callSpeakerBtn.title = isSpeakerOn
      ? 'Speaker on — tap for phone receiver'
      : 'Phone receiver — tap for speaker';
  }

  async function applyAudioRoute(speakerOn) {
    if (!isMobileCallDevice) return false;

    // Native Android bridge: this is the only reliable way to select the
    // Android loudspeaker vs. the phone's earpiece/receiver.
    if (window.Android && typeof window.Android.setSpeakerphoneOn === 'function') {
      window.Android.setSpeakerphoneOn(!!speakerOn);
      return true;
    }

    // Browser output routing is supported only by some browsers/devices.
    // Never claim receiver mode unless the browser actually exposes an output.
    if (typeof remoteAudio.setSinkId === 'function') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        const speaker = outputs.find(d => /speaker|default/i.test(d.label));
        const receiver = outputs.find(d => /earpiece|receiver|communications|telephony|headset/i.test(d.label));
        const target = speakerOn ? (speaker || outputs[0]) : receiver;
        if (target) {
          await remoteAudio.setSinkId(target.deviceId);
          return true;
        }
      } catch (err) {
        console.warn('Browser audio output routing unavailable:', err);
      }
    }

    // Some browsers expose selectAudioOutput. It cannot force Android's
    // hidden receiver unless that receiver is exposed as a selectable device.
    if (navigator.mediaDevices && typeof navigator.mediaDevices.selectAudioOutput === 'function' && !speakerOn) {
      try {
        const selected = await navigator.mediaDevices.selectAudioOutput();
        if (selected && typeof remoteAudio.setSinkId === 'function') {
          await remoteAudio.setSinkId(selected.deviceId);
          return true;
        }
      } catch (_) {}
    }

    return false;
  }

  async function toggleSpeaker() {
    if (!isMobileCallDevice || !activeCallContactId) return;
    const next = !isSpeakerOn;
    try {
      const routed = await applyAudioRoute(next);
      if (routed) {
        isSpeakerOn = next;
        updateSpeakerButton();
        return;
      }

      // Keep state honest on normal mobile browsers: JavaScript cannot force
      // Chrome/Android to use the hidden earpiece. Do not show a fake state.
      alert(next
        ? 'Your browser cannot control the phone speaker directly.'
        : 'Your browser cannot switch to the phone receiver directly. This requires the Android app/audio bridge.');
    } catch (err) {
      console.warn('Audio output switching failed:', err);
    }
  }

  if (!isMobileCallDevice) {
    callSpeakerBtn.style.display = 'none';
  }

  function toggleCallMute() {
    isCallMuted = !isCallMuted;
    if (localCallStream) localCallStream.getAudioTracks().forEach(track => { track.enabled = !isCallMuted; });
    callMuteBtn.setAttribute('aria-pressed', String(isCallMuted));
    callMuteBtn.querySelector('span').textContent = isCallMuted ? 'Unmute' : 'Mute';
  }

  function sendCallSignal(toDeviceId, signalType, data) {
    sendWs('call_signal', { toDeviceId, signalType, data });
  }

  async function createPeerConnection(contactId, isOfferer) {
    if (peerConnection) {
      peerConnection.onconnectionstatechange = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.close();
    }
    pendingIceCandidates = [];
    peerConnection = new RTCPeerConnection(rtcConfig);
    const pc = peerConnection;

    pc.onicecandidate = (event) => {
      if (event.candidate) sendCallSignal(contactId, 'ice', event.candidate);
    };

    pc.ontrack = (event) => {
      const stream = event.streams && event.streams[0];
      if (!stream) return;
      remoteAudio.srcObject = stream;
      remoteAudio.autoplay = true;
      remoteAudio.playsInline = true;
      remoteAudio.muted = false;
      remoteAudio.volume = 1;
      const playPromise = remoteAudio.play();
      if (playPromise) playPromise.catch(() => {
        // A user gesture (accept/call button) will normally unlock playback.
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc !== peerConnection) return;
      const state = pc.connectionState;
      if (state === 'connected') {
        clearTimeout(callDisconnectTimer);
        callDisconnectTimer = null;
        callReconnectInProgress = false;
        setCallConnected();
      } else if (state === 'disconnected') {
        // Mobile networks can briefly report disconnected during handoff.
        // Do not end a call immediately; give ICE a chance to recover.
        clearTimeout(callDisconnectTimer);
        callDisconnectTimer = setTimeout(() => {
          if (peerConnection === pc && pc.connectionState === 'disconnected') {
            try { pc.restartIce(); } catch (_) {}
          }
        }, 2500);
      } else if (state === 'failed') {
        clearTimeout(callDisconnectTimer);
        callDisconnectTimer = setTimeout(() => {
          if (peerConnection === pc && pc.connectionState === 'failed') {
            endCall(false);
          }
        }, 7000);
      } else if (state === 'closed') {
        if (activeCallContactId) endCall(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc !== peerConnection) return;
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        clearTimeout(callDisconnectTimer);
        callDisconnectTimer = null;
        callReconnectInProgress = false;
      } else if (state === 'disconnected') {
        clearTimeout(callDisconnectTimer);
        callDisconnectTimer = setTimeout(() => {
          if (peerConnection === pc && pc.iceConnectionState === 'disconnected') {
            try { pc.restartIce(); } catch (_) {}
          }
        }, 2000);
      } else if (state === 'failed' && !callReconnectInProgress) {
        callReconnectInProgress = true;
        try { pc.restartIce(); } catch (_) {}
      }
    };

    if (!localCallStream) {
      localCallStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000
        },
        video: false
      });
    }
    localCallStream.getAudioTracks().forEach(track => {
      track.enabled = !isCallMuted;
      pc.addTrack(track, localCallStream);
    });

    if (isOfferer) {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      sendCallSignal(contactId, 'offer', pc.localDescription);
    }
    return pc;
  }

  async function startCall() {
    if (!currentThreadContactId || activeCallContactId) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      alert('Voice calling is not supported by this browser.');
      return;
    }
    try {
      activeCallContactId = currentThreadContactId;
      activeCallContactName = threadWithLabel.textContent || 'Contact';
      activeCallContactAvatar = latestContacts.find(c => c.contactId === activeCallContactId)?.avatar || 'boy1';
      isCallMuted = false;
      isSpeakerOn = true;
      showActiveCall(activeCallContactName, activeCallContactAvatar, 'Calling…');
      await createPeerConnection(activeCallContactId, false);
      sendWs('call_invite', {
        toDeviceId: activeCallContactId,
        fromName: activeCallContactName,
        fromAvatar: getMyAvatarId()
      });
    } catch (err) {
      console.error('startCall failed:', err);
      endCall(false);
      alert('Microphone permission is required for calls.');
    }
  }

  async function acceptIncomingCall() {
    if (!pendingIncomingCall) return;
    const call = pendingIncomingCall;
    pendingIncomingCall = null;
    incomingCallModal.classList.add('hidden');
    activeCallContactId = call.fromId;
    activeCallContactName = call.fromName || 'Contact';
    activeCallContactAvatar = call.fromAvatar || 'boy1';
    isCallMuted = false;
    isSpeakerOn = true;
    activeCallDirection = 'incoming';
    showActiveCall(activeCallContactName, activeCallContactAvatar, 'Connecting…');
    try {
      await createPeerConnection(call.fromId, false);
      sendCallSignal(call.fromId, 'accept', true);
    } catch (err) {
      console.error('acceptIncomingCall failed:', err);
      endCall(true);
    }
  }

  function declineIncomingCall() {
    if (pendingIncomingCall) sendWs('call_end', { toDeviceId: pendingIncomingCall.fromId });
    pendingIncomingCall = null;
    incomingCallModal.classList.add('hidden');
  }

  function endCall(notify = true) {
    clearTimeout(callDisconnectTimer);
    callDisconnectTimer = null;
    callReconnectInProgress = false;
    pendingIceCandidates = [];
    const contactId = activeCallContactId;
    const durationMs = callStartedAt ? Date.now() - callStartedAt : 0;
    if (contactId && activeCallContactName) {
      saveCallHistory({ contactId, name: activeCallContactName, avatar: activeCallContactAvatar || 'boy1', direction: activeCallDirection, endedAt: new Date().toISOString(), duration: Math.floor(durationMs / 1000) });
    }
    if (notify && contactId) sendWs('call_end', { toDeviceId: contactId });
    if (peerConnection) {
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
      peerConnection = null;
    }
    if (localCallStream) {
      localCallStream.getTracks().forEach(t => t.stop());
      localCallStream = null;
    }
    remoteAudio.srcObject = null;
    activeCallContactId = null;
    hideCallUI();
  }

  async function handleCallSignal(msg) {
    if (!activeCallContactId || msg.fromId !== activeCallContactId || !msg.data) return;
    try {
      if (!peerConnection) return;

      if (msg.signalType === 'accept') {
        const offer = await peerConnection.createOffer({ offerToReceiveAudio: true });
        await peerConnection.setLocalDescription(offer);
        sendCallSignal(activeCallContactId, 'offer', peerConnection.localDescription);
      } else if (msg.signalType === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data));
        for (const candidate of pendingIceCandidates.splice(0)) {
          try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
        }
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendCallSignal(activeCallContactId, 'answer', peerConnection.localDescription);
      } else if (msg.signalType === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data));
        for (const candidate of pendingIceCandidates.splice(0)) {
          try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
        }
      } else if (msg.signalType === 'ice') {
        if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(msg.data));
        } else {
          pendingIceCandidates.push(msg.data);
        }
      }
    } catch (err) {
      console.error('call signaling failed:', err);
    }
  }

  function openThread(contactId, name, avatarId) {
    currentThreadContactId = contactId;
    threadWithLabel.textContent = name;
    renderAvatarInto(threadAvatar, avatarId);
    presenceById.set(contactId, { online: !!(latestContacts.find(c => c.contactId === contactId)?.online), lastSeenAt: latestContacts.find(c => c.contactId === contactId)?.lastSeenAt });
    updateThreadPresence(contactId);
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
    endCall(true);
    history.back();
  });

  let threadTypingSendTimeout = null;
  threadInput.addEventListener('input', async () => {
    // Android keyboards that support rich-content insertion may place the GIF
    // directly into a contenteditable field. Detect it and send immediately.
    const gif = threadInput.querySelector('img');
    if (gif && gif.src) {
      await sendGifFromSource(gif.src);
      threadInput.innerHTML = '';
      return;
    }

    if (!currentThreadContactId) return;
    if (threadTypingSendTimeout) return; // throttle to once per ~1.2s
    sendWs('inbox_typing', { toDeviceId: currentThreadContactId });
    threadTypingSendTimeout = setTimeout(() => { threadTypingSendTimeout = null; }, 1200);
  });

  // Gboard/other mobile keyboards can expose GIFs as clipboard image data.
  threadInput.addEventListener('paste', async (event) => {
    const items = Array.from(event.clipboardData?.items || []);
    const gifItem = items.find((item) => item.type === 'image/gif');
    if (gifItem) {
      event.preventDefault();
      const file = gifItem.getAsFile();
      if (file) await sendGifFile(file);
      return;
    }

    // Some keyboards expose an HTML <img> instead of a File.
    const html = event.clipboardData?.getData('text/html') || '';
    const match = html.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
    if (match && /\.gif(?:[?#]|$)/i.test(match[1])) {
      event.preventDefault();
      await sendGifFromSource(match[1]);
    }
  });

  threadInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      threadForm.requestSubmit();
    }
  });

  async function sendGifFile(file) {
    if (!currentThreadContactId || !file || file.type !== 'image/gif') return;
    if (file.size > 3 * 1024 * 1024) {
      addSystemBubble('GIF is too large (max 3 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => sendWs('send_inbox_gif', {
      toDeviceId: currentThreadContactId,
      gifData: reader.result,
      replyTo: selectedReply
    });
      clearReply();
    reader.readAsDataURL(file);
  }

  async function sendGifFromSource(source) {
    if (!currentThreadContactId || !source) return;
    if (!/^data:image\/gif;base64,/i.test(source)) {
      try {
        const response = await fetch(source, { mode: 'cors' });
        if (!response.ok) return;
        const file = await response.blob();
        if (file.type === 'image/gif') await sendGifFile(file);
      } catch {
        // The browser may block cross-origin clipboard image URLs; ignore safely.
      }
      return;
    }
    if (source.length > 4 * 1024 * 1024) {
      addSystemBubble('GIF is too large (max 3 MB).');
      return;
    }
    sendWs('send_inbox_gif', { toDeviceId: currentThreadContactId, gifData: source, replyTo: selectedReply });
    clearReply();
  }

  // ---------- GIPHY GIF picker ----------
  function openGifPicker() {
    if (!currentThreadContactId) return;
    gifPickerModal.classList.remove('hidden');
    gifSearchInput.value = '';
    gifResults.innerHTML = '';
    gifPickerStatus.textContent = GIPHY_API_KEY ? 'Search for a GIF' : 'Add your GIPHY API key in script.js first.';
    setTimeout(() => gifSearchInput.focus(), 50);
  }

  function closeGifPicker() {
    gifPickerModal.classList.add('hidden');
  }

  async function searchGifs(query) {
    const q = String(query || '').trim().slice(0, 50);
    if (!q) return;
    if (!GIPHY_API_KEY) {
      gifPickerStatus.textContent = 'GIPHY API key is not configured.';
      return;
    }

    gifPickerStatus.textContent = 'Searching…';
    gifResults.innerHTML = '';

    try {
      const params = new URLSearchParams({
        api_key: GIPHY_API_KEY,
        q,
        limit: '24',
        offset: '0',
        rating: 'g',
        lang: 'en',
        bundle: 'messaging_non_clips'
      });
      const response = await fetch(`${GIPHY_SEARCH_URL}?${params.toString()}`);
      if (!response.ok) throw new Error('GIF search failed');
      const result = await response.json();
      const gifs = Array.isArray(result.data) ? result.data : [];

      if (!gifs.length) {
        gifPickerStatus.textContent = 'No GIFs found.';
        return;
      }

      gifPickerStatus.textContent = `${gifs.length} GIFs found`;
      gifs.forEach((gif) => {
        const preview = gif?.images?.fixed_width_small?.url || gif?.images?.preview_gif?.url;
        const sendUrl = gif?.images?.fixed_width?.url || gif?.images?.original?.url;
        if (!preview || !sendUrl) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gif-result';
        button.title = 'Send GIF';
        button.innerHTML = `<img src="${escapeHtml(preview)}" alt="GIF" loading="lazy" decoding="async">`;
        button.addEventListener('click', () => sendSelectedGif(sendUrl));
        gifResults.appendChild(button);
      });
    } catch (err) {
      gifPickerStatus.textContent = 'Could not load GIFs. Check your API key and connection.';
    }
  }

  function sendSelectedGif(url) {
    if (!currentThreadContactId || !url) return;
    sendWs('send_inbox_gif', { toDeviceId: currentThreadContactId, gifData: url, replyTo: selectedReply });
    clearReply();
    closeGifPicker();
  }

  gifBtn.addEventListener('click', openGifPicker);
  gifPickerClose.addEventListener('click', closeGifPicker);
  gifPickerModal.addEventListener('click', (event) => {
    if (event.target === gifPickerModal) closeGifPicker();
  });
  gifSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    searchGifs(gifSearchInput.value);
  });

  replyComposerClose.addEventListener('click', clearReply);

  callBtn.addEventListener('click', startCall);
  callAcceptBtn.addEventListener('click', acceptIncomingCall);
  callDeclineBtn.addEventListener('click', declineIncomingCall);
  callHangupBtn.addEventListener('click', (event) => { event.stopPropagation(); endCall(true); });
  callBarMain.addEventListener('click', () => {
    const expanded = activeCallBar.classList.toggle('expanded');
    callBarMain.setAttribute('aria-expanded', String(expanded));
  });
  callBarControls.addEventListener('click', (event) => event.stopPropagation());
  callMuteBtn.addEventListener('click', toggleCallMute);
  callSpeakerBtn.addEventListener('click', toggleSpeaker);

  threadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = threadInput.textContent.trim();
    if (!text || !currentThreadContactId) return;
    sendWs('send_inbox_message', { toDeviceId: currentThreadContactId, text, replyTo: selectedReply });
    threadInput.innerHTML = '';
    clearReply();
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
            replyTo: selectedReply
          });
          clearReply();
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
  updateAccountBarDisplay();
  connectSocket();
})();
