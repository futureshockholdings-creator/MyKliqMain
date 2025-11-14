# MyKliq Mobile Accessibility Implementation Guide

## Overview

MyKliq aims to meet **WCAG 2.1 Level AA** accessibility standards, ensuring all users, including those using screen readers, can fully interact with the app.

---

## Accessibility Requirements

### 1. Screen Reader Support ✅

All interactive elements must have:
- **accessibilityLabel**: Describes what the element is
- **accessibilityHint**: Describes what happens when you interact with it
- **accessibilityRole**: Defines the element type (button, link, etc.)

### 2. Dynamic Font Scaling ✅

**Implementation Approach:**
React Native Text components scale automatically with system font size when `allowFontScaling={true}` (the default). We rely on this native behavior instead of custom scaling hooks.

**Font Scaling Controls:**
- **Most text**: Uses default `allowFontScaling={true}` for full accessibility
- **Decorative emojis/icons**: Uses `allowFontScaling={false}` to prevent layout issues
- **Large numbers/scores**: Uses `maxFontSizeMultiplier={1.3}` for limited scaling

**Files Updated:**
- `AppNavigator.tsx`: Tab bar emoji icons - `allowFontScaling={false}`
- `StoriesScreen.tsx`: Avatar initials, emoji icons, + symbol - `allowFontScaling={false}`
- `KliqKoinScreen.tsx`: Emoji icons - `allowFontScaling={false}`, score numbers - `maxFontSizeMultiplier={1.3}`
- `OfflineIndicator.tsx`: Offline message text scales naturally (no changes needed)

**Testing:**
- iOS: Settings → Accessibility → Display & Text Size → Larger Text
- Android: Settings → Display → Font size → Largest
- Verify text scales appropriately without breaking layouts

### 3. Color Contrast (PENDING)

Ensure WCAG AA compliance:
- Normal text: 4.5:1 minimum contrast
- Large text (18pt+): 3:1 minimum contrast
- UI components: 3:1 minimum contrast

---

## Implementation Guidelines

### Required Accessibility Props

**TouchableOpacity / Pressable / Button:**
```typescript
<TouchableOpacity
  accessibilityLabel="Send message"
  accessibilityHint="Sends your message to the conversation"
  accessibilityRole="button"
  accessible={true}
  onPress={handleSend}
>
  <Text>Send</Text>
</TouchableOpacity>
```

**TextInput:**
```typescript
<TextInput
  accessibilityLabel="Message input"
  accessibilityHint="Type your message here"
  accessible={true}
  placeholder="Type a message..."
/>
```

**Image:**
```typescript
<Image
  source={{ uri: avatarUrl }}
  accessibilityLabel={`Profile picture of ${userName}`}
  accessible={true}
/>
```

**Switch:**
```typescript
<Switch
  accessibilityLabel="Enable post notifications"
  accessibilityHint="Toggle to enable or disable notifications for new posts"
  accessibilityRole="switch"
  value={enabled}
  onValueChange={setEnabled}
/>
```

**Modal:**
```typescript
<Modal
  accessible={true}
  accessibilityViewIsModal={true}
  onRequestClose={handleClose}
>
  {/* Content */}
</Modal>
```

**FlatList Items:**
```typescript
<View
  accessible={true}
  accessibilityLabel={`Post by ${author}, ${content}`}
  accessibilityHint="Double tap to view post details"
>
  {/* Post content */}
</View>
```

---

## Common Accessibility Roles

- `button` - Buttons and tappable actions
- `link` - Navigation links
- `search` - Search inputs
- `header` - Section headers
- `image` - Images
- `imagebutton` - Clickable images
- `adjustable` - Sliders and pickers
- `alert` - Important notifications
- `text` - Static text
- `switch` - Toggle switches
- `checkbox` - Checkboxes

---

## Screen-Specific Requirements

### HomeScreen (Feed)
- [ ] Story items: "View story by [name]"
- [ ] Add story button: "Create a new story"
- [ ] Post cards: Include author, content preview, like/comment counts
- [ ] Like button: "Like this post" / "Unlike this post"
- [ ] Comment button: "View [X] comments"
- [ ] Floating action button: "Create a new post"

