import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import { queryClient } from '../lib/queryClient';
import { pushNotificationService } from '../services/pushNotificationService';
import { errorReporting } from '../utils/errorReporting';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  signup: (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    birthdate: string;
    inviteCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
    
    // Setup notification listeners
    const cleanup = pushNotificationService.setupNotificationListeners();
    return cleanup;
  }, []);

  const checkAuth = async () => {
    try {
      const token = await apiClient.getAuthToken();
      if (token) {
        // Fetch user profile
        const profile = await apiClient.getProfile();
        setUser(profile as User);
        
        // Set user ID for error reporting
        errorReporting.setUserId(profile.id);
        
        // Register device token for push notifications
        await pushNotificationService.registerDeviceToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await apiClient.clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, password: string) => {
    try {
      const response: any = await apiClient.login(phoneNumber, password);
      await apiClient.setAuthToken(response.token);
      const userData = {
        id: response.userId,
        firstName: response.firstName,
        lastName: response.lastName,
        phoneNumber,
        profileImageUrl: response.profileImageUrl,
      };
      setUser(userData);
      
      // Set user ID for error reporting
      errorReporting.setUserId(userData.id);
      
      // Register device token for push notifications
      await pushNotificationService.registerDeviceToken();
      
      // Invalidate all queries on login
      queryClient.invalidateQueries();
    } catch (error) {
      throw error;
    }
  };

  const signup = async (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    birthdate: string;
    inviteCode?: string;
  }) => {
    try {
      const response: any = await apiClient.signup(data);
      // Auto-login after signup
      await login(data.phoneNumber, data.password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Unregister device token before logging out
      await pushNotificationService.unregisterDeviceToken();
      
      await apiClient.logout();
      setUser(null);
      
      // Clear user ID from error reporting
      errorReporting.setUserId(undefined);
      
      // Clear all queries on logout
      queryClient.clear();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
