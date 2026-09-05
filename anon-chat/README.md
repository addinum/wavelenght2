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

## Phone / browser push notifications

Wavelength now supports Web Push notifications for inbox messages. When a contact sends a message while you are not actively viewing that conversation, the notification shows:

- **Title:** contact name
- **Body:** the message text (or a short type label for GIF, voice, and files)
- Tapping the notification opens Wavelength and the contact conversation.

### Render setup

1. Deploy this project over **HTTPS** (Render provides HTTPS).
2. Create one persistent VAPID private key and add it to Render as:
   `VAPID_PRIVATE_KEY`
3. Generate a key with Node.js:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
4. Redeploy.
5. Open Wavelength on the phone and press **Find a stranger** once, then allow notifications when the browser asks.

The private VAPID key must stay in Render environment variables and must not be committed to GitHub.


## Final mobile tab release

- Home / Inbox / Settings bottom navigation retained.
- Settings cards are now full-width and responsive on narrow Android screens.
- Profile editing, avatars, account management, phone notifications, test push, theme toggle, inbox, stranger matching, contacts, chat, GIFs, voice notes, files, calls, replies, reactions, edit/delete, receipts, pagination, and presence are retained.
- `public/avatars/` is intentionally excluded from this ZIP.


## Functional back-button fix
- Restored the navigation helpers required by Inbox and bottom-tab buttons.
- Settings, Inbox, contact threads, and stranger chat return to Home on phone Back.
- Only Home shows the close-app dialog.
- Existing tab navigation and chat controls are preserved.
- `public/avatars/` is intentionally excluded.


## Final exit-dialog fix
- Bottom-tab switching no longer creates browser-history entries.
- A single persistent history sentinel handles Android Back.
- Settings/Inbox/Chat Back returns to Home without the exit dialog.
- Home Back alone opens the close-app dialog.


## Exit dialog v2
- Maintains a dedicated browser-history guard after the Home state.
- Home Back opens the close dialog.
- Settings, Inbox, and Chat Back return to Home without the dialog.
- Tab switching remains functional.
