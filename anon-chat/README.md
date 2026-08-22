# Wavelength — Premium Neon-Glass Anonymous Chat + Inbox + Voice Notes + Avatars

## New in this version

### 1. Proper mobile back-button navigation
- In a live stranger chat: back button asks for confirmation before leaving
  (unchanged from before)
- In the Inbox: Thread -> Inbox -> Landing/home, one level per back press,
  no confirmation needed
- Both the phone's hardware back button and the on-screen "← Back" buttons
  now go through the same logic, so they always agree

### 2. Chosen avatars (10 stylized presets)
**Honesty note:** these are original stylized SVG character faces (varied
hairstyles/colors), not real anime artwork — there's no image-generation
tool available to produce that. This is a clean, on-brand alternative that
needs zero external image assets or extra hosting.
- Pick an avatar on the landing screen; it's saved in your browser and sent
  to the server on every connection
- Shows up in: the live stranger-chat header, the Inbox contact list, and
  the Thread header
- No accounts needed — same "no login" philosophy as everything else here

## Everything from before still works
Anonymous stranger chat, persistent inbox with read receipts and typing
indicators, voice notes, MongoDB-backed contacts, auto-reconnect, and the
full neon-glass visual redesign.

## Run it locally
```bash
npm install
node server.js
```
Then open http://localhost:3000

## Deploying
Same as before — push to GitHub, Render auto-deploys. `MONGODB_URI` env var
still needed for inbox/voice notes/avatars-in-contacts; anonymous chat works
fine without it.
