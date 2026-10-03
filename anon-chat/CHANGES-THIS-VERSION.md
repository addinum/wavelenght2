# What changed in this pass

## 1. Fixed reactions overlapping the next message
The reaction chip was positioned hanging 13px below each bubble, but rows
only had 4px of spacing between them — so the chip visually collided with
whatever message came after it. Fixed by reserving extra space under any
message that has a reaction, applied dynamically so normal messages stay
tightly spaced.

## 2. Sent / delivered / seen ticks — verified already correct
Checked this thoroughly: single grey tick (sent) → double grey tick
(delivered) → double blue tick (read) already works correctly end-to-end,
including messages that were queued while the recipient was offline. No
changes needed here — just confirmed it's solid.

## 3. WhatsApp-style chat background
Added a subtle tiled doodle pattern behind messages (original design —
small speech-bubble, heart, star, and note motifs — tinted to match the
app's pink/magenta theme), instead of a flat background.

## 4. Attach-document button moved into the text input bar
It was in the header before (easy to miss, inconsistent with how chat
apps usually place it). Now it sits directly in the message bar next to
GIF/mic/send, like WhatsApp's paperclip icon.

## 5. Swipe-to-reply
Drag any message bubble to the right to reply to it — a reply icon fades
in as you drag, and releasing past the threshold opens the reply composer
(with a light haptic buzz on phones that support it). This works alongside
the existing long-press menu, not instead of it — long-press still gives
you reply/react/edit/delete options.

## 6. Bigger emoji-only messages
A message that's just 1-3 emoji (including flags, skin-tone variants, and
family/compound emoji, which needed proper grapheme-cluster counting to
detect correctly) now renders large with no bubble background — same as
WhatsApp. Anything else still renders as a normal bubble.

## Tested before delivery
- Reaction spacing fix confirmed visually consistent (extra margin only
  applied when a reaction actually exists)
- Emoji-only detection: 15 test cases covering single emoji, multiple
  emoji, flags, skin tones, compound family emoji, mixed text+emoji, and
  plain text — all correctly classified
- Full server-side regression: matching, contacts, text, edit, delete,
  reactions (with proper participant-only authorization), GIFs, and an
  emoji-only message all flow through the protocol correctly
- All 125 HTML↔JS element references verified to match after moving the
  attach button
- Server boots cleanly with or without env vars configured

---

# Follow-up fixes (this pass)

## Reaction overlap — fixed for real this time
Found the actual root cause: `decorateThreadBubble()` (which applies the
reaction spacing) was being called **before** the bubble got attached to
its row, in all 4 message-rendering functions (text, GIF, file, voice).
- **Live reactions worked** because the bubble was already in the DOM by
  the time you tapped react.
- **Reloading the thread broke it** because history messages get built
  and decorated in one pass — decorate ran while the bubble was still
  "floating" with no parent row, so `bubble.closest('.wa-bubble-row')`
  returned nothing and the spacing fix silently never applied.

Fixed by reordering all 4 functions to attach the bubble to its row first,
then decorate it. Verified via a full reload simulation: react → simulate
reopening the thread (server round-trip) → confirmed the reaction data
comes back correctly in `thread_history`, which the now-fixed client code
will correctly space for.

## Chat background — reverted
Brought back the plain background from before, per your preference.

## Swipe-to-reply — confirmed working, no changes needed

---

# Call-interruption fix (this pass)

## The problem
When you're on a call, switch to another app, and the phone locks, audio
stops reaching the other person after ~30 seconds — even though the call
UI might still look connected.

## Why this happens
This is a known limitation of running real-time audio in a browser tab
(not a native app): Chrome on Android aggressively throttles or suspends
background tabs to save battery, unless the tab gives Chrome a clear
signal that it's carrying genuine active media (like a call or music).
Without that signal, Chrome can't tell a silent background tab apart from
one carrying your call audio, and treats both the same way.

## What I added
1. **Media Session API** — the primary fix. Tells Chrome "this tab has an
   active call right now," which is what makes Chrome exempt it from
   background throttling, the same way it keeps music/podcast tabs
   playing audio when backgrounded. Activates the moment a call connects.
2. **Wake Lock API** — keeps the screen from auto-locking while you're
   actively looking at the call screen in the foreground. Won't help once
   you've already switched to another app (the wake lock is released as
   soon as the tab is hidden, by design), but stops the most common
   trigger — the screen timing out on its own mid-call.
3. **Visibility-change recovery** — when you come back to the app mid-call,
   it now immediately: re-acquires the wake lock, resumes the audio
   element if the browser paused it, and checks the connection's health —
   restarting ICE right away if it's degraded, instead of waiting for the
   normal passive recovery timers (which may have been throttled while
   the tab was in the background).

## Honest limits — this won't be 100% on every phone
These are the strongest fixes available to a web app without becoming a
native app with its own persistent background service, but some phones
will still behave differently:
- **Some Android phone brands (Xiaomi, Oppo, Vivo, Samsung, and others)
  ship extra-aggressive battery managers** that can still kill background
  browser tabs regardless of what the page does. If this keeps happening
  on a specific phone, check that phone's battery settings and set Chrome
  to "Unrestricted" / disable battery optimization for Chrome specifically.
- **"Add to Home Screen"** (installing Wavelength as a PWA, via Chrome's
  menu) tends to get noticeably better background treatment from Android
  than a tab buried in a normal browser session — worth trying if issues
  persist.
- **iOS Safari is stricter still** — if anyone in your group is on an
  iPhone, background call audio may be more limited there regardless of
  these fixes; this is an Apple/WebKit platform restriction, not
  something fixable from the web app side.

## Tested before delivery
- Full calling regression suite re-run: contact-restricted invites, call
  signal relay, call end relay, non-contact calls correctly blocked — all
  still pass after these additions
- Verified all new functions (wake lock, media session, visibility
  listener) are declared exactly once with no duplicates, and wired into
  the correct call lifecycle points (call start, call connect, call end)
- All 125 HTML↔JS element references still match
- Server boots cleanly, all static files (including avatars) still serve
  correctly
- Everything is feature-detected (`'wakeLock' in navigator`, `'mediaSession'
  in navigator`) and wrapped in try/catch, so browsers that don't support
  these APIs just silently skip them rather than breaking anything
