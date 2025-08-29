import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onLike: () => void;
}

const { width } = Dimensions.get('window');

const PostCard: React.FC<PostCardProps> = ({ post, onLike }) => {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {post.author.profileImageUrl ? (
            <Image 
              source={{ uri: post.author.profileImageUrl }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {post.author.firstName[0]}{post.author.lastName[0]}
              </Text>
            </View>
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>
              {post.author.firstName} {post.author.lastName}
            </Text>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(post.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {post.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && (
        <Image 
          source={{ uri: post.mediaUrl }} 
          style={styles.media}
          resizeMode="cover"
        />
      )}

      {/* YouTube Embed Placeholder */}
      {post.youtubeUrl && (
        <View style={styles.youtubeContainer}>
          <Text style={styles.youtubeText}>🎥 YouTube Video</Text>
          <Text style={styles.youtubeUrl} numberOfLines={1}>
            {post.youtubeUrl}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onLike}
        >
          <Text style={[styles.actionIcon, post.isLiked && styles.liked]}>
            {post.isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            {post.likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeAgo: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  youtubeContainer: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  youtubeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  youtubeUrl: {
    color: '#888',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  actionText: {
    color: '#888',
    fontSize: 14,
  },
  liked: {
    color: '#ff4757',
  },
  likedText: {
    color: '#ff4757',
    fontWeight: '600',
  },
});

export default PostCard;