import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Card } from './ui/Card';

interface PostCardProps {
  post: any;
  onLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export default function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
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

  return (
    <Card className="mx-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        {post.author?.profileImageUrl ? (
          <Image 
            source={{ uri: post.author.profileImageUrl }} 
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
          <Text className="text-muted-foreground text-xs">
            {timeAgo}
          </Text>
        </View>
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
          source={{ uri: post.mediaUrl }} 
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
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
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
      <View className="flex-row justify-around pt-2 border-t border-border">
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
          <Text className={post.isLiked ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
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
          <Text className="text-muted-foreground">
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
          <Text className="text-muted-foreground">Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}