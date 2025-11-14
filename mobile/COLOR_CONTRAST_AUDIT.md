# MyKliq Mobile - Color Contrast Audit

## Overview

This document audits the color contrast ratios in MyKliq mobile app to ensure **WCAG 2.1 Level AA** compliance:
- **Normal text** (< 18pt): 4.5:1 minimum contrast
- **Large text** (≥ 18pt or 14pt bold): 3:1 minimum contrast
- **UI components** (icons, borders): 3:1 minimum contrast

---

## Current Color Palette

### Base Colors (Dark Theme)
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Black/Dark Gray | `#000`, `#1a1a1a`, `#1F2937` | Main background |
| Card Background | Dark Gray | `#1F2937`, `#2C2C2C` | Cards, containers |
| Text (Primary) | White | `#FFFFFF`, `#fff` | Main text |
| Text (Muted) | Gray | `#888`, `#666`, `#999` | Secondary text |
| Border | Dark Gray | `#333`, `#444` | Borders, dividers |

### Theme Colors (User Customizable)
| Theme | Primary | Secondary | Default |
|-------|---------|-----------|---------|
| Purple | `#8B5CF6` | `#06B6D4` | ✓ |
| Ocean | `#0EA5E9` | `#10B981` | |
| Forest | `#10B981` | `#F59E0B` | |
| Sunset | `#F59E0B` | `#EF4444` | |
| Rose | `#EC4899` | `#8B5CF6` | |
| Emerald | `#059669` | `#0EA5E9` | |

### Accent Colors
| Element | Color | Hex |
|---------|-------|-----|
| Success/Active | Green | `#00FF00`, `#10B981` |
| Error/Danger | Red | `#EF4444`, `#DC2626` |
| Warning | Orange/Yellow | `#F59E0B`, `#FFC107` |

---

## Contrast Ratio Analysis

### ✅ PASSING Combinations

1. **White text on Black background**
   - Contrast: 21:1
   - Usage: Primary text, headings
   - Status: ✅ WCAG AAA (exceeds 4.5:1)

