import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface Conversation {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface MessagesScreenProps {
  navigation: any;
}

export default function MessagesScreen({ navigation }: MessagesScreenProps) {
  const { data: conversations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/mobile/messages/conversations'],
    queryFn: () => apiClient.getConversations(),
    refetchInterval: 5000,
  });

  const handleOpenConversation = (conversation: Conversation) => {
    navigation.navigate('ConversationScreen', {
      friendId: conversation.friendId,
      friendName: conversation.friendName,
    });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const unreadText = item.unreadCount > 0 
      ? `, ${item.unreadCount} unread ${item.unreadCount === 1 ? 'message' : 'messages'}` 
      : '';
    const lastMessagePreview = item.lastMessage.substring(0, 50);
    
    return (
    <TouchableOpacity
      onPress={() => handleOpenConversation(item)}
      data-testid={`conversation-${item.friendId}`}
      accessible={true}
      accessibilityLabel={`Conversation with ${item.friendName}`}
      accessibilityHint={`Last message: ${lastMessagePreview}, ${formatTime(item.lastMessageTime)}${unreadText}`}
      accessibilityRole="button"
    >
      <Card className="flex-row items-center p-4 mb-2">
        <View className="relative mr-3">
          {item.friendAvatar ? (
            <Image 
              source={{ uri: item.friendAvatar }} 
              className="w-14 h-14 rounded-full"
              accessible={true}
              accessibilityLabel={`${item.friendName}'s profile picture`}
            />
          ) : (
            <View 
              className="w-14 h-14 rounded-full bg-primary items-center justify-center"
              accessible={true}
              accessibilityLabel={`${item.friendName}'s profile avatar`}
            >
              <Text className="text-primary-foreground text-lg font-bold">
                {item.friendName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
          {item.unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-primary rounded-full min-w-[24px] h-6 items-center justify-center border-2 border-background px-1.5">
              <Text className="text-primary-foreground text-xs font-bold">
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-foreground text-base font-semibold">
              {item.friendName}
            </Text>
            <Text className="text-muted-foreground text-xs">
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>
          <Text
            className={`text-sm ${item.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#00FF00" />
        <Text className="text-muted-foreground mt-3 text-base">
          Loading messages...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="text-destructive text-xl font-bold mb-2" data-testid="error-conversations">
          Failed to load conversations
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          {error instanceof Error ? error.message : 'Something went wrong'}
        </Text>
        <Button onPress={() => refetch()} data-testid="button-retry-conversations">
          <Text className="text-white font-semibold">Try Again</Text>
        </Button>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-10 bg-background">
        <Text className="text-6xl mb-5">💬</Text>
        <Text className="text-foreground text-2xl font-bold mb-3">
          No Messages Yet
        </Text>
        <Text className="text-muted-foreground text-base text-center mb-8">
          Start a conversation with your kliq members!
        </Text>
        <Button
          title="Go to Friends"
          onPress={() => navigation.navigate('Friends')}
          data-testid="button-go-to-friends"
          accessibilityLabel="Go to Friends list"
          accessibilityHint="Navigate to your friends list to start a conversation"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor="#00FF00"
          />
        }
      />
    </View>
  );
}