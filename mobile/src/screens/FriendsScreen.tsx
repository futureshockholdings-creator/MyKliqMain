import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../lib/apiClient';
import { queryClient } from '../lib/queryClient';

interface FriendData {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  ranking: number;
  tier?: 'inner' | 'core' | 'outer';
}

export default function FriendsScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | 'inner' | 'core' | 'outer'>('all');

  // Fetch friends
  const { data: friends = [], isLoading, refetch } = useQuery<FriendData[]>({
    queryKey: ['/api/mobile/friends', selectedTier],
    queryFn: async () => {
      const params = selectedTier !== 'all' ? `?tier=${selectedTier}` : '';
      const response = await apiClient.request(`/api/mobile/friends${params}`);
      return response.friends || [];
    },
  });

  // Filter by search query
  const filteredFriends = friends.filter(friend => {
    const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const getRankingEmoji = (ranking: number) => {
    if (ranking <= 3) return '👑';
    if (ranking <= 10) return '🌟';
    if (ranking <= 20) return '💫';
    return '✨';
  };

  const getTierColor = (tier?: 'inner' | 'core' | 'outer') => {
    switch (tier) {
      case 'inner': return 'text-red-500';
      case 'core': return 'text-yellow-500';
      case 'outer': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTierLabel = (tier?: 'inner' | 'core' | 'outer') => {
    switch (tier) {
      case 'inner': return 'Inner Circle';
      case 'core': return 'Core';
      case 'outer': return 'Outer';
      default: return '';
    }
  };

  const renderFriend = ({ item }: { item: FriendData }) => (
    <TouchableOpacity
      className="mx-4 mb-3 bg-card rounded-xl p-4 border border-border flex-row items-center"
      onPress={() => navigation.navigate('ConversationScreen', { friendId: item.id, friendName: `${item.firstName} ${item.lastName}` })}
      data-testid={`friend-card-${item.id}`}
    >
      {/* Ranking */}
      <View className="items-center mr-4 min-w-[40px]">
        <Text className="text-xl mb-0.5">{getRankingEmoji(item.ranking)}</Text>
        <Text className="text-primary text-xs font-bold" data-testid={`friend-ranking-${item.id}`}>
          #{item.ranking}
        </Text>
      </View>

      {/* Avatar */}
      {item.profileImageUrl ? (
        <View className="w-12 h-12 rounded-full bg-muted items-center justify-center mr-4">
          <Text className="text-foreground text-xs">📷</Text>
        </View>
      ) : (
        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-4">
          <Text className="text-primary-foreground font-bold text-sm">
            {item.firstName?.[0] || 'U'}{item.lastName?.[0] || ''}
          </Text>
        </View>
      )}

      {/* Friend Info */}
      <View className="flex-1">
        <Text className="text-foreground font-semibold text-base mb-1" data-testid={`friend-name-${item.id}`}>
          {item.firstName || 'Unknown'} {item.lastName || ''}
        </Text>
        {item.tier && (
          <Text className={`text-xs font-semibold ${getTierColor(item.tier)}`} data-testid={`friend-tier-${item.id}`}>
            {getTierLabel(item.tier)}
          </Text>
        )}
        {item.phoneNumber && (
          <Text className="text-muted-foreground text-xs mt-0.5">
            {item.phoneNumber}
          </Text>
        )}
      </View>

      {/* Message Button */}
      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-muted items-center justify-center"
        onPress={() => navigation.navigate('ConversationScreen', { friendId: item.id, friendName: `${item.firstName} ${item.lastName}` })}
        data-testid={`button-message-${item.id}`}
      >
        <Text className="text-lg">💬</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      {/* Title */}
      <View className="mb-4">
        <Text className="text-3xl font-bold text-primary mb-1">Your Kliq</Text>
        <Text className="text-muted-foreground">
          {filteredFriends.length} friend{filteredFriends.length !== 1 ? 's' : ''} ranked by closeness
        </Text>
      </View>

      {/* Search */}
      <TextInput
        className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-4"
        placeholder="Search friends..."
        placeholderTextColor="#9CA3AF"
        value={searchQuery}
        onChangeText={setSearchQuery}
        data-testid="input-search-friends"
      />

      {/* Tier Filters */}
      <View className="flex-row mb-4 gap-2">
        {(['all', 'inner', 'core', 'outer'] as const).map((tier) => (
          <TouchableOpacity
            key={tier}
            className={`flex-1 py-2 px-3 rounded-lg border ${
              selectedTier === tier
                ? 'bg-primary border-primary'
                : 'bg-card border-border'
            }`}
            onPress={() => setSelectedTier(tier)}
            data-testid={`button-tier-${tier}`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                selectedTier === tier ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              {tier === 'all' ? 'All' : getTierLabel(tier)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-12">
      <Text className="text-4xl mb-4">👥</Text>
      <Text className="text-xl font-semibold text-foreground mb-2">
        No friends yet
      </Text>
      <Text className="text-muted-foreground text-center px-8">
        {searchQuery
          ? `No friends match "${searchQuery}"`
          : selectedTier !== 'all'
          ? `No friends in ${getTierLabel(selectedTier)}`
          : 'Start building your kliq by adding friends!'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-muted-foreground mt-3">Loading your kliq...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#8B5CF6" />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredFriends.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      />
    </View>
  );
}
