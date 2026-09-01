// server.js — Anonymous stranger-chat backend
// Handles: connection, random pairing queue, message relay, skip, disconnect,
// online count broadcast, and code-based "friend" reconnection (no accounts).

const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---- Simple static file server for the frontend ----
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  // Strip query strings (e.g. style.css?v=...) before resolving static files.
  // This keeps cache-busting URLs from causing a 404 and taking down the UI styling.
  const requestPath = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  let filePath = requestPath === '/' ? '/index.html' : requestPath;
  filePath = path.join(PUBLIC_DIR, filePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// ---- WebSocket layer ----
const wss = new WebSocket.Server({ server });

let waitingQueue = [];       // sockets waiting for a random match
const partners = new Map();  // ws -> partner ws
const names = new Map();     // ws -> display name
const avatars = new Map();   // ws -> chosen avatar id (e.g. 'a1'..'a10')
const codeWaiting = new Map(); // friend code -> ws waiting to be joined
const deviceOnline = new Map(); // deviceId -> ws (for inbox delivery)
const wsDeviceId = new Map();   // ws -> deviceId (reverse lookup)

function send(ws, type, payload = {}) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function broadcastOnlineCount() {
  const payload = JSON.stringify({ type: 'online_count', count: wss.clients.size });
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(payload);
  });
}

function removeFromQueue(ws) {
  waitingQueue = waitingQueue.filter((s) => s !== ws);
}

function removeFromCodeWaiting(ws) {
  for (const [code, sock] of codeWaiting.entries()) {
    if (sock === ws) codeWaiting.delete(code);
  }
}

function breakPair(ws, notifyPartner = true) {
  const partner = partners.get(ws);
  if (partner) {
    partners.delete(ws);
    partners.delete(partner);
    if (notifyPartner) send(partner, 'stranger_left');
  }
}

function pairUp(a, b) {
  partners.set(a, b);
  partners.set(b, a);
  send(a, 'matched', { strangerName: names.get(b) || 'Stranger', strangerAvatarId: avatars.get(b) || 'a1' });
  send(b, 'matched', { strangerName: names.get(a) || 'Stranger', strangerAvatarId: avatars.get(a) || 'a1' });
}

function tryMatch(ws) {
  removeFromQueue(ws);
  if (waitingQueue.length > 0) {
    const partner = waitingQueue.shift();
    if (partner.readyState !== WebSocket.OPEN) return tryMatch(ws);
    pairUp(ws, partner);
  } else {
    waitingQueue.push(ws);
    send(ws, 'waiting');
  }
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function tryConnectCode(ws, code) {
  removeFromCodeWaiting(ws);
  const waiter = codeWaiting.get(code);
  if (waiter && waiter !== ws && waiter.readyState === WebSocket.OPEN) {
    codeWaiting.delete(code);
    pairUp(ws, waiter);
  } else {
    codeWaiting.set(code, ws);
    send(ws, 'waiting_code', { code });
  }
}

function heartbeat() {
  this.isAlive = true;
}

// Ping every client periodically. Browsers auto-reply with a pong, which
// keeps the connection "active" so hosting proxies (like Render) don't
// treat it as idle and drop it. Anyone who doesn't respond gets terminated.
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 25000);

