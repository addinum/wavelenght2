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
