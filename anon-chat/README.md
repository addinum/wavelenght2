# Wavelength — Premium Neon-Glass Anonymous Chat + Inbox + Voice Notes

## What's in this version
- Full visual redesign: black/charcoal base, magenta-pink accents, glassmorphism
  panels, glowing borders, gradient buttons, floating background particles
- Voice notes in the Inbox (record, send, playback with waveform)
- Everything from before still works: anonymous stranger chat, contact
  requests, persistent inbox with read receipts, typing indicators, back
  button confirmation, auto-reconnect

## Voice notes: how it works
- Tap the mic button in a contact's thread to start recording
- Tap again (or the send button in the recording bar) to stop and send
- Recordings are capped at 90 seconds client-side, 120 seconds server-side,
  and individual notes over ~1.5MB are rejected — this protects your
  MongoDB Atlas free tier (512MB total) from filling up too fast
- Voice notes are stored directly in MongoDB as base64 audio. This is the
  simplest approach for a small group of friends, but uses storage faster
  than text. If you outgrow the free tier, consider moving audio to a
  free file host like Cloudinary and storing only a URL in MongoDB instead.
- Needs microphone permission — the browser will prompt on first use.
  Requires HTTPS (your Render URL already has this) — mic access is
  blocked on plain HTTP for security reasons.

## Run it locally
```bash
npm install
node server.js
```
Then open http://localhost:3000

## Deploying
Same as before — push to GitHub, Render auto-deploys. Make sure
`MONGODB_URI` is still set in your Render environment variables (inbox +
voice notes need it; anonymous chat works fine without it).
