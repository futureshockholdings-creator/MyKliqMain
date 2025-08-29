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
import { Friend } from '../types';
import ApiService from '../services/api';

const FriendsScreen: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await ApiService.getFriends();
      setFriends(response.friends.sort((a, b) => a.ranking - b.ranking));
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadFriends(true);
  };

  const getRankingEmoji = (ranking: number) => {
    if (ranking <= 3) return '👑';
    if (ranking <= 10) return '🌟';
    if (ranking <= 20) return '💫';
    return '✨';
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity style={styles.friendCard}>
      <View style={styles.rankingContainer}>
        <Text style={styles.rankingEmoji}>{getRankingEmoji(item.ranking)}</Text>
        <Text style={styles.ranking}>#{item.ranking}</Text>
      </View>
      
      {item.profileImageUrl ? (
        <Image 
          source={{ uri: item.profileImageUrl }} 
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.defaultAvatar]}>
          <Text style={styles.avatarText}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>
      )}
      
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.friendPhone}>{item.phone}</Text>
      </View>
      
      <TouchableOpacity style={styles.messageButton}>
        <Text style={styles.messageIcon}>💬</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Your Kliq</Text>
      <Text style={styles.subtitle}>
        {friends.length} friend{friends.length !== 1 ? 's' : ''} ranked by closeness
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.loadingText}>Loading your friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00FF00"
          />
        }
        ListHeaderComponent={renderHeader}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FF00',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  rankingContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  rankingEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  ranking: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  defaultAvatar: {
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendPhone: {
    color: '#888',
    fontSize: 14,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIcon: {
    fontSize: 18,
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
});

export default FriendsScreen;