import './global.css';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
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

const BRAND_GREEN = '#00e676';

function SplashAnimation() {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.splash}>
      <StatusBar style="dark" />
      <Animated.Image
        source={require('./assets/logo-white.png')}
        style={[styles.logo, { transform: [{ rotate }] }]}
        resizeMode="contain"
      />
      <Text style={styles.wordmark}>MyKliq</Text>
    </View>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    console.log('🚀 MyKliq Mobile - Enterprise Edition');

    initializeEnterpriseServices();

    // Keep splash visible for at least 1.4s so the spin is seen,
    // then hand off to the real app tree
    const timer = setTimeout(() => setAppReady(true), 1400);

    return () => {
      clearTimeout(timer);
      cleanupEnterpriseServices();
    };
  }, []);

  if (!appReady) {
    return <SplashAnimation />;
  }

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

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logo: {
    width: 160,
    height: 160,
  },
  wordmark: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
