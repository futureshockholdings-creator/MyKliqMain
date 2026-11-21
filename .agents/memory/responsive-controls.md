---
name: Responsive navigation and posting controls
description: User-approved distinction between horizontally scrolling navigation tabs and wrapping action toolbars.
---

Navigation tabs should retain full readable labels in a single horizontally scrolling row, with natural nonshrinking widths, separated padding, and usable touch targets. Do not replace labels with icons alone on narrow phones.

**Why:** The user reported crowded MyKliq and profile-settings tabs and approved scrolling navigation instead of compressed, overlapping, or truncated labels.

**How to apply:** Constrain the strip and its flex/grid parents to the available container width. Make overflow discoverable and bring the active tab into horizontal view without moving the page vertically. Keep the existing single-row desktop experience when everything fits.

Posting tools should wrap into additional rows on narrow screens rather than hide actions behind horizontal scrolling. Keep their labels readable and the Post action separate.

**Why:** The user approved keeping sharing actions visible while reserving horizontal scrolling for navigation tabs.

**How to apply:** Respond to available container width rather than user-agent detection, preserve existing handlers and selected content, and retain member-selected themes.
