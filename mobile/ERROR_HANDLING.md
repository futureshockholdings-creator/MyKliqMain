# Error Handling & Crash Reporting

This document describes the error handling and crash reporting architecture for the MyKliq mobile app.

## Overview

The app implements a comprehensive error handling system with:
- Global error boundary for React component errors
- Centralized error reporting service
- Graceful error UI with retry functionality
- Development mode error details
- Production-ready crash logging

## Architecture

### 1. Error Boundary (`src/components/ErrorBoundary.tsx`)

The `ErrorBoundary` component wraps the entire app and catches unhandled React errors.

**Features:**
- Catches all unhandled React component errors
- Displays graceful error UI (`ErrorFallback`)
- Logs errors to error reporting service
- Provides reset functionality to recover from errors
- Supports custom fallback UI via props

**Usage:**
```tsx
// Already integrated in App.tsx
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>

// Custom fallback
<ErrorBoundary fallback={(error, reset) => <CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

### 2. Error Fallback UI (`src/components/ErrorFallback.tsx`)

User-friendly error screen with:
- Clear error message for users
- "Try Again" button to recover
- Development mode: Shows full error stack trace
- Production mode: Shows generic error message
- Theme-aware styling
- Accessibility support (screen reader labels)

### 3. Error Reporting Service (`src/utils/errorReporting.ts`)

Centralized service for logging and reporting errors.

**Features:**
- Structured error reports with metadata
- Platform detection (iOS/Android/Web)
- User ID tracking
- App version tracking
- Development vs Production logging

**API:**
```typescript
import { errorReporting } from '@/utils/errorReporting';

// Log fatal errors
errorReporting.logError(error, componentStack, true);

// Log warnings
errorReporting.logWarning('Something unexpected happened', { context });

// Log info
errorReporting.logInfo('User action completed', { userId: '123' });

// Set user context
errorReporting.setUserId('user-123');
```

### 4. React Query Error Handling

Network errors from API calls are handled by React Query:
- Automatic retry logic (3 retries with exponential backoff)
- Error states in `useQuery` hooks
- Per-screen error UI with "Try Again" buttons

**Example:**
```tsx
const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['/api/mobile/feed'],
  queryFn: () => apiClient.getFeed(),
});

if (isError) {
  return <ErrorMessage error={error} onRetry={refetch} />;
}
```

## Error Types

### 1. React Component Errors
**Caught by:** ErrorBoundary  
**Examples:** 
- Render errors
- Lifecycle method errors
- Constructor errors

**Handling:** Shows ErrorFallback UI with retry option

### 2. Network Errors
**Caught by:** React Query  
**Examples:**
- API request failures
- Network timeouts
- 401/403/404/500 errors

**Handling:** Per-screen error states with retry buttons

### 3. Async Errors
**Caught by:** Try-catch blocks  
**Examples:**
- AsyncStorage failures
- SecureStore failures
- Permission errors

**Handling:** Logged via errorReporting service

## Development vs Production

### Development Mode (`__DEV__ = true`)
- Full error stack traces in ErrorFallback
- Detailed console logs
- Component stack traces
- Verbose error messages

### Production Mode (`__DEV__ = false`)
- Generic user-friendly error messages
- Structured error reports
- Error metadata (userId, platform, version)
- No sensitive stack traces in UI

## Integration with Crash Reporting Services

The error reporting service is designed to integrate with third-party crash reporting tools:

### Sentry Integration (Optional)
```typescript
import * as Sentry from '@sentry/react-native';

// In errorReporting.ts logError method:
if (!__DEV__) {
  Sentry.captureException(error, {
    contexts: {
      component: { stack: componentStack },
    },
    tags: {
      platform: this.platform,
      version: this.appVersion,
    },
    user: {
      id: this.userId,
    },
  });
}
```

### Firebase Crashlytics Integration (Optional)
```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// In errorReporting.ts logError method:
if (!__DEV__) {
  crashlytics().recordError(error);
  if (this.userId) {
    crashlytics().setUserId(this.userId);
  }
}
```

## Error Recovery Strategies

### 1. Automatic Recovery
- Network errors: Retry with exponential backoff
- Auth errors (401): Clear token, redirect to login
- Rate limiting (429): Wait and retry

### 2. Manual Recovery
- ErrorBoundary: "Try Again" button resets error state
- Per-screen errors: "Retry" button refetches data
- Login errors: Clear form, allow re-entry

### 3. Graceful Degradation
- Show cached data when network unavailable
- Display offline indicators
- Allow core features to work without network

## Best Practices

### 1. Always Wrap Critical Operations
```typescript
try {
  await riskyOperation();
} catch (error) {
  errorReporting.logError(error as Error);
  // Show user-friendly message
  Alert.alert('Error', 'Something went wrong. Please try again.');
}
```

### 2. Provide Context in Error Reports
```typescript
errorReporting.logError(error, componentStack);
errorReporting.setUserId(user.id);
```

### 3. Test Error Boundaries
```typescript
// Create a test component that throws
const ErrorTest = () => {
  throw new Error('Test error');
};

// Render it to test ErrorBoundary
<ErrorTest />
```

### 4. Handle Network Errors Gracefully
```typescript
const { isError, error, refetch } = useQuery({
  queryKey: ['data'],
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

## Accessibility

All error UI components include:
- `accessibilityRole` for screen readers
- `accessibilityLabel` with descriptive text
- `accessibilityHint` for action buttons
- High contrast error messages
- Keyboard navigation support

## Monitoring & Analytics

The error reporting service provides:
- Error frequency tracking
- User impact analysis (% of users affected)
- Platform distribution (iOS vs Android)
- Error trends over time
- Component stack traces

## Future Enhancements

1. **Sentry Integration**: Add Sentry SDK for production crash reporting
2. **Firebase Crashlytics**: Alternative crash reporting service
3. **Error Grouping**: Automatically group similar errors
4. **User Feedback**: Allow users to submit feedback on errors
5. **Offline Queue**: Queue error reports when offline
6. **Performance Monitoring**: Track slow renders and performance issues

## Testing

### Manual Testing
1. Trigger component error: Create a component that throws
2. Trigger network error: Disconnect network and make API call
3. Trigger auth error: Use invalid token
4. Verify ErrorFallback UI appears
5. Verify "Try Again" button recovers from error

### Automated Testing
```typescript
// Example test
it('should show error boundary on component error', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText('Oops! Something went wrong')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
});
```

## Support Contact

If users encounter persistent errors:
- Email: support@mykliq.com
- In-app support: Settings → Help & Support
- Error reports automatically include user ID for tracking
