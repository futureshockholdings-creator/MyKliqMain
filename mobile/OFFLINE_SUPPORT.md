# MyKliq Offline Support Implementation

## Current Status: Partial Implementation ✅

### What's Implemented

**1. Offline Indicator Component** (`src/components/OfflineIndicator.tsx`)
- Red banner at top of screen when offline
- Animated fade in/out transitions
- Wi-Fi off icon
- Accessible to screen readers (alert role, live region)
- Integrated globally in AppNavigator

**2. Network Status Hook** (`src/hooks/useNetworkStatus.ts`)
- `useNetworkStatus()` - Full network state
- `useIsOffline()` - Boolean offline check
- `useIsOnline()` - Boolean online check
- **⚠️ LIMITATION**: Currently uses `navigator.onLine` fallback
  - ✅ Works in web/development
  - ❌ Does NOT work on native iOS/Android builds

---

## Production Requirements

### 1. Install NetInfo for Native Support

**Current State:** The hook uses `navigator.onLine` which only works on web.

**Fix Required:**
```bash
npx expo install @react-native-community/netinfo
```

**Update Hook:** Replace fallback in `useNetworkStatus.ts` with:
```typescript
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};
```

---

## Offline Data Caching (PENDING)

### Requirements
Implement offline caching for:
1. Feed posts (last 20 items)
2. Messages (last 50 per conversation)
3. User profile data
4. Friends list
5. Stories (viewed in last 24h)

### Recommended Implementation

**1. React Query Persistence**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

// Wrap app with PersistQueryClientProvider
<PersistQueryClientProvider
  client={queryClient}
  persister={asyncStoragePersister}
>
  {children}
</PersistQueryClientProvider>
```

**2. Configure Stale Times**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

**3. Manual Caching for Critical Data**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache user profile
const cacheUserProfile = async (profile: UserProfile) => {
  await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
};

// Retrieve cached profile
const getCachedProfile = async (): Promise<UserProfile | null> => {
  const cached = await AsyncStorage.getItem('user_profile');
  return cached ? JSON.parse(cached) : null;
};
```

---

## Request Queue for Failed API Calls (PENDING)

### Purpose
Queue failed requests (posts, likes, messages) when offline and retry when connection restores.

### Implementation Strategy

**1. Queue Structure**
```typescript
interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: any;
  timestamp: number;
  retryCount: number;
}
```

**2. Queue Manager**
```typescript
class RequestQueue {
  private queue: QueuedRequest[] = [];
  
  async add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>) {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    this.queue.push(queuedRequest);
    await this.save();
  }
  
  async processQueue() {
    const isOnline = await NetInfo.fetch().then(state => state.isConnected);
    if (!isOnline) return;
    
    for (const request of this.queue) {
      try {
        await apiClient.request(request.endpoint, {
          method: request.method,
          body: JSON.stringify(request.body),
        });
        
        this.remove(request.id);
      } catch (error) {
        request.retryCount++;
        
        if (request.retryCount > 3) {
          this.remove(request.id); // Give up after 3 retries
        }
      }
    }
    
    await this.save();
  }
  
  private async save() {
    await AsyncStorage.setItem('request_queue', JSON.stringify(this.queue));
  }
  
  private async load() {
    const saved = await AsyncStorage.getItem('request_queue');
    this.queue = saved ? JSON.parse(saved) : [];
  }
  
  private remove(id: string) {
    this.queue = this.queue.filter(req => req.id !== id);
  }
}
```

**3. Integration with API Client**
```typescript
// In apiClient.ts
export async function apiRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
  try {
    return await request<T>(endpoint, options);
  } catch (error) {
    // If offline and mutating request, queue it
    if (!navigator.onLine && ['POST', 'PUT', 'DELETE'].includes(options.method || 'GET')) {
      await requestQueue.add({
        endpoint,
        method: options.method as 'POST' | 'PUT' | 'DELETE',
        body: options.body ? JSON.parse(options.body as string) : null,
      });
      
      // Return optimistic response
      return {} as T;
    }
    
    throw error;
  }
}
```

**4. Retry on Reconnect**
```typescript
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      requestQueue.processQueue();
    }
  });
  
  return () => unsubscribe();
}, []);
```