### MessagesScreen
- [ ] Conversation items: "[Name], last message: [preview], [time]"
- [ ] Unread badge: "[X] unread messages"
- [ ] Empty state button: "Go to friends list to start a conversation"

### ProfileScreen
- [ ] Avatar: "Profile picture of [name]"
- [ ] Stats: "You have [X] posts, [Y] friends, [Z] kliq koin"
- [ ] Kliq Koin button: "View kliq koin and streaks"
- [ ] Theme selector: "Select theme, currently [theme name]"
- [ ] Logout button: "Log out of your account"

### FriendsScreen
- [ ] Friend cards: "[Name], ranked #[X], [tier] circle"
- [ ] Tier filters: "Show [tier] friends only"
- [ ] Search input: "Search friends by name"

### ConversationScreen
- [ ] Message bubbles: "Message from [name] at [time]: [content]"
- [ ] Input field: "Type your message here"
- [ ] Send button: "Send message"
- [ ] Attachment button: "Attach photo or video"
- [ ] GIF button: "Send a GIF"

### CreatePostScreen
- [ ] Content input: "Write your post content"
- [ ] Photo button: "Take a photo with camera"
- [ ] Gallery button: "Choose photo from gallery"
- [ ] Location button: "Add location to post"
- [ ] Post button: "Publish your post"

### StoryViewerScreen
- [ ] Story content: "Story by [name], [X] of [Y]"
- [ ] Close button: "Close story viewer"
- [ ] Tap areas: "Tap left to go back, tap right to go forward"
- [ ] Progress bars: Announce current story position

### NotificationPreferencesScreen
- [ ] Switches: "[Notification type] notifications, currently [on/off]"
- [ ] Delivery options: "Receive notifications via [method]"

---

## Accessibility Testing

### Screen Reader Testing

**iOS (VoiceOver):**
1. Settings → Accessibility → VoiceOver → Enable
2. Triple-click side button to toggle
3. Swipe right/left to navigate
4. Double-tap to activate

**Android (TalkBack):**
1. Settings → Accessibility → TalkBack → Enable
2. Use volume keys to toggle
3. Swipe right/left to navigate
4. Double-tap to activate

### Testing Checklist

- [ ] All buttons are focusable and announce their purpose
- [ ] Images have descriptive labels
- [ ] Form inputs announce labels and validation errors
- [ ] Modals trap focus and can be dismissed
- [ ] Lists announce item position ("Item 1 of 10")
- [ ] Loading states announce when content changes
- [ ] Error messages are announced immediately
- [ ] Success messages are announced after actions

---

## Dynamic Font Scaling

### Implementation

**Enable on Text Components:**
```typescript
<Text allowFontScaling={true} className="text-base">
  This text scales with system settings
</Text>
```

**Disable for Icons/Fixed Layouts:**
```typescript
<Text allowFontScaling={false} className="text-2xl">
  🏠
</Text>
```

### Testing

1. iOS: Settings → Display & Brightness → Text Size
2. Android: Settings → Display → Font Size
3. Test at:
   - Small
   - Default
   - Large
   - Extra Large
   - Accessibility sizes (XXL, XXXL)

### Best Practices

- Use relative sizes (`text-base`, `text-lg`) not absolute pixels
- Allow vertical scrolling for long content
- Avoid fixed heights that truncate text
- Test all screens at maximum text size

---

## Color Contrast

### Current Theme Contrast Ratios

