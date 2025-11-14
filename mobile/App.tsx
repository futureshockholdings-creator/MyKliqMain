import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/providers/AuthProvider';
import { ThemeProvider } from './src/providers/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { queryClient } from './src/lib/queryClient';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { initializeEnterpriseServices, cleanupEnterpriseServices } from './src/lib/enterpriseInit';

export default function App() {
  // Initialize enterprise optimizations for 20k+ users
  useEffect(() => {
    console.log('🚀 MyKliq Mobile - Enterprise Edition');
    console.log('Optimized for 20,000+ concurrent users');
    
    initializeEnterpriseServices();
    
    // Cleanup on app exit
    return () => {
      cleanupEnterpriseServices();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemeProvider>
                <StatusBar style="auto" />
                <AppNavigator />
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}