---

## Optimistic UI Updates

### Already Implemented ✅
- Theme changes apply immediately
- Posts appear in feed before server confirmation

### Additional Optimizations Needed

**1. Like/Unlike Actions**
```typescript
const { mutate: toggleLike } = useMutation({
  mutationFn: (postId: string) => apiClient.post(`/api/mobile/posts/${postId}/like`),
  onMutate: async (postId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['/api/mobile/feed'] });
    
    // Snapshot previous value
    const previousFeed = queryClient.getQueryData(['/api/mobile/feed']);
    
    // Optimistically update
    queryClient.setQueryData(['/api/mobile/feed'], (old: any) => {
      // Toggle like count and isLiked flag
      return updatePostInFeed(old, postId, {
        isLiked: !post.isLiked,
        likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
      });
    });
    
    return { previousFeed };
  },
  onError: (err, postId, context) => {
    // Rollback on error
    queryClient.setQueryData(['/api/mobile/feed'], context?.previousFeed);
  },
});
```

**2. Message Sending**
```typescript
const { mutate: sendMessage } = useMutation({
  mutationFn: (message: SendMessageRequest) => apiClient.sendMessage(friendId, message.content),
  onMutate: async (message) => {
    // Add message immediately to UI
    queryClient.setQueryData(['/api/mobile/messages', friendId], (old: any) => {
      return {
        ...old,
        messages: [
          ...old.messages,
          {
            id: `temp-${Date.now()}`,
            content: message.content,
            senderId: currentUserId,
            createdAt: new Date().toISOString(),
            status: 'sending',
          },
        ],
      };
    });
  },
  onSuccess: (data, message) => {
    // Replace temp message with server response
    queryClient.setQueryData(['/api/mobile/messages', friendId], (old: any) => {
      return {
        ...old,
        messages: old.messages.map((msg: any) => 
          msg.status === 'sending' ? { ...msg, ...data, status: 'sent' } : msg
        ),
      };
    });
  },
});
```

---

## Offline Experience Checklist

### Completed ✅
- [x] Offline indicator banner (UI only, needs NetInfo)
- [x] Network status hooks
- [x] Accessibility support
- [x] Global integration in app

### Pending ⏳
- [ ] Install @react-native-community/netinfo
- [ ] Update hooks to use NetInfo for native support
- [ ] Implement AsyncStorage caching for feed/messages/profile
- [ ] Add React Query persistence
- [ ] Build request queue for failed API calls
- [ ] Add retry logic on reconnect
- [ ] Implement optimistic UI for likes/comments
- [ ] Add offline mode messaging ("Some features unavailable")
- [ ] Test offline → online transitions
- [ ] Test queue processing on reconnect

---

## Testing Offline Functionality

### Simulate Offline Mode

**iOS Simulator:**
```bash
# Turn off WiFi in System Preferences
# Or use airplane mode in iOS settings
```

**Android Emulator:**
```bash
# Settings → Network & Internet → Turn off Wi-Fi
# Or use airplane mode
```

**Development Testing:**
```javascript
// In Chrome DevTools
// Network tab → Set to "Offline"
```

### Test Scenarios
1. **Go offline while viewing feed** - Should show indicator
2. **Try to post while offline** - Should queue request
3. **Return online** - Should process queue, hide indicator
4. **View cached content offline** - Should load from cache
5. **Try to load new content offline** - Should show appropriate message

---

## Production Readiness

**Before Launch:**
1. ✅ Install NetInfo package
2. ✅ Update hook implementation
3. ✅ Enable React Query persistence
4. ✅ Implement request queue
5. ✅ Add optimistic UI updates
6. ✅ Test all offline scenarios
7. ✅ Document offline limitations
8. ✅ Add user education (onboarding tip)

**Current Status:** 30% Complete
- Offline detection UI: ✅ Done (web only)
- Data caching: ❌ Not started
- Request queue: ❌ Not started  
- Optimistic UI: ⚠️ Partial
- Native support: ❌ Requires NetInfo

---

## Resources

- [NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)
- [React Query Persistence](https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient)
- [AsyncStorage Guide](https://react-native-async-storage.github.io/async-storage/)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
