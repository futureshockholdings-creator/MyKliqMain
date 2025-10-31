# MyKliq Mood Boost Feature Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from Instagram's Stories/Reels engagement patterns, BeReal's authentic friend-focused UI, and Snapchat's playful visual language. The Mood Boost feature requires custom components that feel native to social media interactions while standing out as special, uplifting moments.

**Core Principle**: Create an instantly recognizable, dopamine-triggering visual treatment that makes Mood Boost posts feel like delightful surprises in the feed without disrupting the browsing flow.

---

## Typography System

**Primary Font**: Inter or DM Sans (Google Fonts CDN)
- Display headers: 700 weight, -0.02em tracking
- Body text: 500 weight, standard tracking
- Badge/label text: 600 weight, uppercase, 0.05em tracking

**Type Scale (Tailwind)**:
- Feed post captions: text-sm (14px)
- Mood Boost headline: text-lg (18px)
- "✨ Just for you" label: text-xs (12px)
- User handles: text-sm with 500 weight
- Badge text: text-[10px] (custom 10px for compact badge)

---

## Layout & Spacing System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, 8, and 12 consistently
- Card padding: p-4
- Section gaps: space-y-3 for tight groupings, space-y-6 between major sections
- Icon-to-text spacing: gap-2
- Button padding: px-6 py-3

**Container Structure**:
- Mobile viewport: w-full with px-4 outer padding
- Cards: rounded-2xl with overflow-hidden
- Max content width: No constraints (full mobile width minus padding)

---

## Component Library

### A. Mood Boost Post Card

**Card Structure**:
- Elevated, oversized card compared to regular posts (appears 10% larger visually)
- Layered shadow treatment: Multi-level shadow with both soft outer glow and crisp inner shadow
- Border treatment: 2px gradient border simulation using padding technique
- Rounded corners: rounded-3xl (more dramatic than standard posts)

**Visual Hierarchy (top to bottom)**:
1. **Header Section** (p-4):
   - "✨ Just for you" label (text-xs, 600 weight, uppercase, opacity-90)
   - Mood Boost badge: Pill-shaped with rounded-full, px-3 py-1, positioned top-right as floating badge with backdrop-blur-md
   
2. **Image Container**:
   - Aspect ratio: aspect-[4/5] (portrait orientation for mobile feeds)
   - Full-width within card (no padding on sides)
   - Apply subtle gradient overlay (bottom to top, from semi-transparent to fully transparent) for text readability
   
3. **Content Overlay** (absolute positioning, bottom of image):
   - Backdrop blur treatment: backdrop-blur-lg with semi-transparent background
   - Inner padding: p-4
   - Headline text: text-lg, 700 weight, multi-line support with line-clamp-3
   - Micro-animations: Gentle scale pulse on card appearance (scale from 0.95 to 1)

4. **Action Bar** (p-4, bg with slight opacity):
   - Share button with icon (Heroicons "share" icon)
   - Save button with icon (Heroicons "bookmark" icon)
   - Gap between actions: gap-4

### B. Regular Post Card (For Contrast)

- Standard rounded-xl corners
- Single-level shadow (less dramatic)
- No gradient borders
- No floating badges
- Standard aspect-[1/1] or aspect-[4/5] depending on content
- No backdrop blur overlays
- Simpler header with user avatar + handle

### C. Feed Layout

**Scroll Structure**:
- Vertical scroll feed with space-y-6 between all posts
- Mood Boost posts interspersed every 4-6 regular posts
- Pull-to-refresh indicator at top: Minimal spinner with bounce animation

**Navigation**:
- Bottom tab bar: Fixed position with backdrop-blur-xl
- Tab items: Icon-only with active state indicator (scale transform + visual weight)
- Icons: Heroicons (home, search, add, notifications, profile)
- Tab padding: py-3, gap-8 between items

### D. Mood Boost Badge Component

- Pill shape: rounded-full
- Text: "Mood Boost" in text-[10px], 700 weight, uppercase
- Padding: px-2.5 py-1
- Floating position: absolute top-4 right-4
- Backdrop blur: backdrop-blur-md for glassmorphism effect
- Drop shadow: Small tight shadow for depth

### E. Interactive Elements

**Primary Buttons** (on images):
- Rounded-xl, px-6 py-3
- Backdrop-blur-lg background treatment
- Semi-transparent base with 600 weight text
- Icon + text combinations using gap-2
- No explicit hover states (mobile-focused)

**Icon Buttons**:
- Touch target: min 44x44px (p-3 on icons)
- Heroicons outline style for inactive, solid for active states
- Active state: Transform scale-110 with transition-transform duration-200

---

## Images

**Mood Boost Post Images**:
- Hero image per post: Full-width portrait orientation (aspect-[4/5])
- Content: Vibrant, abstract gradients, nature scenes, or uplifting illustrations
- Treatment: Slight saturation boost, soft vignette edge treatment
- Overlay: Linear gradient from bottom (40% opacity) fading to top (0% opacity)

**Image Placement**:
- Each Mood Boost card contains ONE primary hero image
- Image fills card width completely, extends to card edges horizontally
- Positioned between header section and content overlay

**Regular Post Images**:
- Standard aspect ratios: square (1:1) or portrait (4:5)
- No special treatments or overlays
- Clean, simple presentation

---

## Interaction Patterns

**Scroll Behavior**:
- Native momentum scrolling
- No snap points or pagination
- Infinite scroll with progressive loading

**Card Interactions**:
- Tap anywhere on Mood Boost card: Expand to full-screen detail view
- Long-press: Quick action menu (Share, Save, Hide)
- Swipe gesture: None (preserve native scroll)

**Entry Animation** (Mood Boost cards only):
- Fade-in with scale animation: opacity 0→1, scale 0.95→1
- Duration: 400ms with ease-out timing
- Stagger delay: 100ms if multiple Mood Boost posts appear together

---

## Accessibility Standards

- All interactive elements: minimum 44x44px touch targets
- Icon buttons: Include aria-labels for screen readers
- Image alt text: Required for all Mood Boost post images
- Focus indicators: 2px outline with offset on keyboard navigation
- Text contrast: Maintain WCAG AA compliance (4.5:1 minimum) for all overlaid text via backdrop treatments

---

**Layout Principle**: Mood Boost posts should feel like premium, curated content drops—visually richer, more polished, and more engaging than standard posts. The design creates anticipation and reward through elevated visual treatment while remaining familiar enough to feel native to the feed experience.