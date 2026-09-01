// db.js — MongoDB persistence layer for the inbox feature.
// Designed to fail gracefully: if MONGODB_URI isn't set or the connection
// isn't ready, every function here becomes a safe no-op instead of crashing
// the server. This means anonymous live chat keeps working even without a
// database configured.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accountSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  deviceId: { type: String, required: true }, // the canonical deviceId this account "owns"
  createdAt: { type: Date, default: Date.now },
});

const contactSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  contactId: { type: String, required: true },
  contactName: { type: String, default: 'Stranger' },
  contactAvatar: { type: String, default: 'boy1' },
  createdAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
});
contactSchema.index({ ownerId: 1, contactId: 1 }, { unique: true });

const messageSchema = new mongoose.Schema({
  fromId: { type: String, required: true, index: true },
  toId: { type: String, required: true, index: true },
  msgType: { type: String, enum: ['text', 'voice', 'gif'], default: 'text' },
  text: { type: String, default: '' },
  gifData: { type: String, default: null },
  audioData: { type: String, default: null }, // base64-encoded audio, voice notes only
  duration: { type: Number, default: null },  // seconds, voice notes only
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  deliveredAt: { type: Date, default: null },
  readAt: { type: Date, default: null },
  editedAt: { type: Date, default: null },
  deleted: { type: Boolean, default: false },
  replyTo: {
    id: { type: String, default: null },
    fromId: { type: String, default: null },
    msgType: { type: String, default: 'text' },
    text: { type: String, default: '' },
  },
  reactions: [{
    userId: { type: String },
    emoji: { type: String },
  }],
});

const Account = mongoose.model('Account', accountSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Message = mongoose.model('Message', messageSchema);

function isReady() {
  return mongoose.connection.readyState === 1; // 1 = connected
}

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('MONGODB_URI not set — inbox/contacts feature disabled, anonymous chat still works.');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB — inbox feature enabled.');
  } catch (err) {
    console.error('MongoDB connection failed — inbox feature disabled. Reason:', err.message);
  }
}

// ---- Accounts (optional email login on top of the anonymous deviceId system) ----
// Signing up links the CURRENT deviceId to the account, so existing
// contacts/inbox (already keyed by deviceId) show up automatically —
// no data migration needed. Logging in elsewhere just hands back that
// same deviceId so the client can switch to it.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createAccount(email, password, deviceId) {
  if (!isReady()) return { ok: false, error: 'Account storage is not available right now.' };
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) return { ok: false, error: 'Enter a valid email address.' };
  if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  if (!deviceId) return { ok: false, error: 'Missing device — try refreshing the page.' };

  try {
    const existing = await Account.findOne({ email: cleanEmail }).lean();
    if (existing) return { ok: false, error: 'An account with that email already exists.' };

    const passwordHash = await bcrypt.hash(password, 10);
    await Account.create({ email: cleanEmail, passwordHash, deviceId });
    return { ok: true, email: cleanEmail, deviceId };
  } catch (err) {
    console.error('createAccount failed:', err.message);
    return { ok: false, error: 'Something went wrong creating your account.' };
  }
}

async function verifyLogin(email, password) {
  if (!isReady()) return { ok: false, error: 'Account storage is not available right now.' };
  const cleanEmail = String(email || '').trim().toLowerCase();

  try {
    const account = await Account.findOne({ email: cleanEmail });
    if (!account) return { ok: false, error: 'No account found with that email.' };

    const matches = await bcrypt.compare(password || '', account.passwordHash);
    if (!matches) return { ok: false, error: 'Incorrect password.' };

    return { ok: true, email: account.email, deviceId: account.deviceId };
  } catch (err) {
    console.error('verifyLogin failed:', err.message);
    return { ok: false, error: 'Something went wrong logging in.' };
  }
}

async function getAccountByDeviceId(deviceId) {
  if (!isReady() || !deviceId) return null;
  try {
    const account = await Account.findOne({ deviceId }).lean();
    return account ? { email: account.email } : null;
  } catch (err) {
    console.error('getAccountByDeviceId failed:', err.message);
    return null;
  }
}

