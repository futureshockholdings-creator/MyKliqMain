import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import PostCard from '../components/PostCard';
import { Plus } from 'lucide-react-native';
import type { StoriesResponse, StoryGroupData } from '../../../shared/api-contracts';
import { useNavigation } from '@react-navigation/native';

interface FeedResponse {
  posts: any[];
  nextCursor?: string;
  hasMore: boolean;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

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
  });

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

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/mobile/stories'] });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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
  });

  const renderStoryItem = ({ item, index }: { item: StoryGroupData; index: number }) => {
    // Phase 1: Show purple ring for all stories (backend doesn't yet return isViewedByCurrentUser)
    // TODO Phase 2: Update backend to return isViewedByCurrentUser flag for proper unviewed detection
    const hasUnviewed = true;
    
    return (
      <TouchableOpacity
        data-testid={`story-${item.userId}`}
        onPress={() => {
          const storyGroups = storiesData?.storyGroups || [];
          navigation.navigate('StoryViewerModal', {
            storyGroups,
            initialGroupIndex: index,
          });
        }}
        className="items-center mr-4"
      >
        <View className={`rounded-full p-0.5 ${hasUnviewed ? 'bg-purple-500' : 'bg-muted'}`}>
          <View className="rounded-full p-0.5 bg-background">
            {item.profileImageUrl ? (
              <Image
                source={{ uri: item.profileImageUrl }}
                className="w-16 h-16 rounded-full"
                data-testid={`story-avatar-${item.userId}`}
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
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={() => likeMutation.mutate(item.id)}
            onComment={() => navigation.navigate('CommentsScreen', { postId: item.id })}
          />
        )}
        keyExtractor={(item) => item.id}
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