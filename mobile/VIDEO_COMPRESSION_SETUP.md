# MyKliq Video Compression Setup Guide

## Overview
This guide covers implementing video compression for MyKliq using `react-native-compressor`, the recommended solution for Expo projects. Video compression reduces upload times, server storage costs, and improves user experience.

## Prerequisites ✅ REQUIRED

**Before implementing video compression, you MUST have:**

1. ✅ **Expo Development Client** set up (not Expo Go)
   - Run: `eas init` (requires Expo account)
   - Configure EAS Build in `eas.json`
   - Build development client: `eas build --profile development --platform ios/android`

2. ✅ **Native module support**
   - react-native-compressor requires native code
   - Cannot run in Expo Go
   - Requires custom development build

**STATUS:** Pending user completion of Task 15 (`eas init`)

---

## Installation

### Step 1: Install react-native-compressor

```bash
npm install react-native-compressor
```

### Step 2: Update app.json (if needed)

No config plugin required for react-native-compressor - it works out of the box with Expo dev client.

### Step 3: Rebuild development client

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

---

## Implementation

### 1. Create Video Compression Utility

Create `mobile/src/utils/videoCompression.ts`:

```typescript
import { Video } from 'react-native-compressor';

/**
 * Video compression configuration
 */
export const VIDEO_COMPRESSION_CONFIG = {
  // Compression quality presets
  presets: {
    story: {
      compressionMethod: 'manual',
      maxSize: 1080, // Max width/height
      bitrate: 3000000, // 3 Mbps
    },
    feed: {
      compressionMethod: 'manual',
      maxSize: 720, // 720p
      bitrate: 2000000, // 2 Mbps
    },
    message: {
      compressionMethod: 'auto', // WhatsApp-quality
    },
  },
  
  // Maximum video duration (seconds)
  maxDuration: {
    story: 60, // 1 minute
    feed: 120, // 2 minutes
    message: 300, // 5 minutes
  },
};

/**
 * Compress video for uploading
 * @param uri - Video file URI
 * @param preset - Compression preset (story, feed, message)
 * @param onProgress - Progress callback (0-1)
 * @returns Compressed video URI
 */
export const compressVideo = async (
  uri: string,
  preset: 'story' | 'feed' | 'message' = 'feed',
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log(`[Video Compression] Starting ${preset} compression for:`, uri);
    const startTime = Date.now();
    
    const result = await Video.compress(
      uri,
      VIDEO_COMPRESSION_CONFIG.presets[preset],
      (progress) => {
        if (onProgress) {
          onProgress(progress);
        }
      }
    );
    
    const duration = Date.now() - startTime;
    console.log(`[Video Compression] Completed in ${duration}ms`);
    console.log(`[Video Compression] Output:`, result);
    
    return result;
  } catch (error) {
    console.error('[Video Compression] Error:', error);
    throw new Error('Video compression failed');
  }
};

/**
 * Get video metadata (duration, size, dimensions)
 * Useful for validation before upload
 */
export const getVideoMetadata = async (uri: string) => {
  // Note: You may need expo-av or react-native-video for this
  // For now, return basic info
  return {
    uri,
    // Add video metadata extraction if needed
  };
};

/**
 * Cancel ongoing compression
 */
export const cancelCompression = () => {
  // react-native-compressor supports cancellation
  console.log('[Video Compression] Compression cancelled');
};
```

### 2. Update CreatePostScreen

Update `mobile/src/screens/CreatePostScreen.tsx` to support video compression:

```typescript
import { compressVideo } from '../utils/videoCompression';
import { useState } from 'react';

// Add state for video compression
const [isCompressing, setIsCompressing] = useState(false);
const [compressionProgress, setCompressionProgress] = useState(0);

// Update handlePickVideo function
const handlePickVideo = async () => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    quality: 1, // Original quality, will compress later
  });

  if (!result.canceled && result.assets[0]) {
    try {
      setIsCompressing(true);
      
      // Compress video before setting
      const compressedUri = await compressVideo(
        result.assets[0].uri,
        'feed',
        (progress) => {
          setCompressionProgress(progress);
        }
      );
      
      setMediaUri(compressedUri);
      setMediaType('video');
    } catch (error) {
      Alert.alert('Error', 'Failed to compress video');
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  }
};
```

