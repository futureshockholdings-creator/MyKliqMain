---
name: Responsive navigation and posting controls
description: Centered wrapping tabs and icon-only Headlines tools, replacing the earlier scrolling and labeled-button approach.
---

Profile Settings, Profile Details, and MyKliq navigation tabs should retain full readable labels and wrap into centered rows rather than scroll horizontally. Keep natural widths, separated padding, and usable touch targets.

**Why:** After trying the scrolling layout, the user requested that these options stack onto a second line and be centered instead.

**How to apply:** Constrain the strip and its flex/grid parents to the available container width. Let labels wrap as complete buttons into additional centered rows when necessary; never squeeze them into fixed-width columns or truncate their text. Keep a single row when everything fits.

Headlines posting tools should use icon-only buttons without the newly added word labels. They should still wrap into additional rows on narrow screens, with the Post action separate.

**Why:** The user preferred the original icon-only appearance over the newer icons with words.

**How to apply:** Keep descriptive accessible names without adding visible labels. Respond to available container width rather than user-agent detection, preserve existing handlers and selected content, and retain member-selected themes.

Posted Headlines memes should be enlarged and centered, and posted Moviecons should use the card's available width while preserving proportions.

**Why:** The user chose filling the cards over avoiding upscaling, after being advised that low-resolution originals may look softer.

**How to apply:** Keep this presentation distinct from compact picker thumbnails, composer previews, and comment media. Do not crop or distort the source to force it into the frame.

Main navigation captions must remain complete and on one line, without cutting
off letters, regardless of the selected font.

**Why:** The user reported letter-by-letter wrapping after localization and
explicitly requested complete single-line navigation labels across font choices.

**How to apply:** Treat main navigation separately from wrapping page tabs.
Do not solve long translated navigation labels with arbitrary letter breaks,
clipping, ellipses or unreadably small type. Coordinate any adaptive sidebar
width with the page's content offset.

Prioritize the Headlines posting area over a wide mobile sidebar. Use readable
captions, moderately sized icons and a more compact vertical group rather than
spreading destinations across all available height. Alerts should remain near
the top and language selection near the bottom, with scrolling on shorter screens.

**Why:** After trying larger, evenly spaced navigation, the user still found it
too wide and too spread out. They said the prime Headlines posting space is
essential to user engagement and allowed reducing icon/label sizes again.

**How to apply:** Preserve single-line captions and content-aligned adaptive
width. Reduce excess padding and oversized auxiliary controls rather than
clipping text or hiding destinations; keep usable touch targets.
