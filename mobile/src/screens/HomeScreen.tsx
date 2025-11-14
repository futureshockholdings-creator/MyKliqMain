import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import PostCard from '../components/PostCard';

interface FeedResponse {
  posts: any[];
  nextCursor?: string;
  hasMore: boolean;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderHeader = () => (
    <View className="p-5 pt-3">
      <Text className="text-lg text-foreground mb-1">
        Welcome back, {user?.firstName}! 👋
      </Text>
      <Text className="text-2xl font-bold text-primary">
        Your Feed
      </Text>
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
          <PostCard post={item} onLike={() => likeMutation.mutate(item.id)} />
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