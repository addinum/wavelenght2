# Wavelength — Neon-Glass Anonymous Chat + Inbox + Voice Notes + Avatars + Optional Login

## New in this version: optional email login

You can now create an account (email + password) so your inbox and
contacts follow you across incognito windows, different browsers, or
different devices — while anonymous chat with no account stays fully
supported and is still the default.

### How it works
- Everything is still built on the same anonymous `deviceId` system as
  before — creating an account just links your email/password to
  whichever `deviceId` you're currently using
- Your existing contacts and inbox messages need **zero migration**: they
  were already tied to your `deviceId`, so the moment you sign up, an
  account now points at that same data
- Logging in on a new browser/incognito/device fetches your account's
  original `deviceId` and switches that browser to use it — your contacts
  and inbox appear immediately
- You can edit your email and/or password anytime from the account modal
  (requires your current password to confirm changes)
- "Sign out" only forgets you're logged in *on this browser* — the account
  and its data are untouched, and you can log back in anytime

### Honest limitations (worth knowing before relying on this)
- **No email verification.** Signing up just checks the email looks
  valid — it doesn't send a confirmation email. Anyone could type in any
  email address. Fine for a small friends group, not something to expose
  publicly as-is.
- **No password reset.** If someone forgets their password, there's no
  "forgot password" email flow — you'd need to add one to MongoDB Atlas
  directly, or I can build a proper reset-via-email flow later if needed.
- **If you had DIFFERENT contacts on two different anonymous browsers
  before creating an account**, only the browser you signed up FROM keeps
  its contacts by default. Logging into the account from the other
  browser will switch it to the account's `deviceId` too, but any
  contacts that were only ever on that second browser (added anonymously,
  before ever signing in) won't automatically merge in. This only matters
  if you used the app anonymously on multiple browsers before creating an
  account.

## Everything else unchanged
Anonymous stranger chat, persistent inbox with read receipts/typing
indicators, voice notes, real anime-style avatars, and the full
neon-glass visual redesign.

## Run it locally
```bash
npm install
node server.js
```
Then open http://localhost:3000

## Deploying
Same as before — push to GitHub, Render auto-deploys. `MONGODB_URI` still
needed for accounts/inbox/voice notes/avatars-in-contacts.
