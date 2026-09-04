# Wavelength Push Notifications — v3

## 1. Render Environment Variable (required)

Add this environment variable to your Render service:

`VAPID_PRIVATE_KEY`

Generate a stable VAPID private key locally with:

```bash
npx web-push generate-vapid-keys
```

Copy the **privateKey** value into Render. Do not change it after deployment.

## 2. Render build/start

Build Command:
```bash
npm install
```

Start Command:
```bash
node server.js
```

Do not use `npm ci` with this ZIP because the old lockfile was intentionally removed;
Render should generate a fresh lock from `package.json`.

## 3. After deploying

1. Open Wavelength on Android Chrome.
2. Allow notifications.
3. Use **Enable Phone Notifications**.
4. If an old subscription existed, use the reset option/test flow in the app or clear the site's notification data once and enable again.
5. Press **Test Notification**.
6. Render should no longer show `Push skipped: no subscription for ...`.

## 4. What v3 fixes

- Re-subscribes automatically when the server VAPID public key changes.
- Re-binds the push subscription after account login changes the canonical device ID.
- Reports push-test failures instead of pretending the test was sent.
- Requires a stable Render `VAPID_PRIVATE_KEY` instead of generating a different key on every restart.
- Removes the Mongoose `new` deprecation warning.
- `public/avatars/` is intentionally not included.
