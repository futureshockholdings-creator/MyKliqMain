import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, RefreshControl, ActivityIndicator, ScrollView, TouchableOpacity, Image, Alert, Modal, Pressable } from 'react-native';
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

const REPORT_REASONS = [
  { key: 'spam', label: 'Spam' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'other', label: 'Other' },
];

interface ReportModalState {
  visible: boolean;
  post: any | null;
  reason: string;
  alsoBlock: boolean;
  submitting: boolean;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const { isConnected } = useNetworkStatus();
  const [cachedPosts, setCachedPosts] = useState<any[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [reportModal, setReportModal] = useState<ReportModalState>({
    visible: false,
    post: null,
    reason: '',
    alsoBlock: false,
    submitting: false,
  });

  const cleanup = useMemoryCleanup();

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

  useEffect(() => {
    if (data?.pages[0]?.posts) {
      cacheFeedPosts(data.pages[0].posts);
    }
  }, [data]);

  const likeMutation = useMutation({
    mutationFn: (postId: string) => apiClient.likePost(postId),
    onMutate: async (postId) => {
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
      if (context?.previousData) {
        queryClient.setQueryData(['/api/mobile/feed'], context.previousData);
      }
    },
  });

  const removePostsFromFeed = useCallback((authorId: string) => {
    queryClient.setQueryData(['/api/mobile/feed'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: FeedResponse) => ({
          ...page,
          posts: page.posts.filter(
            (post: any) => String(post.author?.id) !== String(authorId)
          ),
        })),
      };
    });
    setBlockedUserIds(prev => new Set([...prev, String(authorId)]));
  }, [queryClient]);

  const openReportModal = useCallback((post: any) => {
    if (!isConnected) {
      Alert.alert('No Internet', 'You need an internet connection to report posts.');
      return;
    }
    setReportModal({
      visible: true,
      post,
      reason: '',
      alsoBlock: false,
      submitting: false,
    });
  }, [isConnected]);

  const openBlockConfirm = useCallback((post: any) => {
    if (!isConnected) {
      Alert.alert('No Internet', 'You need an internet connection to block users.');
      return;
    }
    const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || ''}`.trim();
    Alert.alert(
      `Block ${authorName}?`,
      `Their posts will no longer appear in your feed. You can unblock them later in Settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.blockUser(String(post.author.id));
              removePostsFromFeed(String(post.author.id));
              Alert.alert('Blocked', `${authorName} has been blocked.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not block this user. Please try again.');
            }
          },
        },
      ]
    );
  }, [isConnected, removePostsFromFeed]);

  const submitReport = async () => {
    if (!reportModal.reason) {
      Alert.alert('Select a reason', 'Please select a reason for your report.');
      return;
    }
    setReportModal(prev => ({ ...prev, submitting: true }));
    try {
      await apiClient.reportPost({
        postId: String(reportModal.post.id),
        reason: reportModal.reason,
      });
      if (reportModal.alsoBlock && reportModal.post?.author?.id) {
        await apiClient.blockUser(String(reportModal.post.author.id));
        removePostsFromFeed(String(reportModal.post.author.id));
      } else {
        queryClient.setQueryData(['/api/mobile/feed'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: FeedResponse) => ({
              ...page,
              posts: page.posts.filter((p: any) => String(p.id) !== String(reportModal.post.id)),
            })),
          };
        });
      }
      setReportModal({ visible: false, post: null, reason: '', alsoBlock: false, submitting: false });
      Alert.alert('Reported', 'Thank you for your report. Our team will review it shortly.');
    } catch (err: any) {
      setReportModal(prev => ({ ...prev, submitting: false }));
      Alert.alert('Error', err.message || 'Could not submit your report. Please try again.');
    }
  };

  const rawPosts = data?.pages.flatMap((page) => page.posts) || (!isConnected && cachedPosts.length > 0 ? cachedPosts : []);
  const posts = rawPosts.filter((post: any) => !blockedUserIds.has(String(post.author?.id)));

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/mobile/stories'] });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const [cachedStoriesData, setCachedStoriesData] = useState<StoriesResponse | null>(null);
  
  useEffect(() => {
    getCachedStories().then(cached => {
      if (cached) {
        setCachedStoriesData(cached as StoriesResponse);
      }
    });
  }, []);

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

  useEffect(() => {
    if (storiesData) {
      cacheStories([storiesData]);
    }
  }, [storiesData]);

  const displayStoriesData = storiesData || (!isConnected ? cachedStoriesData : null);

  const renderStoryItem = ({ item, index }: { item: StoryGroupData; index: number }) => {
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
            currentUserId={user?.id ? String(user.id) : undefined}
            onLike={() => likeMutation.mutate(item.id)}
            onComment={() => navigation.navigate('CommentsScreen', { postId: item.id })}
            onReport={openReportModal}
            onBlock={openBlockConfirm}
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

      {/* Report Modal */}
      <Modal
        visible={reportModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => !reportModal.submitting && setReportModal(prev => ({ ...prev, visible: false }))}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => !reportModal.submitting && setReportModal(prev => ({ ...prev, visible: false }))}
        >
          <Pressable onPress={() => {}} className="bg-background rounded-t-3xl p-6">
            <Text className="text-foreground text-xl font-bold mb-1">Report Post</Text>
            <Text className="text-muted-foreground text-sm mb-5">
              Why are you reporting this post?
            </Text>

            {REPORT_REASONS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                className={`flex-row items-center py-3 px-4 mb-2 rounded-xl border ${
                  reportModal.reason === key
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted/30'
                }`}
                onPress={() => setReportModal(prev => ({ ...prev, reason: key }))}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ checked: reportModal.reason === key }}
                accessibilityLabel={label}
              >
                <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  reportModal.reason === key ? 'border-primary' : 'border-muted-foreground'
                }`}>
                  {reportModal.reason === key && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </View>
                <Text className="text-foreground text-base">{label}</Text>
              </TouchableOpacity>
            ))}

            {reportModal.post?.author?.id && String(reportModal.post.author.id) !== String(user?.id) && (
              <TouchableOpacity
                className="flex-row items-center py-3 px-4 mt-1 mb-4 rounded-xl border border-border bg-muted/30"
                onPress={() => setReportModal(prev => ({ ...prev, alsoBlock: !prev.alsoBlock }))}
                accessible={true}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: reportModal.alsoBlock }}
                accessibilityLabel={`Also block ${reportModal.post?.author?.firstName || 'this user'}`}
              >
                <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                  reportModal.alsoBlock ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {reportModal.alsoBlock && (
                    <Text className="text-white text-xs font-bold">✓</Text>
                  )}
                </View>
                <Text className="text-foreground text-base">
                  Also block {reportModal.post?.author?.firstName || 'this user'}
                </Text>
              </TouchableOpacity>
            )}

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl border border-border items-center"
                onPress={() => setReportModal(prev => ({ ...prev, visible: false }))}
                disabled={reportModal.submitting}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text className="text-foreground font-semibold text-base">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center ${
                  reportModal.submitting || !reportModal.reason ? 'bg-primary/50' : 'bg-primary'
                }`}
                onPress={submitReport}
                disabled={reportModal.submitting || !reportModal.reason}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Submit report"
                accessibilityState={{ disabled: reportModal.submitting || !reportModal.reason }}
              >
                {reportModal.submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-primary-foreground font-semibold text-base">Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
