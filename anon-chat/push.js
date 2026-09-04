// Dependency-free Web Push sender (RFC 8291 + VAPID / RFC 8292).
// Keeps Wavelength lightweight: no extra npm package is required.
const crypto = require('crypto');
const https = require('https');

const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const fromB64u = (s) => Buffer.from(String(s).replace(/-/g,'+').replace(/_/g,'/'), 'base64');
const hkdf = (salt, ikm, info, len) => crypto.hkdfSync('sha256', ikm, salt, Buffer.from(info), len);

function vapidPublicKey(privateKeyB64) {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(fromB64u(privateKeyB64));
  return b64u(ecdh.getPublicKey(null, 'uncompressed'));
}

function vapidJwt(audience, privateKeyB64) {
  const header = b64u(Buffer.from(JSON.stringify({ typ:'JWT', alg:'ES256' })));
  const now = Math.floor(Date.now()/1000);
  const payload = b64u(Buffer.from(JSON.stringify({ aud: audience, exp: now + 12*60*60, sub: 'mailto:wavelength-notifications@localhost' })));
  const input = Buffer.from(`${header}.${payload}`);
  const keyBytes = fromB64u(privateKeyB64);
  const key = crypto.createPrivateKey({ key: Buffer.concat([
    // SEC1 EC private key for prime256v1, with the supplied 32-byte scalar.
    Buffer.from('30770201010420','hex'), keyBytes,
    Buffer.from('a00a06082a8648ce3d030107a144034200','hex')
  ]), format:'der', type:'sec1' });
  const sig = crypto.sign('sha256', input, { key, dsaEncoding:'ieee-p1363' });
  return `${header}.${payload}.${b64u(sig)}`;
}

function aesGcmEncrypt(plaintext, cek, nonce) {
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const out = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  return out;
}

function encryptPayload(subscription, json) {
  const p256dh = fromB64u(subscription.keys.p256dh);
  const authSecret = fromB64u(subscription.keys.auth);
  const clientPublic = p256dh;
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const serverPublic = ecdh.getPublicKey(null, 'uncompressed');
  const sharedSecret = ecdh.computeSecret(clientPublic);

  const salt = crypto.randomBytes(16);
  // RFC 8291: PRK_key = HKDF-Extract(auth_secret, ECDH_secret),
  // then IKM = HKDF-Expand(PRK_key, WebPush info, 32).
  const prkKey = crypto.createHmac('sha256', authSecret).update(sharedSecret).digest();
  const authInfo = Buffer.concat([Buffer.from('WebPush: info\0'), clientPublic, serverPublic]);
  const ikm2 = hkdf(Buffer.alloc(0), prkKey, authInfo, 32);
  const prk2 = crypto.createHmac('sha256', salt).update(ikm2).digest();
  const cek = hkdf(salt, prk2, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, prk2, Buffer.from('Content-Encoding: nonce\0'), 12);

  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(json)), Buffer.from([2])]);
  const ciphertext = aesGcmEncrypt(plaintext, cek, nonce);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096, 0);
  const body = Buffer.concat([salt, rs, Buffer.from([serverPublic.length]), serverPublic, ciphertext]);
  return { body, salt, serverPublic };
}

function sendPush(subscription, payload, vapidPrivateKey) {
  return new Promise((resolve, reject) => {
    try {
      const endpoint = new URL(subscription.endpoint);
      const { body, salt, serverPublic } = encryptPayload(subscription, payload);
      const audience = `${endpoint.protocol}//${endpoint.host}`;
      const jwt = vapidJwt(audience, vapidPrivateKey);
      const req = https.request({
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port || 443,
        path: endpoint.pathname + endpoint.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'Content-Length': body.length,
          'TTL': '86400',
          'Urgency': 'high',
          'Authorization': `vapid t=${jwt}, k=${vapidPublicKey(vapidPrivateKey)}`,
        },
      }, res => {
        res.resume();
        res.on('end', () => resolve({ statusCode: res.statusCode || 0 }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (e) { reject(e); }
  });
}

module.exports = { sendPush, vapidPublicKey };