wss.on('close', () => clearInterval(heartbeatInterval));

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  names.set(ws, 'Stranger');
  broadcastOnlineCount();

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'identify': {
        const deviceId = String(msg.deviceId || '').slice(0, 64);
        if (!deviceId) return;
        wsDeviceId.set(ws, deviceId);
        deviceOnline.set(deviceId, ws);
        // Tell this user's contacts that they are online.
        db.getContacts(deviceId).then(contacts => {
          contacts.forEach(c => {
            const contactWs = deviceOnline.get(c.contactId);
            if (contactWs) send(contactWs, 'presence', { deviceId, online: true });
          });
        }).catch(() => {});
        break;
      }

      case 'whoami': {
        const myId = wsDeviceId.get(ws);
        if (!myId) { send(ws, 'whoami_result', { account: null }); break; }
        db.getAccountByDeviceId(myId).then((account) => {
          send(ws, 'whoami_result', { account });
        });
        break;
      }

      case 'signup': {
        const myId = wsDeviceId.get(ws);
        if (!myId) { send(ws, 'auth_error', { error: 'Not connected yet — try again in a moment.' }); break; }
        db.createAccount(msg.email, msg.password, myId).then((result) => {
          if (result.ok) {
            send(ws, 'auth_success', { email: result.email, deviceId: result.deviceId, mode: 'signup' });
          } else {
            send(ws, 'auth_error', { error: result.error });
          }
        });
        break;
      }

      case 'login': {
        db.verifyLogin(msg.email, msg.password).then((result) => {
          if (result.ok) {
            // Hand back the account's canonical deviceId — the client
            // switches to it and re-identifies, which brings their
            // contacts/inbox into view on this browser/device too.
            send(ws, 'auth_success', { email: result.email, deviceId: result.deviceId, mode: 'login' });
          } else {
            send(ws, 'auth_error', { error: result.error });
          }
        });
        break;
      }

      case 'update_account': {
        const myId = wsDeviceId.get(ws);
        if (!myId) { send(ws, 'auth_error', { error: 'Not connected yet — try again in a moment.' }); break; }
        db.updateAccount(myId, msg.currentPassword, msg.newEmail, msg.newPassword).then((result) => {
          if (result.ok) {
            send(ws, 'account_updated', { email: result.email });
          } else {
            send(ws, 'auth_error', { error: result.error });
          }
        });
        break;
      }

      case 'set_name': {
        const clean = String(msg.name || '').slice(0, 24).trim();
        names.set(ws, clean || 'Stranger');
        break;
      }

      case 'set_avatar': {
        const avatarId = String(msg.avatarId || '').slice(0, 8).trim();
        const VALID_AVATAR_IDS = new Set(['boy1', 'boy2', 'boy3', 'boy4', 'boy5', 'girl1', 'girl2', 'girl3', 'girl4', 'girl5']);
        avatars.set(ws, VALID_AVATAR_IDS.has(avatarId) ? avatarId : 'boy1');
        break;
      }

      case 'find': {
        breakPair(ws);
        removeFromCodeWaiting(ws);
        tryMatch(ws);
        break;
      }

      case 'connect_code': {
        const code = String(msg.code || '').toUpperCase().slice(0, 12).trim();
        if (!code) return;
        breakPair(ws);
        removeFromQueue(ws);
        tryConnectCode(ws, code);
        break;
      }

      case 'chat_message': {
        const partner = partners.get(ws);
        const text = String(msg.text || '').slice(0, 2000);
        if (partner && text) {
          send(partner, 'chat_message', { text, from: 'stranger' });
        }
        break;
      }

      case 'typing': {
        const partner = partners.get(ws);
        if (partner) send(partner, 'typing');
        break;
      }

      case 'skip': {
        breakPair(ws);
        removeFromCodeWaiting(ws);
        tryMatch(ws);
        break;
      }

      case 'leave': {
        breakPair(ws);
        removeFromQueue(ws);
        removeFromCodeWaiting(ws);
        break;
      }

      case 'friend_request': {
        const partner = partners.get(ws);
        if (partner) send(partner, 'friend_request_received', { fromName: names.get(ws) || 'Stranger' });
        break;
      }

      case 'friend_response': {
        const partner = partners.get(ws);
        if (!partner) break;
        if (msg.accepted) {
          const code = generateCode();
          const nameSelf = names.get(ws) || 'Stranger';
          const namePartner = names.get(partner) || 'Stranger';
          const avatarSelf = avatars.get(ws) || 'a1';
          const avatarPartner = avatars.get(partner) || 'a1';

          // Persist a real contact pair for the inbox feature, if both
          // sides have identified with a deviceId. Fails silently and
          // harmlessly if no database is configured yet.
          const idSelf = wsDeviceId.get(ws);
          const idPartner = wsDeviceId.get(partner);
          if (idSelf && idPartner) {
            db.saveContactPair(idSelf, nameSelf, avatarSelf, idPartner, namePartner, avatarPartner).catch(() => {});
          }

          send(ws, 'friend_code', { code, strangerName: namePartner, strangerAvatarId: avatarPartner });
          send(partner, 'friend_code', { code, strangerName: nameSelf, strangerAvatarId: avatarSelf });
        } else {
          send(partner, 'friend_response', { accepted: false });
        }
        break;
      }

      case 'get_contacts': {
        const myId = wsDeviceId.get(ws);
        if (!myId) { send(ws, 'contacts_list', { contacts: [] }); break; }
        db.getContacts(myId).then((contacts) => {
          contacts.forEach(c => {
            c.online = !!deviceOnline.get(c.contactId);
          });
          send(ws, 'contacts_list', { contacts });
        });
        break;
      }

      case 'delete_contact': {
        const myId = wsDeviceId.get(ws);
        const contactId = String(msg.contactId || '');
        if (!myId || !contactId || myId === contactId) break;

        const deleted = await db.deleteContact(myId, contactId);
        send(ws, 'contact_deleted', { contactId, ok: deleted });
        break;
      }

      case 'open_thread': {
        const myId = wsDeviceId.get(ws);
        const theirId = String(msg.contactId || '');
        if (!myId || !theirId) break;
        db.markThreadRead(theirId, myId).then(async () => {
          const page = await db.getThreadPage(myId, theirId, 30);
          send(ws, 'thread_history', { contactId: theirId, ...page });
          // Tell the other person (if online) that their messages were just read.
          const theirWs = deviceOnline.get(theirId);
          if (theirWs) send(theirWs, 'read_receipt', { byId: myId, contactId: myId });
        });
        break;
      }

      case 'load_older_thread': {
        const myId = wsDeviceId.get(ws);
        const theirId = String(msg.contactId || '');
        const beforeId = String(msg.beforeId || '');
        if (!myId || !theirId || !beforeId) break;
        const page = await db.getThreadPage(myId, theirId, 30, beforeId);
        send(ws, 'older_thread_history', { contactId: theirId, ...page });
        break;
      }

      case 'inbox_typing': {
        const myId = wsDeviceId.get(ws);
        const toId = String(msg.toDeviceId || '');
        if (!myId || !toId) break;
        const recipientWs = deviceOnline.get(toId);
        if (recipientWs) send(recipientWs, 'inbox_typing', { fromId: myId });
        break;
      }

      case 'send_inbox_message': {
        const myId = wsDeviceId.get(ws);
        const toId = String(msg.toDeviceId || '');
        const text = String(msg.text || '').slice(0, 2000).trim();
        if (!myId || !toId || !text || myId === toId) break;
        const replyTo = msg.replyTo && msg.replyTo.id ? {
          id: String(msg.replyTo.id).slice(0, 64),
          fromId: String(msg.replyTo.fromId || '').slice(0, 128),
          msgType: String(msg.replyTo.msgType || 'text').slice(0, 16),
          text: String(msg.replyTo.text || '').slice(0, 180)
        } : null;

        db.saveMessage(myId, toId, text, replyTo).then(async (saved) => {
          const id = saved && saved._id ? String(saved._id) : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const payload = { id, msgType: 'text', fromId: myId, toId, text, replyTo,
            createdAt: saved ? saved.createdAt : new Date(), delivered: false, read: false, editedAt: null, deleted: false, reactions: [] };
          send(ws, 'inbox_message', payload);
          const recipientWs = deviceOnline.get(toId);
          if (recipientWs) {
            const delivered = saved ? await db.markMessageDelivered(id) : null;
            payload.delivered = true;
            payload.deliveredAt = delivered?.deliveredAt || new Date();
            send(recipientWs, 'inbox_message', payload);
            send(ws, 'message_status', { id, status: 'delivered' });
          }
        });
        break;
      }

      case 'message_edit': {
        const myId = wsDeviceId.get(ws);
        const id = String(msg.id || '');
        const text = String(msg.text || '').slice(0, 2000).trim();
        if (!myId || !id || !text) break;
        const updated = await db.editMessage(id, myId, text);
        if (!updated) break;
        const payload = { id, text: updated.text, editedAt: updated.editedAt };
        send(ws, 'message_edited', payload);
        const recipientWs = deviceOnline.get(updated.toId);
        if (recipientWs) send(recipientWs, 'message_edited', payload);
        break;
      }

      case 'message_delete': {
        const myId = wsDeviceId.get(ws);
        const id = String(msg.id || '');
        if (!myId || !id) break;
        const deleted = await db.deleteMessage(id, myId);
        if (!deleted) break;
        const payload = { id, deleted: true };
        send(ws, 'message_deleted', payload);
        const recipientWs = deviceOnline.get(deleted.toId);
        if (recipientWs) send(recipientWs, 'message_deleted', payload);
        break;
      }

      case 'message_reaction': {
        const myId = wsDeviceId.get(ws);
        const id = String(msg.id || '');
        const emoji = String(msg.emoji || '').slice(0, 4);
        if (!myId || !id || !emoji) break;
        const updated = await db.toggleReaction(id, myId, emoji);
        if (!updated) break;
        const payload = { id, reactions: updated.reactions || [] };
        send(ws, 'message_reactions', payload);
        const recipientWs = deviceOnline.get(updated.fromId === myId ? updated.toId : updated.fromId);
        if (recipientWs) send(recipientWs, 'message_reactions', payload);
        break;
      }

      // ---- Inbox voice calling (WebRTC signaling only; media stays peer-to-peer) ----
      case 'call_invite': {
        const myId = wsDeviceId.get(ws);
        const toId = String(msg.toDeviceId || '');
        if (!myId || !toId || myId === toId) break;
        const allowed = await db.areContacts(myId, toId);
        if (!allowed) break;
        const recipientWs = deviceOnline.get(toId);
        if (recipientWs) {
          send(recipientWs, 'call_invite', {
            fromId: myId,
            fromName: String(msg.fromName || 'Contact').slice(0, 40),
            fromAvatar: String(msg.fromAvatar || 'boy1').slice(0, 8)
          });
        }
        break;
      }

      case 'call_signal': {
        const myId = wsDeviceId.get(ws);
        const toId = String(msg.toDeviceId || '');
        if (!myId || !toId || myId === toId) break;
        const allowed = await db.areContacts(myId, toId);
        if (!allowed) break;
        const recipientWs = deviceOnline.get(toId);
        if (recipientWs) {
          send(recipientWs, 'call_signal', {
            fromId: myId,
            signalType: String(msg.signalType || ''),
            data: msg.data
          });
        }
        break;
      }

      case 'call_end': {
        const myId = wsDeviceId.get(ws);
        const toId = String(msg.toDeviceId || '');
        if (!myId || !toId) break;
        const recipientWs = deviceOnline.get(toId);
        if (recipientWs) send(recipientWs, 'call_end', { fromId: myId });
        break;
      }

      case 'send_inbox_gif': {
        const myId = wsDeviceId.get(ws);
        const toId = String(msg.toDeviceId || '');
        const gifData = String(msg.gifData || '');
        const MAX_GIF_DATA_LENGTH = 4 * 1024 * 1024;

        // Accept either legacy uploaded GIF data URLs or trusted GIPHY HTTPS URLs.
        // Remote URLs keep MongoDB tiny because the GIF bytes stay on GIPHY.
        if (!myId || !toId || !gifData || myId === toId) break;
        const isGifData = /^data:image\/gif;base64,[A-Za-z0-9+/=]+$/i.test(gifData);
        const isGiphyUrl = /^https:\/\/(?:[a-z0-9-]+\.)*giphy\.com\//i.test(gifData);
        if (!isGifData && !isGiphyUrl) break;
        if (gifData.length > MAX_GIF_DATA_LENGTH) {
          send(ws, 'gif_rejected', { reason: 'GIF is too large (max 4 MB).' });
          break;
        }
        if (!(await db.areContacts(myId, toId))) break;

        const replyTo = msg.replyTo && msg.replyTo.id ? { id: String(msg.replyTo.id).slice(0,64), fromId: String(msg.replyTo.fromId || '').slice(0,128), msgType: String(msg.replyTo.msgType || 'gif').slice(0,16), text: String(msg.replyTo.text || '').slice(0,180) } : null;
        db.saveGifMessage(myId, toId, gifData, replyTo).then(async (saved) => {
          const payload = {
            id: saved && saved._id ? String(saved._id) : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            msgType: 'gif',
            fromId: myId,
            toId,
            gifData,
            createdAt: saved ? saved.createdAt : new Date(), replyTo, delivered: false, read: false, reactions: []
          };
          send(ws, 'inbox_message', payload);
          const recipientWs = deviceOnline.get(toId);
          if (recipientWs) { if (saved) await db.markMessageDelivered(payload.id); payload.delivered = true; send(recipientWs, 'inbox_message', payload); send(ws, 'message_status', { id: payload.id, status: 'delivered' }); }
        });
        break;
      }

      case 'send_inbox_voice': {
        const myId = wsDeviceId.get(ws);
        const toId = String(msg.toDeviceId || '');
        const audioData = String(msg.audioData || '');
        const duration = Math.min(Number(msg.duration) || 0, 120); // hard cap at 120s server-side

        // Guard rails: cap raw size (~2MB base64) and require a sane duration,
        // so one bad client can't blow through the free MongoDB storage tier.
        const MAX_AUDIO_BASE64_LENGTH = 2 * 1024 * 1024;
        if (!myId || !toId || !audioData || duration <= 0) break;
        if (audioData.length > MAX_AUDIO_BASE64_LENGTH) {
          send(ws, 'voice_note_rejected', { reason: 'Voice note too large (max ~90 seconds).' });
          break;
        }

        const replyTo = msg.replyTo && msg.replyTo.id ? { id: String(msg.replyTo.id).slice(0,64), fromId: String(msg.replyTo.fromId || '').slice(0,128), msgType: String(msg.replyTo.msgType || 'voice').slice(0,16), text: String(msg.replyTo.text || '').slice(0,180) } : null;
        db.saveVoiceMessage(myId, toId, audioData, duration, replyTo).then(async (saved) => {
          const payload = {
            id: saved && saved._id ? String(saved._id) : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            msgType: 'voice',
            fromId: myId,
            toId,
            audioData,
            duration,
            createdAt: saved ? saved.createdAt : new Date(),
            replyTo, delivered: false, read: false, reactions: []
          };
          send(ws, 'inbox_message', payload);
          const recipientWs = deviceOnline.get(toId);
          if (recipientWs) { if (saved) await db.markMessageDelivered(payload.id); payload.delivered = true; send(recipientWs, 'inbox_message', payload); send(ws, 'message_status', { id: payload.id, status: 'delivered' }); }
        });
        break;
      }
    }
  });

  ws.on('close', () => {
    breakPair(ws);
    removeFromQueue(ws);
    removeFromCodeWaiting(ws);
    names.delete(ws);
    avatars.delete(ws);
    const deviceId = wsDeviceId.get(ws);
    if (deviceId && deviceOnline.get(deviceId) === ws) {
      deviceOnline.delete(deviceId);
      db.touchContactLastSeen(deviceId).catch(() => {});
      db.getContacts(deviceId).then(contacts => {
        contacts.forEach(c => {
          const contactWs = deviceOnline.get(c.contactId);
          if (contactWs) send(contactWs, 'presence', { deviceId, online: false, lastSeenAt: new Date().toISOString() });
        });
      }).catch(() => {});
    }
    wsDeviceId.delete(ws);
    broadcastOnlineCount();
  });
});

db.connect();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Anonymous chat server running at http://localhost:${PORT}`);
});