async function updateAccount(deviceId, currentPassword, newEmail, newPassword) {
  if (!isReady()) return { ok: false, error: 'Account storage is not available right now.' };
  try {
    const account = await Account.findOne({ deviceId });
    if (!account) return { ok: false, error: 'No account linked to this device.' };

    const matches = await bcrypt.compare(currentPassword || '', account.passwordHash);
    if (!matches) return { ok: false, error: 'Current password is incorrect.' };

    if (newEmail) {
      const cleanEmail = String(newEmail).trim().toLowerCase();
      if (!EMAIL_RE.test(cleanEmail)) return { ok: false, error: 'Enter a valid new email address.' };
      const taken = await Account.findOne({ email: cleanEmail, deviceId: { $ne: deviceId } }).lean();
      if (taken) return { ok: false, error: 'That email is already in use.' };
      account.email = cleanEmail;
    }

    if (newPassword) {
      if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
      account.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await account.save();
    return { ok: true, email: account.email };
  } catch (err) {
    console.error('updateAccount failed:', err.message);
    return { ok: false, error: 'Something went wrong updating your account.' };
  }
}


async function areContacts(idA, idB) {
  if (!isReady() || !idA || !idB) return false;
  try {
    const pair = await Contact.exists({ ownerId: idA, contactId: idB });
    return !!pair;
  } catch (err) {
    console.error('areContacts failed:', err.message);
    return false;
  }
}

// ---- Contacts ----
async function saveContactPair(idA, nameA, avatarA, idB, nameB, avatarB) {
  if (!isReady()) return false;
  try {
    await Contact.updateOne(
      { ownerId: idA, contactId: idB },
      { $set: { contactName: nameB, contactAvatar: avatarB || 'boy1' } },
      { upsert: true }
    );
    await Contact.updateOne(
      { ownerId: idB, contactId: idA },
      { $set: { contactName: nameA, contactAvatar: avatarA || 'boy1' } },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error('saveContactPair failed:', err.message);
    return false;
  }
}

async function deleteContact(ownerId, contactId) {
  if (!isReady() || !ownerId || !contactId) return false;
  try {
    const result = await Contact.deleteOne({ ownerId, contactId });
    return result.deletedCount > 0;
  } catch (err) {
    console.error('deleteContact failed:', err.message);
    return false;
  }
}

async function getContacts(ownerId) {
  if (!isReady()) return [];
  try {
    const contacts = await Contact.find({ ownerId }).lean();
    const results = [];
    for (const c of contacts) {
      const unreadCount = await Message.countDocuments({
        fromId: c.contactId,
        toId: ownerId,
        read: false,
      });
      const lastMsg = await Message.findOne({
        $or: [
          { fromId: ownerId, toId: c.contactId },
          { fromId: c.contactId, toId: ownerId },
        ],
      }).sort({ createdAt: -1 }).lean();
      results.push({
        contactId: c.contactId,
        name: c.contactName,
        avatar: c.contactAvatar || 'boy1',
        unreadCount,
        lastMessage: lastMsg ? (lastMsg.msgType === 'voice' ? '🎤 Voice message' : lastMsg.msgType === 'gif' ? '🎞️ GIF' : lastMsg.text) : null,
        lastAt: lastMsg ? lastMsg.createdAt : c.createdAt,
        online: false,
        lastSeenAt: c.lastSeenAt || c.createdAt,
      });
    }
    results.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    return results;
  } catch (err) {
    console.error('getContacts failed:', err.message);
    return [];
  }
}

// ---- Messages ----
async function saveMessage(fromId, toId, text, replyTo = null) {
  if (!isReady()) return null;
  try {
    const msg = await Message.create({ fromId, toId, msgType: 'text', text, replyTo: replyTo || undefined });
    return msg;
  } catch (err) {
    console.error('saveMessage failed:', err.message);
    return null;
  }
}

async function saveVoiceMessage(fromId, toId, audioData, duration, replyTo = null) {
  if (!isReady()) return null;
  try {
    const msg = await Message.create({ fromId, toId, msgType: 'voice', audioData, duration, replyTo: replyTo || undefined });
    return msg;
  } catch (err) {
    console.error('saveVoiceMessage failed:', err.message);
    return null;
  }
}

async function saveGifMessage(fromId, toId, gifData, replyTo = null) {
  if (!isReady()) return null;
  try {
    const msg = await Message.create({ fromId, toId, msgType: 'gif', gifData, replyTo: replyTo || undefined });
    return msg;
  } catch (err) {
    console.error('saveGifMessage failed:', err.message);
    return null;
  }
}

async function getThreadPage(userA, userB, limit = 30, beforeId = null) {
  if (!isReady()) return { messages: [], hasMore: false, oldestId: null };
  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 30, 10), 50);
    const query = {
      $or: [
        { fromId: userA, toId: userB },
        { fromId: userB, toId: userA },
      ],
    };
    if (beforeId && mongoose.isValidObjectId(beforeId)) {
      query._id = { $lt: beforeId };
    }
    const rows = await Message.find(query)
      .sort({ _id: -1 })
      .limit(safeLimit + 1)
      .lean();
    const hasMore = rows.length > safeLimit;
    const messages = rows.slice(0, safeLimit).reverse();
    return { messages, hasMore, oldestId: messages.length ? String(messages[0]._id) : null };
  } catch (err) {
    console.error('getThreadPage failed:', err.message);
    return { messages: [], hasMore: false, oldestId: null };
  }
}

