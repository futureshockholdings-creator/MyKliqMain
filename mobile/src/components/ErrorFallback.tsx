import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  isDevelopment?: boolean;
}

export function ErrorFallback({ error, resetError, isDevelopment = __DEV__ }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Oops! Something went wrong
        </Text>
        
        <Text style={styles.description}>
          We're sorry for the inconvenience. The app encountered an unexpected error.
        </Text>

        {isDevelopment && (
          <ScrollView style={styles.errorDetails}>
            <Text style={styles.errorTitle}>
              Error Details (Development Mode):
            </Text>
            <Text style={styles.errorMessage}>
              {error.message}
            </Text>
            {error.stack && (
              <Text style={styles.errorStack}>
                {error.stack}
              </Text>
            )}
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={resetError}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          accessibilityHint="Attempts to recover from the error and reload the screen"
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          If this problem persists, please contact support.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1f2937',
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorStack: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
