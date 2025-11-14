import React, { useState, useEffect } from 'react';
import { View, Text, RefreshControl, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import PostCard from '../components/PostCard';
import { Plus } from 'lucide-react-native';
import type { StoriesResponse, StoryGroupData } from '../../../shared/api-contracts';
import { useNavigation } from '@react-navigation/native';
import { cacheFeedPosts, getCachedFeedPosts, cacheStories, getCachedStories } from '../utils/offlineCache';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useMemoryCleanup } from '../lib/memoryManager';

interface FeedResponse {
  posts: any[];
  nextCursor?: string;
  hasMore: boolean;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const { isConnected } = useNetworkStatus();
  const [cachedPosts, setCachedPosts] = useState<any[]>([]);
  
  // Enterprise optimization: automatic cleanup on unmount
  const cleanup = useMemoryCleanup();

  // Load cached feed posts on mount
  useEffect(() => {
    getCachedFeedPosts().then(cached => {
      if (cached) {
        setCachedPosts(cached);
      }
    });
  }, []);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['/api/mobile/feed'],
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.getFeed(pageParam, 20);
      return response as FeedResponse;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: isConnected,
  });

  // Cache feed posts when data loads
  useEffect(() => {
    if (data?.pages[0]?.posts) {
      cacheFeedPosts(data.pages[0].posts);
    }
  }, [data]);

  const likeMutation = useMutation({
    mutationFn: (postId: string) => apiClient.likePost(postId),
    onMutate: async (postId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/mobile/feed'] });
      const previousData = queryClient.getQueryData(['/api/mobile/feed']);
      
      queryClient.setQueryData(['/api/mobile/feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: FeedResponse) => ({
            ...page,
            posts: page.posts.map((post: any) =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: !post.isLiked,
                    likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
                  }
                : post
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, postId, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/mobile/feed'], context.previousData);
      }
    },
  });

  // Use cached posts if offline and no fresh data
  const posts = data?.pages.flatMap((page) => page.posts) || (!isConnected && cachedPosts.length > 0 ? cachedPosts : []);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/mobile/stories'] });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Load cached stories
  const [cachedStoriesData, setCachedStoriesData] = useState<StoriesResponse | null>(null);
  
  useEffect(() => {
    getCachedStories().then(cached => {
      if (cached) {
        setCachedStoriesData(cached as StoriesResponse);
      }
    });
  }, []);

  // Fetch stories
  const {
    data: storiesData,
    isLoading: storiesLoading,
  } = useQuery({
    queryKey: ['/api/mobile/stories'],
    queryFn: async () => {
      const response = await apiClient.getStories();
      return response as StoriesResponse;
    },
    enabled: isConnected,
  });

  // Cache stories when data loads
  useEffect(() => {
    if (storiesData) {
      cacheStories([storiesData]);
    }
  }, [storiesData]);

  // Use cached stories if offline
  const displayStoriesData = storiesData || (!isConnected ? cachedStoriesData : null);

  const renderStoryItem = ({ item, index }: { item: StoryGroupData; index: number }) => {
    // Phase 2: Use actual view status from backend
    // Purple ring = hasUnviewedStories (any story not viewed)
    // Gray ring = all stories viewed
    const hasUnviewed = item.hasUnviewedStories;
    const viewStatus = hasUnviewed ? 'has new stories' : 'all stories viewed';
    
    return (
      <TouchableOpacity
        data-testid={`story-${item.userId}`}
        accessible={true}
        accessibilityLabel={`View story by ${item.firstName}`}
        accessibilityHint={`${item.storyCount} ${item.storyCount === 1 ? 'story' : 'stories'}, ${viewStatus}`}
        accessibilityRole="button"
        onPress={() => {
          const storyGroups = displayStoriesData?.storyGroups || [];
          navigation.navigate('StoryViewerModal', {
            storyGroups,
            initialGroupIndex: index,
          });
        }}
        className="items-center mr-4"
      >
        <View className={`rounded-full p-0.5 ${hasUnviewed ? 'bg-primary' : 'bg-gray-400'}`}>
          <View className="rounded-full p-0.5 bg-background">
            {item.profileImageUrl ? (
              <Image
                source={{ uri: item.profileImageUrl }}
                className="w-16 h-16 rounded-full"
                data-testid={`story-avatar-${item.userId}`}
                accessibilityLabel={`${item.firstName}'s profile picture`}
                accessible={true}
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-muted items-center justify-center">
                <Text className="text-2xl text-foreground">{item.firstName[0]}</Text>
              </View>
            )}
          </View>
        </View>
        <Text className="text-xs text-foreground mt-1 max-w-[64px]" numberOfLines={1}>
          {item.firstName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAddStory = () => (
    <TouchableOpacity
      data-testid="add-story-button"
      accessible={true}
      accessibilityLabel="Create a new story"
      accessibilityHint="Opens camera to create a 24-hour disappearing story"
      accessibilityRole="button"
      onPress={() => {
        navigation.navigate('CreatePostModal', { isStory: true });
      }}
      className="items-center mr-4"
    >
      <View className="rounded-full p-0.5 bg-muted">
        <View className="rounded-full p-0.5 bg-background">
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
            <Plus color="#fff" size={28} />
          </View>
        </View>
      </View>
      <Text className="text-xs text-foreground mt-1">Your Story</Text>
    </TouchableOpacity>
  );

  const renderStoriesSection = () => {
    if (storiesLoading) {
      return (
        <View className="h-24 items-center justify-center">
          <ActivityIndicator size="small" color="#666" />
        </View>
      );
    }

    const storyGroups = storiesData?.storyGroups || [];

    if (storyGroups.length === 0) {
      return (
        <View className="px-5 py-3">
          {renderAddStory()}
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 py-3"
        data-testid="stories-list"
      >
        {renderAddStory()}
        {storyGroups.map((group, index) => (
          <View key={group.userId}>
            {renderStoryItem({ item: group, index })}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderHeader = () => (
    <View>
      <View className="p-5 pt-3 pb-0">
        <Text className="text-lg text-foreground mb-1">
          Welcome back, {user?.firstName}! 👋
        </Text>
        <Text className="text-2xl font-bold text-primary">
          Your Feed
        </Text>
      </View>
      {renderStoriesSection()}
      <View className="h-px bg-border my-2" />
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View className="p-5 items-center">
          <ActivityIndicator size="small" color="#666" />
        </View>
      );
    }
    if (!hasNextPage && posts.length > 0) {
      return (
        <Text className="text-muted-foreground text-center p-5 text-sm">
          You're all caught up! 🎉
        </Text>
      );
    }
    return null;
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-6xl mb-4">📱</Text>
      <Text className="text-xl font-semibold text-foreground mb-2">
        No posts yet
      </Text>
      <Text className="text-muted-foreground text-center">
        Be the first to share something with your kliq!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#666" />
        <Text className="text-muted-foreground mt-3 text-base">
          Loading your feed...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-8">
        <Text className="text-4xl mb-4">😕</Text>
        <Text className="text-xl font-semibold text-foreground mb-2">
          Something went wrong
        </Text>
        <Text className="text-muted-foreground text-center">
          Unable to load your feed. Pull down to try again.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlashList
        data={posts}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={() => likeMutation.mutate(item.id)}
            onComment={() => navigation.navigate('CommentsScreen', { postId: item.id })}
          />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={400}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor="#666" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      />
    </View>
  );
}