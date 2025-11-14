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

### 2. Dynamic Font Scaling (PENDING)

Support system text size preferences:
- Use `allowFontScaling={true}` on all Text components
- Test with system text size set to large/extra large
- Avoid hardcoded font sizes

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

## Current Status

**Implemented:**
- ✅ Offline indicator with accessibility support (alert role, live region)
- ✅ Test IDs on all interactive elements

**In Progress:**
- ⏳ Adding accessibility labels to all screens (10 screens identified)
- ⏳ Screen reader testing

**Pending:**
- ⏳ Dynamic font scaling implementation
- ⏳ Color contrast audit
- ⏳ High contrast mode support
- ⏳ Comprehensive screen reader testing
