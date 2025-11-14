# MyKliq Mobile Performance Optimization Guide

## Image Optimization ✅ IMPLEMENTED

### Current Implementation
- **Image Optimization Utility** (`src/utils/imageOptimization.ts`)
  - Image prefetching for critical assets
  - Progressive image loading (thumbnail → full)
  - URL-based server-side image resizing
  - Preset sizes for different use cases
  - Performance logging and monitoring

### Image Best Practices

**1. Lazy Loading**
```typescript
import { getImageForPreset, prefetchImage } from '../utils/imageOptimization';

// Load images only when component mounts
useEffect(() => {
  prefetchImage(profileImageUrl);
}, [profileImageUrl]);
```

**2. Progressive Loading**
```typescript
const { thumbnail, full } = getProgressiveImageUrls(imageUrl);

// First render: Show thumbnail
// After load: Show full image
<Image 
  source={{ uri: thumbnail }}
  onLoad={() => {
    // Swap to full image
  }}
/>
```

**3. Optimized Image Requests**
```typescript
// Request exact size needed, not full resolution
const optimizedUrl = getImageForPreset(url, 'feedImage');
// Returns: url?w=800&h=800&q=85
```

### Recommended Upgrades
**For Production:** Install `expo-image` for advanced caching:
```bash
npx expo install expo-image
```

Benefits:
- Disk and memory caching
- Automatic cache management
- Better performance than standard Image
- Placeholder and blur support

---

## Video Optimization (PENDING)

### Recommendations

**1. Video Compression**
- Use expo-av's Video component with compression
- Target bitrate: 2-5 Mbps for mobile
- Max resolution: 1080p for stories, 720p for feed videos
- Format: H.264/AAC for compatibility

**2. Server-Side Processing**
```typescript
// Upload workflow:
// 1. Compress on device before upload
// 2. Server re-encodes to multiple qualities
// 3. Serve appropriate quality based on connection
```

**3. Streaming**
- Use HLS for longer videos (>2 min)
- Progressive download for short clips
- Preload metadata only, not full video

---

## List Virtualization (PENDING)

### Current Issue
Feed and messages use standard FlatList without optimization for very long lists.

### Recommended Implementation

**1. Windowing with FlashList**
```bash
npm install @shopify/flash-list
```

Benefits:
- 10x better performance than FlatList
- Lower memory usage
- Smooth scrolling even with 1000+ items

**2. Pagination**
```typescript
// Already implemented in feed
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['/api/mobile/feed'],
  queryFn: ({ pageParam }) => apiClient.getFeed(pageParam, 20),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

**3. Item Height Estimation**
```typescript
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={150} // Improves scroll performance
  removeClippedSubviews={true}
/>
```

---

## Memory Management

### Current Status
✅ Theme caching with AsyncStorage
✅ JWT token in secure storage
⚠️ No explicit memory cleanup for media

### Recommendations

**1. Image Memory Limits**
```typescript
// In imageOptimization.ts
const MAX_CACHE_SIZE_MB = 100;
const CACHE_EXPIRATION_DAYS = 7;

// Periodic cleanup
setInterval(clearExpiredCache, 24 * 60 * 60 * 1000); // Daily
```

**2. Component Cleanup**
```typescript
useEffect(() => {
  // Setup
  const subscription = someService.subscribe();
  
  return () => {
    // Cleanup on unmount
    subscription.unsubscribe();
  };
}, []);
```

**3. Avoid Memory Leaks**
- Clear timers and intervals on unmount
- Unsubscribe from event listeners
- Cancel pending API requests
- Remove WebSocket connections

---

## Network Optimization

### Already Implemented ✅
- JWT authentication with 30-day tokens
- Mobile-optimized API endpoints
- Paginated responses (20 items at a time)
- Cursor-based pagination

### Recommendations

**1. Request Batching**
```typescript
// Instead of 3 separate requests on app launch:
// GET /api/mobile/user/profile
// GET /api/mobile/user/theme  
// GET /api/mobile/feed

// Batch into one:
// GET /api/mobile/startup-data
```

**2. Response Compression**
```typescript
// Server-side: Enable gzip compression
app.use(compression());

// Reduces response size by 60-80%
```

**3. Caching Headers**
```typescript
// Cache static content aggressively
res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for images
res.setHeader('Cache-Control', 'private, max-age=300'); // 5 min for feed
```

---

## Battery Optimization

### Current Implementations ✅
- Polling instead of persistent WebSocket connections
- Notification listeners cleanup on unmount
- Device token caching to avoid repeated registration

### Recommendations

**1. Background Fetch Limits**
```typescript
// Reduce background activity
const BACKGROUND_FETCH_INTERVAL = 15 * 60 * 1000; // 15 minutes minimum
```

**2. Location Services**
```typescript
// Use location only when needed
import * as Location from 'expo-location';

// Request permission, use once, then stop
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced, // Not Highest
});
```

**3. Reduce Re-renders**
```typescript
// Use memo and callbacks
const MemoizedComponent = React.memo(Component);
const handlePress = useCallback(() => { }, [deps]);
```

---

## Bundle Size Optimization

### Analysis
```bash
npx expo-export --platform ios --analyze
npx expo-export --platform android --analyze
```

### Recommendations

**1. Code Splitting**
- Lazy load heavy screens
- Dynamic imports for rarely-used features

**2. Remove Unused Dependencies**
```bash
npx depcheck
```

**3. Asset Optimization**
- Compress images before bundling
- Use WebP for better compression
- Remove unused assets

---

## Performance Monitoring

### Metrics to Track

**1. App Launch Time**
- Target: < 2 seconds to interactive
- Measure: Time to first screen render

**2. Navigation Performance**
- Target: < 300ms screen transitions
- Use: React Navigation performance plugin

**3. API Response Times**
- Target: < 500ms for critical endpoints
- Monitor: Average response time

**4. Memory Usage**
- Target: < 200MB average
- Monitor: Xcode Instruments / Android Profiler

**5. Frame Rate**
- Target: 60 FPS consistently
- Avoid: Dropped frames during scroll

### Monitoring Tools

**Development:**
- React DevTools Profiler
- Flipper for network/storage inspection
- Xcode Instruments (iOS)
- Android Studio Profiler

**Production:**
- Firebase Performance Monitoring
- Sentry for crash reporting
- Custom analytics events

---

## Performance Checklist

### Before App Store Submission

- [ ] Image lazy loading implemented
- [ ] Video compression enabled
- [ ] FlashList for long lists
- [ ] Memory leaks identified and fixed
- [ ] API response caching configured
- [ ] Bundle size analyzed and optimized
- [ ] Performance profiling completed
- [ ] 60 FPS maintained during scroll
- [ ] App launch time < 2 seconds
- [ ] Network requests minimized
- [ ] Battery usage tested
- [ ] Memory usage stays under 200MB

---

## Quick Wins (Implement First)

1. **Image Prefetching** - Already available in `imageOptimization.ts`
2. **FlashList Migration** - Replace FlatList in HomeScreen
3. **Response Caching** - Add React Query stale time
4. **Remove Console Logs** - Clean up for production
5. **Enable Hermes** - React Native's optimized JS engine (if not already enabled)

---

## Additional Resources

- [React Native Performance Guide](https://reactnative.dev/docs/performance)
- [Expo Performance Best Practices](https://docs.expo.dev/guides/performance/)
- [FlashList Documentation](https://shopify.github.io/flash-list/)
- [Image Caching with Expo](https://docs.expo.dev/versions/latest/sdk/image/)
