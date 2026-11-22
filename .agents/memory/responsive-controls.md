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

Keep mobile navigation visually balanced with larger icons/readable captions
and menu items distributed down the available height, rather than clustered
at the top. Alerts should remain near the top and language selection near
the bottom, with vertical scrolling on shorter screens.

**Why:** The user found the adaptive sidebar too wide relative to its small
icons/text and approved larger controls with more vertical distribution.

**How to apply:** Preserve single-line captions and content-aligned adaptive
width; do not gain vertical spacing by shrinking touch targets or hiding items.
