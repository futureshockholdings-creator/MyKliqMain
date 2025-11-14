import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { apiClient } from '../lib/apiClient';
import { useNavigation } from '@react-navigation/native';
import { Settings, Edit3, HelpCircle, LogOut, Award, Users, TrendingUp, Bell } from 'lucide-react-native';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  bio?: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  interests?: string[];
  hobbies?: string[];
  kliqName?: string;
}

interface KliqKoinData {
  balance: number;
  totalEarned: number;
  transactions: any[];
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  tier: number;
  tierName: string;
  nextTierAt: number;
}

interface FriendData {
  id: string;
  friendId: string;
  rank: number;
  status: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ['/api/mobile/user/profile'],
    queryFn: async () => {
      const response = await apiClient.get('/api/mobile/user/profile');
      return response;
    },
  });

  // Fetch Kliq Koin data
  const { data: koinData } = useQuery<KliqKoinData>({
    queryKey: ['/api/kliq-koins/wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/api/kliq-koins/wallet');
      return response;
    },
  });

  // Fetch streak data
  const { data: streakData } = useQuery<StreakData>({
    queryKey: ['/api/kliq-koins/streak'],
    queryFn: async () => {
      const response = await apiClient.get('/api/kliq-koins/streak');
      return response;
    },
  });

  // Fetch user stats (posts and friends counts)
  const { data: statsData, isLoading: statsLoading, isError: statsError } = useQuery<{ postsCount: number; friendsCount: number }>({
    queryKey: ['/api/mobile/user/stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/mobile/user/stats');
      return response;
    },
  });

  const friendsCount = statsData?.friendsCount ?? 0;
  const postsCount = statsData?.postsCount ?? 0;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => {
            logout();
          }
        },
      ]
    );
  };

  if (profileLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Loading...</Text>
      </View>
    );
  }

  const profile = profileData || user;

  return (
    <ScrollView 
      className="flex-1 bg-background" 
      showsVerticalScrollIndicator={false}
      data-testid="profile-screen"
    >
      {/* Header */}
      <View className="items-center p-8 pt-6">
        <View className="mb-4">
          {profile?.profileImageUrl ? (
            <Image 
              source={{ uri: profile.profileImageUrl }} 
              className="w-24 h-24 rounded-full"
              data-testid="profile-avatar"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
              <Text className="text-4xl text-primary-foreground font-bold">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </Text>
            </View>
          )}
        </View>
        
        <Text className="text-2xl font-bold text-foreground mb-2" data-testid="profile-name">
          {profile?.firstName} {profile?.lastName}
        </Text>
        
        {profile?.bio && (
          <Text className="text-base text-muted-foreground text-center mb-3" data-testid="profile-bio">
            {profile.bio}
          </Text>
        )}
        
        {profile?.kliqName && (
          <View className="bg-primary px-4 py-2 rounded-full">
            <Text className="text-primary-foreground text-sm font-semibold" data-testid="profile-kliq-name">
              {profile.kliqName}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Section */}
      <View className="mx-5 mb-6">
        <Text className="text-xl font-bold text-primary mb-4">Stats</Text>
        
        {statsLoading ? (
          <View className="bg-card rounded-xl p-8 border border-border items-center">
            <Text className="text-muted-foreground">Loading stats...</Text>
          </View>
        ) : statsError ? (
          <View className="bg-card rounded-xl p-8 border border-destructive items-center">
            <Text className="text-destructive text-sm">Failed to load stats</Text>
          </View>
        ) : (
          <View className="bg-card rounded-xl p-4 border border-border">
            <View className="flex-row justify-around mb-4">
              <View className="items-center" data-testid="stat-posts">
                <Text className="text-2xl font-bold text-foreground">
                  {postsCount}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">Posts</Text>
              </View>
              
              <View className="w-px bg-border" />
              
              <View className="items-center" data-testid="stat-friends">
                <Text className="text-2xl font-bold text-foreground">
                  {friendsCount}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">Friends</Text>
              </View>
              
              <View className="w-px bg-border" />
              
              <View className="items-center" data-testid="stat-koins">
                <Text className="text-2xl font-bold text-foreground">
                  {koinData?.balance?.toFixed(2) || '0.00'}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">Koins</Text>
              </View>
            </View>
            
            <View className="h-px bg-border my-2" />
            
            <View className="flex-row justify-around">
              <View className="items-center" data-testid="stat-streak">
                <Text className="text-xl font-bold text-foreground">
                  {streakData?.currentStreak || 0} 🔥
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">Day Streak</Text>
              </View>
              
              <View className="w-px bg-border" />
              
              <View className="items-center" data-testid="stat-tier">
                <Text className="text-xl font-bold text-foreground">
                  Tier {streakData?.tier || 1}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">{streakData?.tierName || 'Starter'}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Profile Details */}
      {(profile?.email || profile?.phoneNumber || profile?.interests || profile?.hobbies) && (
        <View className="mx-5 mb-6">
          <Text className="text-xl font-bold text-primary mb-4">Profile Details</Text>
          
          {profile?.phoneNumber && (
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-1">Phone Number</Text>
              <Text className="text-base text-foreground" data-testid="profile-phone">
                {profile.phoneNumber}
              </Text>
            </View>
          )}
          
          {profile?.email && (
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-1">Email</Text>
              <Text className="text-base text-foreground" data-testid="profile-email">
                {profile.email}
              </Text>
            </View>
          )}
          
          {profile?.interests && profile.interests.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-2">Interests</Text>
              <View className="flex-row flex-wrap">
                {profile.interests.map((interest, index) => (
                  <View 
                    key={index} 
                    className="bg-muted px-3 py-1.5 rounded-full mr-2 mb-2"
                    data-testid={`interest-tag-${index}`}
                  >
                    <Text className="text-foreground text-xs">{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {profile?.hobbies && profile.hobbies.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-2">Hobbies</Text>
              <View className="flex-row flex-wrap">
                {profile.hobbies.map((hobby, index) => (
                  <View 
                    key={index} 
                    className="bg-muted px-3 py-1.5 rounded-full mr-2 mb-2"
                    data-testid={`hobby-tag-${index}`}
                  >
                    <Text className="text-foreground text-xs">{hobby}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Theme Customization */}
      <View className="mx-5 mb-6">
        <Text className="text-xl font-bold text-primary mb-4">Theme</Text>
        
        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-sm text-muted-foreground mb-3">Choose your theme</Text>
          
          <View className="flex-row flex-wrap">
            {[
              { name: 'Purple', primary: '#8B5CF6', secondary: '#06B6D4' },
              { name: 'Ocean', primary: '#0EA5E9', secondary: '#10B981' },
              { name: 'Forest', primary: '#10B981', secondary: '#F59E0B' },
              { name: 'Sunset', primary: '#F59E0B', secondary: '#EF4444' },
              { name: 'Rose', primary: '#EC4899', secondary: '#8B5CF6' },
              { name: 'Emerald', primary: '#059669', secondary: '#0EA5E9' },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.name}
                data-testid={`theme-${preset.name.toLowerCase()}`}
                onPress={async () => {
                  try {
                    await setTheme({
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary,
                    });
                    Alert.alert('Theme Updated', `${preset.name} theme applied successfully!`);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update theme. Please try again.');
                  }
                }}
                className="items-center mr-3 mb-3"
              >
                <View 
                  className="w-16 h-16 rounded-xl mb-1.5 border-2"
                  style={{ 
                    backgroundColor: preset.primary,
                    borderColor: theme.primaryColor === preset.primary ? '#FFFFFF' : 'transparent'
                  }}
                >
                  <View 
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-xl rounded-br-lg"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </View>
                <Text className={`text-xs ${theme.primaryColor === preset.primary ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text className="text-xs text-muted-foreground mt-2">
            ✨ Theme syncs across devices and persists offline
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="mx-5 mb-6">
        <TouchableOpacity 
          className="flex-row justify-between items-center bg-primary rounded-xl p-4 mb-3 border-2 border-primary"
          onPress={() => navigation.navigate('KliqKoinScreen')}
          data-testid="button-kliq-koin"
          accessible={true}
          accessibilityLabel="Kliq Koin and Streaks"
          accessibilityHint="View your kliq koin balance and daily streaks"
          accessibilityRole="button"
        >
          <View className="flex-row items-center">
            <Award color="#000" size={20} />
            <Text className="text-primary-foreground text-base font-medium ml-3">
              Kliq Koin & Streaks
            </Text>
          </View>
          <Text className="text-primary-foreground text-lg">🪙</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row justify-between items-center bg-card rounded-xl p-4 mb-3 border border-border"
          onPress={() => {
            Alert.alert(
              'Edit Profile',
              'Edit profile functionality coming soon! This will allow you to update your bio, interests, hobbies, and more.',
              [{ text: 'OK' }]
            );
          }}
          data-testid="button-edit-profile"
        >
          <View className="flex-row items-center">
            <Edit3 color="#666" size={20} />
            <Text className="text-foreground text-base ml-3">Edit Profile</Text>
          </View>
          <Text className="text-muted-foreground text-lg">✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row justify-between items-center bg-card rounded-xl p-4 mb-3 border border-border"
          onPress={() => navigation.navigate('NotificationPreferencesScreen')}
          data-testid="button-notifications"
          accessible={true}
          accessibilityLabel="Notification Preferences"
          accessibilityHint="Manage your notification settings"
          accessibilityRole="button"
        >
          <View className="flex-row items-center">
            <Bell color="#666" size={20} />
            <Text className="text-foreground text-base ml-3">Notifications</Text>
          </View>
          <Text className="text-muted-foreground text-lg">🔔</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row justify-between items-center bg-card rounded-xl p-4 mb-3 border border-border"
          onPress={() => {
            Alert.alert(
              'Settings',
              'Settings screen coming soon! This will include privacy settings, account management, and more.',
              [{ text: 'OK' }]
            );
          }}
          data-testid="button-settings"
        >
          <View className="flex-row items-center">
            <Settings color="#666" size={20} />
            <Text className="text-foreground text-base ml-3">Settings</Text>
          </View>
          <Text className="text-muted-foreground text-lg">⚙️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row justify-between items-center bg-card rounded-xl p-4 mb-3 border border-border"
          onPress={() => {
            Alert.alert(
              'Help & Support',
              'Help center coming soon! For immediate assistance, please contact support@mykliq.com',
              [{ text: 'OK' }]
            );
          }}
          data-testid="button-help"
        >
          <View className="flex-row items-center">
            <HelpCircle color="#666" size={20} />
            <Text className="text-foreground text-base ml-3">Help & Support</Text>
          </View>
          <Text className="text-muted-foreground text-lg">❓</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row justify-between items-center bg-card rounded-xl p-4 mb-3 border border-destructive"
          onPress={handleLogout}
          data-testid="button-logout"
          accessible={true}
          accessibilityLabel="Logout"
          accessibilityHint="Log out of your MyKliq account"
          accessibilityRole="button"
        >
          <View className="flex-row items-center">
            <LogOut color="#ff4757" size={20} />
            <Text className="text-destructive text-base ml-3">Logout</Text>
          </View>
          <Text className="text-destructive text-lg">🚪</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View className="items-center p-5 pb-10">
        <Text className="text-muted-foreground text-xs mb-1">MyKliq Mobile v1.0</Text>
        <Text className="text-muted-foreground text-xs">Your Private Social Circle</Text>
      </View>
    </ScrollView>
  );
}
