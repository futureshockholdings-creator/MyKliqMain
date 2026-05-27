import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActionSheetIOS, Alert, Platform } from 'react-native';
import { Card } from './ui/Card';
import { useAccessibleTextStyles } from '../hooks/useAccessibleTextStyles';
import { getImageForPreset, prefetchImage } from '../utils/imageOptimization';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  onLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onReport?: (post: any) => void;
  onBlock?: (post: any) => void;
}

export default function PostCard({ post, currentUserId, onLike, onComment, onShare, onReport, onBlock }: PostCardProps) {
  const accessibleStyles = useAccessibleTextStyles();
  
  useEffect(() => {
    if (post.author?.profileImageUrl) {
      prefetchImage(getImageForPreset(post.author.profileImageUrl, 'profilePicture'));
    }
    if (post.mediaUrl && post.mediaType === 'image') {
      prefetchImage(getImageForPreset(post.mediaUrl, 'feedImage'));
    }
  }, [post.author?.profileImageUrl, post.mediaUrl, post.mediaType]);
  
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const authorName = `${post.author?.firstName || 'Unknown'} ${post.author?.lastName || ''}`.trim();
  const timeAgo = formatTimeAgo(post.createdAt);
  const isOwnPost = currentUserId && post.author?.id && String(post.author.id) === String(currentUserId);

  const handleMoreOptions = () => {
    const options: string[] = ['Report this post'];
    if (!isOwnPost) {
      options.push(`Block ${post.author?.firstName || 'user'}`);
    }
    options.push('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: options.length - 2,
        },
        (index) => {
          if (index === 0) {
            onReport?.(post);
          } else if (!isOwnPost && index === 1) {
            onBlock?.(post);
          }
        }
      );
    } else {
      const alertButtons: any[] = [
        {
          text: 'Report this post',
          onPress: () => onReport?.(post),
        },
      ];
      if (!isOwnPost) {
        alertButtons.push({
          text: `Block ${post.author?.firstName || 'user'}`,
          style: 'destructive',
          onPress: () => onBlock?.(post),
        });
      }
      alertButtons.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert('Post Options', undefined, alertButtons);
    }
  };

  return (
    <Card className="mx-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        {post.author?.profileImageUrl ? (
          <Image 
            source={{ uri: getImageForPreset(post.author.profileImageUrl, 'profilePicture') }} 
            className="w-10 h-10 rounded-full mr-3"
            accessible={true}
            accessibilityLabel={`${authorName}'s profile picture`}
          />
        ) : (
          <View 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3"
            accessible={true}
            accessibilityLabel={`${authorName}'s profile avatar`}
          >
            <Text className="text-primary-foreground font-bold text-sm">
              {post.author?.firstName?.[0] || 'U'}
              {post.author?.lastName?.[0] || ''}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-base">
            {authorName}
          </Text>
          <Text className="text-muted-foreground text-xs" style={accessibleStyles.muted}>
            {timeAgo}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleMoreOptions}
          className="p-2 -mr-1"
          accessible={true}
          accessibilityLabel="Post options"
          accessibilityHint="Report this post or block the author"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-muted-foreground text-lg font-bold">⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content && (
        <Text className="text-foreground text-base leading-6 mb-3">
          {post.content}
        </Text>
      )}

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && (
        <Image 
          source={{ uri: getImageForPreset(post.mediaUrl, 'feedImage') }} 
          className="w-full h-52 rounded-lg mb-3"
          resizeMode="cover"
          accessible={true}
          accessibilityLabel={`Photo posted by ${authorName}`}
        />
      )}

      {/* YouTube Embed */}
      {post.youtubeUrl && (
        <View className="bg-muted rounded-lg p-3 mb-3">
          <Text className="text-foreground font-semibold text-sm mb-1">
            🎥 YouTube Video
          </Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1} style={accessibleStyles.muted}>
            {post.youtubeUrl}
          </Text>
        </View>
      )}

      {/* Poll */}
      {post.pollData && (
        <View className="bg-muted rounded-lg p-3 mb-3">
          <Text className="text-foreground font-semibold text-sm mb-2">
            📊 {post.pollData.question}
          </Text>
          {post.pollData.options?.map((option: string, index: number) => (
            <View key={index} className="bg-background rounded p-2 mb-1">
              <Text className="text-foreground text-sm">{option}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="flex-row justify-around pt-2 border-t border-border" style={accessibleStyles.borderTop}>
        <TouchableOpacity 
          className="flex-row items-center p-2"
          onPress={onLike}
          data-testid={`button-like-${post.id}`}
          accessible={true}
          accessibilityLabel={post.isLiked ? 'Unlike this post' : 'Like this post'}
          accessibilityHint={`Currently has ${post.likeCount || 0} ${post.likeCount === 1 ? 'like' : 'likes'}`}
          accessibilityRole="button"
          accessibilityState={{ selected: post.isLiked }}
        >
          <Text className="text-lg mr-2">
            {post.isLiked ? '❤️' : '🤍'}
          </Text>
          <Text 
            className={post.isLiked ? 'text-red-500 font-semibold' : 'text-muted-foreground'}
            style={!post.isLiked ? accessibleStyles.muted : undefined}
          >
            {post.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center p-2"
          onPress={onComment}
          data-testid={`button-comment-${post.id}`}
          accessible={true}
          accessibilityLabel="View comments"
          accessibilityHint={`${post.commentCount || 0} ${post.commentCount === 1 ? 'comment' : 'comments'} on this post`}
          accessibilityRole="button"
        >
          <Text className="text-lg mr-2">💬</Text>
          <Text className="text-muted-foreground" style={accessibleStyles.muted}>
            {post.commentCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center p-2"
          onPress={onShare}
          data-testid={`button-share-${post.id}`}
          accessible={true}
          accessibilityLabel="Share post"
          accessibilityHint="Share this post within your kliq"
          accessibilityRole="button"
        >
          <Text className="text-lg mr-2">📤</Text>
          <Text className="text-muted-foreground" style={accessibleStyles.muted}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}