async function markThreadRead(fromId, toId) {
  if (!isReady()) return;
  try {
    await Message.updateMany({ fromId, toId, read: false }, { $set: { read: true, readAt: new Date(), delivered: true, deliveredAt: new Date() } });
  } catch (err) {
    console.error('markThreadRead failed:', err.message);
  }
}


async function markMessageDelivered(messageId) {
  if (!isReady() || !messageId) return null;
  try { return await Message.findByIdAndUpdate(messageId, { $set: { delivered: true, deliveredAt: new Date() } }, { new: true }).lean(); }
  catch (err) { console.error('markMessageDelivered failed:', err.message); return null; }
}

async function markMessagesRead(fromId, toId) {
  if (!isReady()) return;
  try { await Message.updateMany({ fromId, toId, read: false }, { $set: { read: true, readAt: new Date(), delivered: true, deliveredAt: new Date() } }); }
  catch (err) { console.error('markMessagesRead failed:', err.message); }
}

async function editMessage(messageId, ownerId, text) {
  if (!isReady()) return null;
  try { return await Message.findOneAndUpdate({ _id: messageId, fromId: ownerId, msgType: 'text', deleted: { $ne: true } }, { $set: { text, editedAt: new Date() } }, { new: true }).lean(); }
  catch (err) { console.error('editMessage failed:', err.message); return null; }
}

async function deleteMessage(messageId, ownerId) {
  if (!isReady()) return null;
  try { return await Message.findOneAndUpdate({ _id: messageId, fromId: ownerId }, { $set: { deleted: true, text: '', gifData: null, audioData: null, editedAt: null } }, { new: true }).lean(); }
  catch (err) { console.error('deleteMessage failed:', err.message); return null; }
}

async function toggleReaction(messageId, userId, emoji) {
  if (!isReady()) return null;
  try {
    const msg = await Message.findById(messageId);
    if (!msg) return null;
    const idx = (msg.reactions || []).findIndex(r => r.userId === userId);
    if (idx >= 0 && msg.reactions[idx].emoji === emoji) msg.reactions.splice(idx, 1);
    else if (idx >= 0) msg.reactions[idx].emoji = emoji;
    else msg.reactions.push({ userId, emoji });
    await msg.save();
    return msg.toObject();
  } catch (err) { console.error('toggleReaction failed:', err.message); return null; }
}

async function touchContactLastSeen(deviceId) {
  if (!isReady() || !deviceId) return;
  try { await Contact.updateMany({ contactId: deviceId }, { $set: { lastSeenAt: new Date() } }); }
  catch (err) { console.error('touchContactLastSeen failed:', err.message); }
}

module.exports = {
  areContacts,
  connect,
  isReady,
  createAccount,
  verifyLogin,
  getAccountByDeviceId,
  updateAccount,
  saveContactPair,
  getContacts,
  deleteContact,
  saveMessage,
  saveVoiceMessage,
  saveGifMessage,
  getThreadPage,
  markThreadRead,
  markMessageDelivered,
  markMessagesRead,
  editMessage,
  deleteMessage,
  toggleReaction,
  touchContactLastSeen,
};
