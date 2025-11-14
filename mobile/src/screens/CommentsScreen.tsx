import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiClient } from '../lib/apiClient';
import { queryClient } from '../lib/queryClient';

interface CommentData {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  replies?: CommentData[];
}

export default function CommentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params as { postId: string };
  
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToAuthor, setReplyToAuthor] = useState<string>('');

  // Fetch comments
  const { data: comments, isLoading, refetch } = useQuery<CommentData[]>({
    queryKey: ['/api/mobile/posts', postId, 'comments'],
    queryFn: () => apiClient.getComments(postId),
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (replyToId) {
        return apiClient.replyToComment(replyToId, content);
      } else {
        return apiClient.commentOnPost(postId, content);
      }
    },
    onSuccess: () => {
      setNewComment('');
      setReplyToId(null);
      setReplyToAuthor('');
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/posts', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/feed'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to add comment');
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiClient.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/posts', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/feed'] });
    },
  });

  // Unlike comment mutation
  const unlikeCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiClient.unlikeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/posts', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/feed'] });
    },
  });

  const handleLikeToggle = (comment: CommentData) => {
    if (comment.isLiked) {
      unlikeCommentMutation.mutate(comment.id);
    } else {
      likeCommentMutation.mutate(comment.id);
    }
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyToId(commentId);
    setReplyToAuthor(authorName);
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderComment = ({ item: comment, isReply = false }: { item: CommentData; isReply?: boolean }) => (
    <View
      className={`${isReply ? 'ml-8 mt-2' : 'mt-4'}`}
      data-testid={`comment-${comment.id}`}
    >
      <View className="flex-row">
        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
          <Text className="text-primary-foreground font-semibold text-xs">
            {comment.author.firstName?.[0] || 'U'}{comment.author.lastName?.[0] || ''}
          </Text>
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-foreground" data-testid={`comment-author-${comment.id}`}>
              {comment.author.firstName || 'Unknown'} {comment.author.lastName || ''}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.createdAt)}
            </Text>
          </View>
          
          <Text className="text-foreground mb-2" data-testid={`comment-content-${comment.id}`}>
            {comment.content}
          </Text>
          
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => handleLikeToggle(comment)}
              data-testid={`button-like-comment-${comment.id}`}
            >
              <Text className="mr-1">{comment.isLiked ? '❤️' : '🤍'}</Text>
              <Text className="text-xs text-muted-foreground">{comment.likeCount}</Text>
            </TouchableOpacity>
            
            {!isReply && (
              <TouchableOpacity
                onPress={() => handleReply(comment.id, comment.author.firstName)}
                data-testid={`button-reply-comment-${comment.id}`}
              >
                <Text className="text-xs text-primary">Reply</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {comment.replies && comment.replies.length > 0 && (
            <View className="mt-2">
              {comment.replies.map(reply => (
                <View key={reply.id}>
                  {renderComment({ item: reply, isReply: true })}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View className="border-b border-border px-4 py-3 bg-card">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            data-testid="button-back"
          >
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Comments</Text>
          <View className="w-16" />
        </View>
      </View>

      {/* Comments List */}
      <FlatList
        data={comments || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderComment({ item })}
        contentContainerClassName="px-4 pb-4"
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted-foreground text-center">
              No comments yet. Be the first to comment!
            </Text>
          </View>
        }
      />

      {/* Reply indicator */}
      {replyToId && (
        <View className="px-4 py-2 bg-muted border-t border-border">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">
              Replying to {replyToAuthor}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setReplyToId(null);
                setReplyToAuthor('');
              }}
              data-testid="button-cancel-reply"
            >
              <Text className="text-primary">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input */}
      <View className="border-t border-border px-4 py-3 bg-card">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground mr-2"
            placeholder="Add a comment..."
            placeholderTextColor="#9CA3AF"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            data-testid="input-comment"
          />
          <TouchableOpacity
            className={`px-4 py-2 rounded-lg ${
              newComment.trim() && !addCommentMutation.isPending
                ? 'bg-primary'
                : 'bg-muted'
            }`}
            onPress={handleSubmit}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            data-testid="button-submit-comment"
          >
            {addCommentMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className={`font-semibold ${newComment.trim() ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
