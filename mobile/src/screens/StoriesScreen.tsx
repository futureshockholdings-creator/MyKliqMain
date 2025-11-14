import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StoryGroup } from '../types';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface StoriesScreenProps {
  navigation: any;
}

const StoriesScreen: React.FC<StoriesScreenProps> = ({ navigation }) => {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getStories();
      setStoryGroups(response.storyGroups || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setLoading(true);
        // Upload story directly
        const formData = new FormData();
        formData.append('media', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'story.jpg',
        } as any);

        await ApiService.createStory(formData);
        await loadStories(); // Refresh stories
        Alert.alert('Success', 'Story created!');
      } catch (error) {
        console.error('Error creating story:', error);
        Alert.alert('Error', 'Failed to create story');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewStory = (storyGroup: StoryGroup) => {
    navigation.navigate('StoryViewerModal', { storyGroup });
  };

  const renderStoryGroup = ({ item }: { item: StoryGroup }) => {
    const hasUnviewed = true; // TODO: Track viewed stories
    
    return (
      <TouchableOpacity 
        style={styles.storyItem}
        onPress={() => handleViewStory(item)}
      >
        <View style={[
          styles.storyRing,
          hasUnviewed && styles.storyRingUnviewed
        ]}>
          {item.profileImageUrl ? (
            <Image 
              source={{ uri: item.profileImageUrl }} 
              style={styles.storyAvatar}
            />
          ) : (
            <View style={[styles.storyAvatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {item.firstName[0]}{item.lastName[0]}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.storyName} numberOfLines={1}>
          {item.userId === user?.id ? 'Your Story' : item.firstName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCreateStory = () => (
    <TouchableOpacity style={styles.storyItem} onPress={handleCreateStory}>
      <View style={styles.createStoryRing}>
        {user?.profileImageUrl ? (
          <Image source={{ uri: user.profileImageUrl }} style={styles.storyAvatar} />
        ) : (
          <View style={[styles.storyAvatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {user?.firstName[0]}{user?.lastName[0]}
            </Text>
          </View>
        )}
        <View style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </View>
      </View>
      <Text style={styles.storyName}>Create Story</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.loadingText}>Loading stories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {storyGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={styles.emptyTitle}>No Stories Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to share a story with your kliq!
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateStory}
          >
            <Text style={styles.createButtonText}>Create Story</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={storyGroups}
          renderItem={renderStoryGroup}
          keyExtractor={(item) => item.userId}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList}
          ListHeaderComponent={renderCreateStory}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#00FF00',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  storiesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  storyRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    marginBottom: 8,
  },
  storyRingUnviewed: {
    borderWidth: 3,
    borderColor: '#00FF00',
  },
  createStoryRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    marginBottom: 8,
    position: 'relative',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  defaultAvatar: {
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  addButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
  storyName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default StoriesScreen;