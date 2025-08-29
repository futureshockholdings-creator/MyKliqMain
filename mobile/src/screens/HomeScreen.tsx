import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Post } from '../types';
import ApiService from '../services/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await ApiService.getFeed(pageNum);
      
      if (refresh || pageNum === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      
      setHasMore(response.hasMore);
      setPage(response.page);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadFeed(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadFeed(page + 1);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
            }
          : post
      ));

      await ApiService.likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount + 1 : post.likeCount - 1
            }
          : post
      ));
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard post={item} onLike={() => handleLikePost(item.id)} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.greeting}>
        Welcome back, {user?.firstName}! 👋
      </Text>
      <Text style={styles.kliqName}>
        {user?.kliqName || 'Your Kliq'} Feed
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return <Text style={styles.endText}>You're all caught up!</Text>;
    if (loading && posts.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator color="#00FF00" />
        </View>
      );
    }
    return null;
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.loadingText}>Loading your feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00FF00"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  kliqName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF00',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  endText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
});

export default HomeScreen;