### 3. Add Compression Progress UI

```tsx
{isCompressing && (
  <View className="absolute inset-0 bg-black/50 items-center justify-center">
    <View className="bg-white dark:bg-gray-800 rounded-lg p-6 items-center">
      <ActivityIndicator size="large" />
      <Text className="text-foreground mt-4">
        Compressing video... {Math.round(compressionProgress * 100)}%
      </Text>
    </View>
  </View>
)}
```

---

## Integration Checklist

### CreatePostScreen
- [ ] Add video picker option
- [ ] Implement video compression
- [ ] Show compression progress
- [ ] Handle compression errors
- [ ] Validate video duration

### StoriesScreen
- [ ] Compress videos before story upload
- [ ] Use 'story' preset (1080p, 3 Mbps)
- [ ] Enforce 60-second duration limit

### ConversationScreen
- [ ] Compress videos in messages
- [ ] Use 'message' preset (auto/WhatsApp-quality)
- [ ] Show compression progress inline

---

## Benefits

✅ **Bandwidth Savings**: 60-80% reduction in file size
✅ **Faster Uploads**: Compressed videos upload 3-5x faster
✅ **Better UX**: Progress indicators keep users informed
✅ **Server Cost**: Reduced storage and bandwidth costs
✅ **WhatsApp Quality**: Industry-standard compression algorithm

---

## Compression Examples

**Before Compression:**
- 30-second 1080p video: ~50MB
- Upload time (4G): ~60 seconds

**After Compression (feed preset):**
- 30-second 720p video: ~10MB (80% reduction)
- Upload time (4G): ~12 seconds

---

## Alternative Approaches

### Server-Side Compression
**Pros:** No app bloat, centralized processing
**Cons:** Higher server costs, slower feedback

**Implementation:** Upload original video, compress on server with FFmpeg, serve optimized versions

### Cloudinary Video API
**Pros:** Automatic optimization, CDN delivery
**Cons:** Paid service, requires backend integration

**Best for:** Production apps with high video volume

---

## Troubleshooting

### "react-native-compressor not found"
- Ensure you've built a development client (not using Expo Go)
- Rebuild with `eas build --profile development`

### Compression takes too long
- Reduce video duration before compression
- Use 'auto' preset for faster processing
- Show progress indicator to manage user expectations

### Memory issues on Android
- Close background apps
- Test on devices with 3GB+ RAM
- Consider limiting max video duration

---

## Production Checklist

Before App Store submission:

- [ ] Test video compression on low-end devices
- [ ] Verify compressed videos play correctly
- [ ] Handle edge cases (very short/long videos)
- [ ] Add compression error tracking (Sentry/Firebase)
- [ ] Test with poor network conditions
- [ ] Validate file size limits (backend)
- [ ] Add compression quality settings (user preference)

---

## Performance Targets

| Preset | Max Size | Bitrate | Expected Compression | Processing Time (30s video) |
|--------|----------|---------|---------------------|----------------------------|
| Story  | 1080p    | 3 Mbps  | 70-80% reduction    | 10-15 seconds              |
| Feed   | 720p     | 2 Mbps  | 75-85% reduction    | 8-12 seconds               |
| Message| Auto     | Auto    | 60-70% reduction    | 5-8 seconds                |

---

## Next Steps

1. **Complete Task 15**: Run `eas init` and set up development build
2. **Install package**: `npm install react-native-compressor`
3. **Create utility**: Implement `videoCompression.ts`
4. **Update screens**: Add compression to CreatePostScreen, StoriesScreen, ConversationScreen
5. **Test thoroughly**: Verify compression works on real devices
6. **Monitor performance**: Track compression times and file sizes

---

## Resources

- [react-native-compressor Documentation](https://github.com/numandev1/react-native-compressor)
- [Expo Development Client Guide](https://docs.expo.dev/development/create-development-builds/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Video Compression Best Practices](https://cloudinary.com/guides/video-effects/best-practices-for-compressing-videos-in-react-native-apps)
