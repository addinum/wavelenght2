// Wavelength Web Push sender.
// Uses the battle-tested web-push package for RFC-compliant encryption.
const crypto = require('crypto');
const webpush = require('web-push');

function fromB64u(s) {
  return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function vapidPublicKey(privateKeyB64) {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(fromB64u(privateKeyB64));
  return ecdh.getPublicKey(null, 'uncompressed').toString('base64url');
}

function sendPush(subscription, payload, vapidPrivateKey) {
  const publicKey = vapidPublicKey(vapidPrivateKey);
  webpush.setVapidDetails(
    'mailto:wavelength-notifications@example.com',
    publicKey,
    vapidPrivateKey
  );

  return webpush.sendNotification(
    subscription,
    JSON.stringify(payload),
    { TTL: 86400, urgency: 'high' }
  ).then(() => ({ statusCode: 201 }));
}

module.exports = { sendPush, vapidPublicKey };
