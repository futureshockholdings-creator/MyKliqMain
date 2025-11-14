import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { StoryGroup, Story } from '../types';

interface StoryViewerScreenProps {
  route: {
    params: {
      storyGroup: StoryGroup;
    };
  };
  navigation: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

const StoryViewerScreen: React.FC<StoryViewerScreenProps> = ({ route, navigation }) => {
  const { storyGroup } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnims = useRef(storyGroup.stories.map(() => new Animated.Value(0))).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = storyGroup.stories[currentIndex];

  useEffect(() => {
    startStoryTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex]);

  const startStoryTimer = () => {
    // Reset current progress
    progressAnims[currentIndex].setValue(0);
    
    // Animate progress bar
    Animated.timing(progressAnims[currentIndex], {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start();

    // Auto-advance to next story
    timerRef.current = setTimeout(() => {
      handleNext();
    }, STORY_DURATION);
  };

  const handleNext = () => {
    if (currentIndex < storyGroup.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const storyDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - storyDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return '24h ago';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Story Image/Video */}
      <View style={styles.storyContainer}>
        {currentStory.imageUrl && (
          <Image 
            source={{ uri: currentStory.imageUrl }} 
            style={styles.storyMedia}
            resizeMode="contain"
          />
        )}
        {currentStory.content && (
          <View style={styles.textStoryContainer}>
            <Text style={styles.textStoryContent}>{currentStory.content}</Text>
          </View>
        )}
      </View>

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {storyGroup.stories.map((_, index) => (
          <View key={index} style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
                index < currentIndex && { width: '100%' },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {storyGroup.profileImageUrl ? (
            <Image 
              source={{ uri: storyGroup.profileImageUrl }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {storyGroup.firstName[0]}{storyGroup.lastName[0]}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>
              {storyGroup.firstName} {storyGroup.lastName}
            </Text>
            <Text style={styles.timeAgo}>
              {getTimeAgo(currentStory.createdAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Touch Areas for Navigation */}
      <View style={styles.touchAreas}>
        <TouchableOpacity 
          style={styles.touchAreaLeft}
          onPress={handlePrevious}
          activeOpacity={1}
        />
        <TouchableOpacity 
          style={styles.touchAreaRight}
          onPress={handleNext}
          activeOpacity={1}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  textStoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1a1a1a',
  },
  textStoryContent: {
    color: '#fff',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 40,
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#00FF00',
  },
  defaultAvatar: {
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeAgo: {
    color: '#ccc',
    fontSize: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
  },
  touchAreas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  touchAreaLeft: {
    flex: 1,
  },
  touchAreaRight: {
    flex: 1,
  },
});

export default StoryViewerScreen;