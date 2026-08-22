# Wavelength — Neon-Glass Anonymous Chat + Inbox + Voice Notes + Real Avatars

## New in this version
Your 10 AI-generated anime-style avatars (boy1-5, girl1-5) are now live in
the app, replacing the earlier placeholder SVG designs.

- Original images were ~1.5-2MB each (17MB total) — resized to 320x320 and
  compressed to JPEG for the web, now ~220KB total (a 74x reduction) with
  no visible quality loss at avatar size
- Stored in `public/avatars/`
- Picker on the landing screen, shown in live stranger-chat header, Inbox
  list, and Thread header — same as before, just real art now
- Server validates avatar IDs against a strict whitelist, so a malicious
  or malformed ID can never reach the filesystem or crash anything

## Everything else unchanged
Anonymous stranger chat, persistent inbox with read receipts/typing
indicators, voice notes, proper multi-level back-button navigation,
and the full neon-glass visual redesign.

## Run it locally
```bash
npm install
node server.js
```
Then open http://localhost:3000

## Deploying
Same as before — push to GitHub, Render auto-deploys. Make sure the whole
`public/avatars/` folder gets uploaded along with everything else.