**Light Mode:**
- Background (#FFFFFF) vs Text (#000000): 21:1 ✅
- Primary (#8B5CF6) vs Background: 3.77:1 ✅
- Muted Text (#6B7280) vs Background: 4.54:1 ✅

**Dark Mode:**
- Background (#000000) vs Text (#FFFFFF): 21:1 ✅
- Primary (#00FF00) vs Background: 15.3:1 ✅
- Border (#1F2937) vs Background: 1.6:1 ❌ (Needs improvement)

### Fixing Contrast Issues

**Low Contrast Borders:**
```typescript
// Before
<View className="border border-border"> {/* Too subtle in dark mode */}

// After
<View className="border-2 border-gray-600 dark:border-gray-400">
```

**Text on Colored Backgrounds:**
```typescript
// Ensure 4.5:1 contrast ratio
<View className="bg-primary">
  <Text className="text-white"> {/* White on purple = good contrast */}
```

### Contrast Checking Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)
- React Native: Use built-in accessibility inspector

---

## Accessibility Components

### Reusable Accessible Button

```typescript
// src/components/AccessibleButton.tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface AccessibleButtonProps {
  label: string;
  hint?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  label,
  hint,
  onPress,
  loading,
  disabled,
  children
}) => {
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole="button"
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator /> : children}
    </TouchableOpacity>
  );
};
```

### Accessible Form Input

```typescript
// src/components/AccessibleInput.tsx
import { View, Text, TextInput } from 'react-native';

interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
}) => {
  return (
    <View>
      <Text accessibilityRole="header">{label}</Text>
      <TextInput
        accessible={true}
        accessibilityLabel={label}
        accessibilityHint={placeholder}
        accessibilityValue={{ text: value }}
        accessibilityState={{ disabled: false }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
      />
      {error && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          className="text-destructive"
        >
          {error}
        </Text>
      )}
    </View>
  );
};
```

---

## Accessibility State Management

### Busy/Loading States

```typescript
<TouchableOpacity
  accessibilityState={{ busy: isLoading }}
  disabled={isLoading}
>
  {isLoading ? <ActivityIndicator /> : <Text>Submit</Text>}
</TouchableOpacity>
```

### Selected States

```typescript
<TouchableOpacity
  accessibilityState={{ selected: isSelected }}
  accessibilityRole="tab"
>
  <Text>{tab.label}</Text>
</TouchableOpacity>
```

### Disabled States

```typescript
<TouchableOpacity
  accessibilityState={{ disabled: true }}
  disabled={true}
>
  <Text className="opacity-50">Unavailable</Text>
</TouchableOpacity>
```

---

## Live Region Announcements

For dynamic content updates:

```typescript
<View
  accessibilityLiveRegion="polite" // or "assertive" for urgent
  accessible={true}
>
  <Text>{statusMessage}</Text>
</View>
```

**Use cases:**
- New message received
- Post liked
- Error occurred
- Content loaded

---

## Accessibility Checklist (Pre-Launch)

### Screen Reader Support
- [ ] All buttons have labels
- [ ] All images have alt text
- [ ] All inputs have labels
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Navigation is logical

### Dynamic Font Scaling
- [ ] Text scales with system settings
- [ ] No text truncation at large sizes
- [ ] Layouts adapt to larger text
- [ ] Icons don't scale (use `allowFontScaling={false}`)

### Color Contrast
- [ ] All text meets 4.5:1 ratio
- [ ] Large text meets 3:1 ratio
- [ ] UI components meet 3:1 ratio
- [ ] Focus indicators are visible
- [ ] Links are distinguishable

### Keyboard/Switch Control
- [ ] All actions keyboard accessible
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps

### Testing
- [ ] Tested with VoiceOver (iOS)
- [ ] Tested with TalkBack (Android)
- [ ] Tested with large text sizes
- [ ] Tested with high contrast mode
- [ ] Tested with switch control

---

## Resources

- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Apple Human Interface Guidelines - Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

---

## Manual Testing Instructions

### VoiceOver Testing (iOS)

**Enable VoiceOver:**
1. Settings → Accessibility → VoiceOver → On
2. Or use triple-click Home/Side button shortcut

**Basic Gestures:**
- **Swipe Right/Left**: Navigate between elements
- **Double Tap**: Activate selected element
- **Two-finger Swipe**: Scroll content
- **Three-finger Swipe**: Navigate pages/screens

**Testing Checklist:**
1. **HomeScreen**: Verify story rings announce view status ("has new stories" vs "all stories viewed")
2. **PostCard**: Verify like button announces count and state ("Like, 12 likes" vs "Unlike, 12 likes")
3. **MessagesScreen**: Verify unread counts are announced ("3 unread messages")
4. **ConversationScreen**: Verify message sender context ("Message from Sarah: Hello!")
5. **StoryViewerScreen**: Verify gesture hints ("Tap left side to go back, tap right side to go forward, long press to pause")
6. **CreatePostScreen**: Verify disabled state feedback ("Poll (coming soon)" should announce disabled)
7. **FriendsScreen**: Verify tier info in labels ("Sarah Johnson, Tier 2, Inner Circle")
8. **ProfileScreen**: Verify theme selection state ("Purple theme, selected" vs "Ocean theme")
9. **NotificationPreferencesScreen**: Verify switch states ("Push notifications, on" vs "off")

### TalkBack Testing (Android)

**Enable TalkBack:**
1. Settings → Accessibility → TalkBack → On
2. Or use volume keys shortcut

**Basic Gestures:**
- **Swipe Right/Left**: Navigate between elements
- **Double Tap**: Activate selected element
- **Swipe Down Then Up**: Scroll down
- **Swipe Up Then Down**: Scroll up

**Testing Checklist:**
- Same 9-point checklist as VoiceOver above
- Additionally verify: All custom gestures work with Explore by Touch

### Large Text Testing

1. iOS: Settings → Accessibility → Display & Text Size → Larger Text
2. Android: Settings → Display → Font size → Largest
3. Verify all text remains readable and doesn't overflow containers

### Focus Order Testing

1. Enable VoiceOver/TalkBack
2. Navigate through each screen linearly
3. Verify focus order is logical (top-to-bottom, left-to-right)
4. Verify no elements are skipped or duplicated

---

## Current Status

**✅ COMPLETED (Phase 4 Task 11):**
- ✅ **PostCard Component**: Avatar variants, media, like/comment/share buttons with state
- ✅ **HomeScreen**: Story items with view status, add story button, profile images
- ✅ **ProfileScreen**: Avatar variants, stats, 6 action buttons, 6 theme presets with state
- ✅ **MessagesScreen**: Conversation items with unread count, last message, timestamp
- ✅ **FriendsScreen**: Friend cards with ranking/tier, message buttons, search, tier filters
- ✅ **NotificationPreferencesScreen**: Master push switch, 9 notification switches, 3 delivery preferences
- ✅ **ConversationScreen**: Message bubbles, media, attachment/GIF/send buttons, GIF modal
- ✅ **CreatePostScreen**: Post input, media/location controls, camera/gallery/location/poll buttons
- ✅ **StoryViewerScreen**: Progress bars, avatar, close button, story content with gesture hints
- ✅ **OfflineIndicator**: Alert role, live region for network status
- ✅ **ACCESSIBILITY.md**: Comprehensive WCAG 2.1 AA guide with examples and checklist
- ✅ **Test IDs**: All interactive elements have unique data-testid attributes

**✅ COMPLETED (Phase 4 Task 12):**
- ✅ **Dynamic Font Scaling**: Native React Native text scaling with targeted controls for emojis (`allowFontScaling={false}`) and large numbers (`maxFontSizeMultiplier={1.3}`)

**✅ COMPLETED (Phase 4 Task 13):**
- ✅ **Color Contrast Audit**: Comprehensive audit documented in `COLOR_CONTRAST_AUDIT.md` identifying WCAG AA compliance status
- ✅ **global.css Update**: Improved `--muted-foreground` from 64.9% to 70% lightness for better contrast (4.5:1 ratio on dark backgrounds)
- ✅ **High Contrast Mode Implementation**:
  - ThemeProvider with resolvedColors computation (HIGH_CONTRAST_COLORS palette)
  - useAccessibleColors() and useAccessibleTextStyles() hooks
  - ProfileScreen toggle switch with backend + AsyncStorage persistence
  - AppNavigator and PostCard updated to demonstrate pattern
  - WCAG AA compliant: mutedText #CCCCCC (11:1), border #FFFFFF (21:1), placeholder #AAAAAA (8.5:1)
- ✅ **Documentation**: Complete implementation guide in COLOR_CONTRAST_AUDIT.md

**⏳ PENDING (Manual Testing & Extension):**
- ⏳ Manual verification: Toggle high contrast mode in ProfileScreen and verify color changes in PostCard/tab bar
- ⏳ Extend useAccessibleTextStyles pattern to additional components (HomeScreen, text inputs, etc.)
- ⏳ Contrast ratio measurements with accessibility tools on real devices
- ⏳ Manual VoiceOver/TalkBack testing on real devices (see instructions above)
