import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useNavigation } from '@react-navigation/native';
import { Bell, ChevronLeft } from 'lucide-react-native';
import type { NotificationPreferencesData } from '../../../../shared/api-contracts';

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data, isLoading } = useQuery<{ preferences: NotificationPreferencesData }>({
    queryKey: ['/api/mobile/notifications/preferences'],
    queryFn: async () => {
      return await apiClient.get('/api/mobile/notifications/preferences');
    },
  });

  const preferences = data?.preferences;

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferencesData>) => {
      return await apiClient.post('/api/mobile/notifications/preferences', updates);
    },
    onMutate: async (updates) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/mobile/notifications/preferences'] });
      const previousData = queryClient.getQueryData<{ preferences: NotificationPreferencesData }>(['/api/mobile/notifications/preferences']);
      
      if (previousData) {
        queryClient.setQueryData(['/api/mobile/notifications/preferences'], {
          preferences: { ...previousData.preferences, ...updates }
        });
      }
      
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Revert on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/mobile/notifications/preferences'], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/notifications/preferences'] });
    },
  });

  const handleToggle = (key: keyof NotificationPreferencesData, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!preferences) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Failed to load preferences</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2"
          data-testid="button-back"
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to profile screen"
          accessibilityRole="button"
        >
          <ChevronLeft size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text className="text-foreground text-lg font-semibold">Notifications</Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        data-testid="notification-preferences-screen"
      >
        {/* Master Switch */}
        <View className="p-4">
          <View className="bg-card rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Bell size={20} color="#8B5CF6" />
              <Text className="text-foreground text-base font-semibold ml-2">Push Notifications</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground text-sm flex-1">
                Enable or disable all push notifications
              </Text>
              <Switch
                value={preferences.pushEnabled}
                onValueChange={(value) => handleToggle('pushEnabled', value)}
                trackColor={{ false: '#374151', true: '#8B5CF6' }}
                thumbColor="#FFFFFF"
                data-testid="toggle-push-enabled"
                accessible={true}
                accessibilityLabel="Push notifications"
                accessibilityHint={`Currently ${preferences.pushEnabled ? 'enabled' : 'disabled'}. Toggle to ${preferences.pushEnabled ? 'disable' : 'enable'} all push notifications`}
                accessibilityRole="switch"
              />
            </View>
          </View>

          {/* Individual Notification Types */}
          <View className="bg-card rounded-lg p-4">
            <Text className="text-foreground text-base font-semibold mb-4">Notification Types</Text>

            {/* New Posts */}
            <NotificationToggle
              label="New Posts"
              description="When someone in your kliq posts"
              value={preferences.newPosts}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('newPosts', value)}
              testID="toggle-new-posts"
            />

            {/* Comments */}
            <NotificationToggle
              label="Comments"
              description="When someone comments on your posts"
              value={preferences.comments}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('comments', value)}
              testID="toggle-comments"
            />

            {/* Likes */}
            <NotificationToggle
              label="Likes"
              description="When someone likes your posts"
              value={preferences.likes}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('likes', value)}
              testID="toggle-likes"
            />

            {/* New Friends */}
            <NotificationToggle
              label="New Friends"
              description="When someone accepts your friend request"
              value={preferences.newFriends}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('newFriends', value)}
              testID="toggle-new-friends"
            />

            {/* Messages */}
            <NotificationToggle
              label="Messages"
              description="When you receive a new direct message"
              value={preferences.messages}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('messages', value)}
              testID="toggle-messages"
            />

            {/* Story Replies */}
            <NotificationToggle
              label="Story Replies"
              description="When someone replies to your story"
              value={preferences.storyReplies}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('storyReplies', value)}
              testID="toggle-story-replies"
            />

            {/* Mentions */}
            <NotificationToggle
              label="Mentions"
              description="When someone mentions you"
              value={preferences.mentions}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('mentions', value)}
              testID="toggle-mentions"
            />

            {/* Events */}
            <NotificationToggle
              label="Events"
              description="Event reminders and updates"
              value={preferences.events}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('events', value)}
              testID="toggle-events"
            />

            {/* Kliq Koin */}
            <NotificationToggle
              label="Kliq Koin"
              description="Streak milestones and border unlocks"
              value={preferences.kliqKoin}
              disabled={!preferences.pushEnabled}
              onToggle={(value) => handleToggle('kliqKoin', value)}
              testID="toggle-kliq-koin"
              isLast
            />
          </View>

          {/* Delivery Preference */}
          <View className="bg-card rounded-lg p-4 mt-4">
            <Text className="text-foreground text-base font-semibold mb-4">Delivery Preference</Text>
            <View className="space-y-2">
              <TouchableOpacity
                className={`p-3 rounded-lg border ${preferences.deliveryPreference === 'immediate' ? 'border-primary bg-primary/10' : 'border-border'}`}
                onPress={() => handleToggle('deliveryPreference', 'immediate' as any)}
                disabled={!preferences.pushEnabled}
                data-testid="delivery-immediate"
                accessible={true}
                accessibilityLabel="Immediate delivery"
                accessibilityHint="Receive notifications as they happen"
                accessibilityRole="button"
                accessibilityState={{ 
                  selected: preferences.deliveryPreference === 'immediate',
                  disabled: !preferences.pushEnabled
                }}
              >
                <Text className={`font-medium ${preferences.deliveryPreference === 'immediate' ? 'text-primary' : 'text-foreground'}`}>
                  Immediate
                </Text>
                <Text className="text-muted-foreground text-sm mt-1">
                  Receive notifications as they happen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-3 rounded-lg border ${preferences.deliveryPreference === 'hourly_digest' ? 'border-primary bg-primary/10' : 'border-border'}`}
                onPress={() => handleToggle('deliveryPreference', 'hourly_digest' as any)}
                disabled={!preferences.pushEnabled}
                data-testid="delivery-hourly"
                accessible={true}
                accessibilityLabel="Hourly digest delivery"
                accessibilityHint="Receive a summary every hour"
                accessibilityRole="button"
                accessibilityState={{ 
                  selected: preferences.deliveryPreference === 'hourly_digest',
                  disabled: !preferences.pushEnabled
                }}
              >
                <Text className={`font-medium ${preferences.deliveryPreference === 'hourly_digest' ? 'text-primary' : 'text-foreground'}`}>
                  Hourly Digest
                </Text>
                <Text className="text-muted-foreground text-sm mt-1">
                  Receive a summary every hour
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-3 rounded-lg border ${preferences.deliveryPreference === 'daily_digest' ? 'border-primary bg-primary/10' : 'border-border'}`}
                onPress={() => handleToggle('deliveryPreference', 'daily_digest' as any)}
                disabled={!preferences.pushEnabled}
                data-testid="delivery-daily"
                accessible={true}
                accessibilityLabel="Daily digest delivery"
                accessibilityHint="Receive a summary once per day"
                accessibilityRole="button"
                accessibilityState={{ 
                  selected: preferences.deliveryPreference === 'daily_digest',
                  disabled: !preferences.pushEnabled
                }}
              >
                <Text className={`font-medium ${preferences.deliveryPreference === 'daily_digest' ? 'text-primary' : 'text-foreground'}`}>
                  Daily Digest
                </Text>
                <Text className="text-muted-foreground text-sm mt-1">
                  Receive a summary once per day
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

interface NotificationToggleProps {
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onToggle: (value: boolean) => void;
  testID: string;
  isLast?: boolean;
}

function NotificationToggle({ 
  label, 
  description, 
  value, 
  disabled, 
  onToggle, 
  testID,
  isLast 
}: NotificationToggleProps) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${!isLast ? 'border-b border-border/50' : ''}`}>
      <View className="flex-1 mr-4">
        <Text className={`text-foreground font-medium ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </Text>
        <Text className={`text-muted-foreground text-sm ${disabled ? 'opacity-50' : ''}`}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#374151', true: '#8B5CF6' }}
        thumbColor="#FFFFFF"
        data-testid={testID}
        accessible={true}
        accessibilityLabel={`${label} notifications`}
        accessibilityHint={`${description}. Currently ${value ? 'enabled' : 'disabled'}`}
        accessibilityRole="switch"
        accessibilityState={{ disabled }}
      />
    </View>
  );
}
