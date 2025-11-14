import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from './AuthProvider';
import { queryClient } from '../lib/queryClient';

interface UserTheme {
  id?: string;
  userId?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontColor: string;
  navBgColor: string;
  navActiveColor: string;
  borderStyle: string;
  enableSparkles: boolean;
}

const DEFAULT_THEME: UserTheme = {
  primaryColor: '#8B5CF6',
  secondaryColor: '#06B6D4',
  fontFamily: 'system',
  fontColor: '#FFFFFF',
  navBgColor: '#1F2937',
  navActiveColor: '#8B5CF6',
  borderStyle: 'rounded',
  enableSparkles: true,
};

interface ThemeContextValue {
  theme: UserTheme;
  status: 'loading' | 'loaded' | 'error';
  setTheme: (theme: Partial<UserTheme>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<UserTheme>(DEFAULT_THEME);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // AsyncStorage key namespaced by userId
  const getStorageKey = (userId?: string) => {
    return userId ? `userTheme:${userId}` : 'userTheme:guest';
  };

  // Load theme from AsyncStorage (fast path)
  const loadCachedTheme = async (userId?: string) => {
    try {
      const key = getStorageKey(userId);
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const parsedTheme = JSON.parse(cached);
        setThemeState(parsedTheme);
        return parsedTheme;
      }
    } catch (error) {
      console.error('Failed to load cached theme:', error);
    }
    return null;
  };

  // Save theme to AsyncStorage
  const saveCachedTheme = async (themeData: UserTheme, userId?: string) => {
    try {
      const key = getStorageKey(userId);
      await AsyncStorage.setItem(key, JSON.stringify(themeData));
    } catch (error) {
      console.error('Failed to save theme to cache:', error);
    }
  };

  // Clear cached theme on logout
  const clearCachedTheme = async (userId?: string) => {
    try {
      const key = getStorageKey(userId);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear cached theme:', error);
    }
  };

  // Fetch theme from backend (with stale-while-revalidate)
  const { data: backendTheme, isError } = useQuery<UserTheme>({
    queryKey: ['/api/mobile/user/theme', user?.id],
    queryFn: async () => {
      const response = await apiClient.getUserTheme();
      return response;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Partial<UserTheme>) => {
      const response = await apiClient.updateUserTheme(newTheme);
      return response.theme;
    },
    onMutate: async (newTheme) => {
      // Optimistic update
      const merged = { ...theme, ...newTheme };
      setThemeState(merged);
      await saveCachedTheme(merged, user?.id);
    },
    onSuccess: (updatedTheme) => {
      setThemeState(updatedTheme);
      saveCachedTheme(updatedTheme, user?.id);
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/user/theme', user?.id] });
    },
    onError: (error, variables, context) => {
      console.error('Failed to update theme:', error);
      // Revert optimistic update by refetching
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/user/theme', user?.id] });
    },
  });

  // Initialize theme on mount
  useEffect(() => {
    const initTheme = async () => {
      setStatus('loading');
      
      if (!user?.id) {
        // Not logged in - use default theme
        setThemeState(DEFAULT_THEME);
        setStatus('loaded');
        return;
      }

      // Load from AsyncStorage first (fast)
      const cached = await loadCachedTheme(user.id);
      if (cached) {
        setStatus('loaded');
      }

      // Backend data will update via React Query
    };

    initTheme();
  }, [user?.id]);

  // Sync backend theme to state and cache
  useEffect(() => {
    if (backendTheme && user?.id) {
      setThemeState(backendTheme);
      saveCachedTheme(backendTheme, user.id);
      setStatus('loaded');
    }
  }, [backendTheme, user?.id]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      setStatus('error');
      // Keep cached/default theme on error
    }
  }, [isError]);

  // Clear cache on logout
  useEffect(() => {
    if (!user?.id) {
      clearCachedTheme();
      setThemeState(DEFAULT_THEME);
    }
  }, [user?.id]);

  const setTheme = async (newTheme: Partial<UserTheme>) => {
    // Guard against unauthenticated calls
    if (!user?.id) {
      console.warn('Cannot update theme: User not authenticated');
      return;
    }
    
    await updateThemeMutation.mutateAsync(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, status, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