2. **White text on Dark Gray (#1F2937)**
   - Contrast: ~15:1
   - Usage: Card text, container text
   - Status: ✅ WCAG AAA

3. **Green (#00FF00) on Black**
   - Contrast: ~13:1
   - Usage: Active states, success indicators
   - Status: ✅ WCAG AAA

### ⚠️ POTENTIAL ISSUES

1. **Gray (#888) on Dark Gray (#1F2937)**
   - Estimated Contrast: ~3.2:1
   - Usage: Muted text, secondary labels
   - WCAG AA: ❌ Fails for normal text (needs 4.5:1)
   - WCAG AA: ✅ Passes for large text (needs 3:1)
   - **Recommendation**: Use for large text (≥18pt) only, or lighten to `#AAA` or `#B8B8B8`

2. **Purple Primary (#8B5CF6) on Black**
   - Estimated Contrast: ~7.5:1
   - Usage: Theme primary color, buttons
   - Status: ✅ WCAG AA (exceeds 4.5:1)
   - Note: Good for text, may need adjustment for small UI elements

3. **Ocean Primary (#0EA5E9) on Black**
   - Estimated Contrast: ~8:1
   - Usage: Theme primary color
   - Status: ✅ WCAG AA

4. **Gray (#666) on Dark Gray (#1F2937)**
   - Estimated Contrast: ~2.5:1
   - Usage: Placeholder text, hints
   - WCAG AA: ❌ Fails for all text sizes
   - **Recommendation**: Lighten to `#999` or `#AAA`

---

## Recommendations

### Priority 1: Immediate Fixes

1. **Muted Text Colors**:
   - Current: `#666`, `#888`
   - Recommended: `#AAA` or `#B8B8B8` for normal text
   - Fallback: Ensure only used for large text (≥18pt)

2. **Placeholder Text**:
   - Current: `#666`
   - Recommended: `#999` (minimum)
   - Rationale: TextInput placeholders should be distinguishable

### Priority 2: Component-Specific

1. **Tab Bar Icons**:
   - Inactive color: `#888`
   - Recommendation: Increase to `#AAA` for better visibility
   - Location: `AppNavigator.tsx`

2. **Story Name Labels**:
   - Current: Small text with potential low contrast
   - Recommendation: Ensure font size ≥14pt or increase contrast

3. **Offline Indicator**:
   - Current: White text on dark red background
   - Status: ✅ Should be acceptable (needs verification)

### Priority 3: High Contrast Mode

Add optional high contrast mode with:
- Pure white (`#FFFFFF`) on pure black (`#000`)
- No grays - only white/black/primary colors
- Increased border visibility (2px instead of 1px)
- Larger touch targets for buttons

---

## Implementation Approach

### Option A: Fix Current Palette (Recommended for MVP)

Update `tailwind.config.js` and inline styles to use WCAG AA compliant colors:

```javascript
// Improved muted colors
muted: {
  DEFAULT: 'hsl(240 3.7% 15.9%)', // Background
  foreground: 'hsl(240 5% 70%)', // #AAA instead of #888
},

// Improved card colors
card: {
  DEFAULT: 'hsl(240 10% 3.9%)',
  foreground: 'hsl(0 0% 98%)', // Ensure high contrast
},
```

### Option B: Add High Contrast Mode Toggle

1. **Add `highContrastMode` to UserTheme**:
   ```typescript
   interface UserTheme {
     // ... existing fields
     highContrastMode?: boolean;
   }
   ```

2. **Create High Contrast Palette**:
   ```typescript
   const HIGH_CONTRAST_COLORS = {
     background: '#000000',
     text: '#FFFFFF',
     muted: '#CCCCCC', // Instead of #888
     border: '#FFFFFF', // White borders
   };
   ```

3. **Add Toggle in ProfileScreen**:
   - Simple switch below theme presets
   - "Enable High Contrast Mode" label
   - Applies high contrast colors globally

---

## Testing Checklist

### Manual Testing

- [ ] Test with iOS accessibility inspector (Color Contrast Analyzer)
- [ ] Test with Android accessibility scanner
- [ ] Verify all text is readable in bright sunlight
- [ ] Verify all icons are distinguishable

### Automated Testing

- [ ] Run contrast checker tool on all screens
- [ ] Verify placeholder text meets 4.5:1 ratio
- [ ] Check border visibility for interactive elements

### Screen-by-Screen Audit

- [ ] **HomeScreen**: Story rings, post text, timestamps
- [ ] **ProfileScreen**: Stats, theme swatches, action buttons
- [ ] **MessagesScreen**: Unread indicators, message previews
- [ ] **ConversationScreen**: Message bubbles, input field
- [ ] **CreatePostScreen**: Placeholder text, media preview
- [ ] **FriendsScreen**: Friend names, tier labels, search input
- [ ] **KliqKoinScreen**: Stats, koin amounts, tier labels
- [ ] **StoryViewerScreen**: Progress bars, caption text

---

## Current Status

**✅ COMPLETED (Phase 4 Task 13):**
- ✅ Initial color contrast audit
- ✅ Identified potential WCAG AA violations and documented recommendations
- ✅ Improved `--muted-foreground` in `global.css` (64.9% → 70% lightness)
- ✅ **High Contrast Mode Implementation**:
  - Added `highContrastMode` property to UserTheme
  - Created HIGH_CONTRAST_COLORS palette (WCAG AA compliant)
  - Implemented resolvedColors computation in ThemeProvider
  - Created useAccessibleColors hook for components
  - Added toggle switch in ProfileScreen (under Theme section)
  - Updated AppNavigator.tsx tab bar to use accessible colors
  - Persists to backend and AsyncStorage for cross-device sync

**⏳ PENDING:**
- Manual contrast ratio measurements with accessibility tools
- Additional components to update (ProfileScreen, PostCard, etc. - follow AppNavigator pattern)
- Screen-by-screen testing with high contrast mode enabled
- Real device verification

---

## Resources

- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [iOS Accessibility Inspector](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/OSXAXTestingApps.html)
- [Android Accessibility Scanner](https://support.google.com/accessibility/android/answer/6376570)
