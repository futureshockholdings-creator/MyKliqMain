import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { apiClient } from '../lib/apiClient';
import type { StoryGroupData, StoryData } from '../../shared/api-contracts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 7000; // 7 seconds per story

interface StoryViewerScreenProps {
  route: {
    params: {
      storyGroups: StoryGroupData[];
      initialGroupIndex: number;
      initialStoryIndex: number;
    };
  };
  navigation: any;
}

export default function StoryViewerScreen({ route, navigation }: StoryViewerScreenProps) {
  const { storyGroups, initialGroupIndex, initialStoryIndex } = route.params;
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [paused, setPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const progressAnims = useRef<Map<string, Animated.Value>>(new Map());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const totalStories = currentGroup?.stories.length || 0;

  // Get or create progress animation for a story
  const getProgressAnim = (groupIdx: number, storyIdx: number, stories: StoryData[]) => {
    const key = `${groupIdx}-${storyIdx}`;
    if (!progressAnims.current.has(key)) {
      // Determine initial value: 1 if already viewed, 0 otherwise
      const initialValue = storyIdx < currentStoryIndex && groupIdx === currentGroupIndex ? 1 : 0;
      progressAnims.current.set(key, new Animated.Value(initialValue));
    }
    return progressAnims.current.get(key)!;
  };

  // Track story view
  const viewStoryMutation = useMutation({
    mutationFn: (storyId: number) => 
      apiClient.request(`/api/stories/${storyId}/view`, { method: 'POST' }),
    onError: (error: any) => {
      console.error('Failed to track story view:', error);
    },
  });

  // Track current story view
  useEffect(() => {
    if (currentStory) {
      viewStoryMutation.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  // Auto-advance timer for images
  useEffect(() => {
    if (paused || !currentStory || currentStory.mediaType === 'video') return;

    const progressAnim = getProgressAnim(currentGroupIndex, currentStoryIndex, currentGroup.stories);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      handleNext();
    }, STORY_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      progressAnim.stopAnimation();
    };
  }, [currentStoryIndex, currentGroupIndex, paused]);

  // Reset loading and progress when story changes
  useEffect(() => {
    setIsLoading(true);
    const progressAnim = getProgressAnim(currentGroupIndex, currentStoryIndex, currentGroup.stories);
    progressAnim.setValue(0);
  }, [currentStory?.id]);

  const handleNext = () => {
    // Clear timer before state change
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Compute next indices synchronously
    setCurrentGroupIndex((prevGroupIdx) => {
      setCurrentStoryIndex((prevStoryIdx) => {
        const progressAnim = getProgressAnim(prevGroupIdx, prevStoryIdx, storyGroups[prevGroupIdx].stories);
        progressAnim.setValue(1);
        
        const currentGroupStories = storyGroups[prevGroupIdx].stories;
        
        if (prevStoryIdx < currentGroupStories.length - 1) {
          // Next story in same group
          return prevStoryIdx + 1;
        } else if (prevGroupIdx < storyGroups.length - 1) {
          // First story of next group
          return 0;
        } else {
          // End of all stories
          navigation.goBack();
          return prevStoryIdx;
        }
      });
      
      // Update group index synchronously
      const currentGroupStories = storyGroups[prevGroupIdx].stories;
      if (prevGroupIdx < storyGroups.length - 1 && currentStoryIndex >= currentGroupStories.length - 1) {
        return prevGroupIdx + 1;
      }
      return prevGroupIdx;
    });
  };

  const handlePrevious = () => {
    // Clear timer before state change
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Compute previous indices synchronously
    setCurrentGroupIndex((prevGroupIdx) => {
      setCurrentStoryIndex((prevStoryIdx) => {
        const progressAnim = getProgressAnim(prevGroupIdx, prevStoryIdx, storyGroups[prevGroupIdx].stories);
        progressAnim.setValue(0);
        
        if (prevStoryIdx > 0) {
          // Previous story in same group
          return prevStoryIdx - 1;
        } else if (prevGroupIdx > 0) {
          // Last story of previous group
          return storyGroups[prevGroupIdx - 1].stories.length - 1;
        }
        return prevStoryIdx;
      });
      
      // Update group index synchronously
      if (prevGroupIdx > 0 && currentStoryIndex === 0) {
        return prevGroupIdx - 1;
      }
      return prevGroupIdx;
    });
  };

  const handleVideoProgress = (status: AVPlaybackStatus) => {
    if ('positionMillis' in status && 'durationMillis' in status && status.durationMillis) {
      const progress = status.positionMillis / status.durationMillis;
      const progressAnim = getProgressAnim(currentGroupIndex, currentStoryIndex, currentGroup.stories);
      progressAnim.setValue(progress);
    }
    
    if ('didJustFinish' in status && status.didJustFinish) {
      handleNext();
    }
  };

  const handleTap = (x: number) => {
    if (x < SCREEN_WIDTH / 2) {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  if (!currentStory) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Story not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />

      {/* Progress bars */}
      <View className="absolute top-0 left-0 right-0 flex-row px-2 pt-12 z-10 gap-1">
        {currentGroup.stories.map((story, index) => {
          const progressAnim = getProgressAnim(currentGroupIndex, index, currentGroup.stories);
          return (
            <View key={`${currentGroupIndex}-${index}`} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
              <Animated.View
                className="h-full bg-white"
                style={{
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </View>
          );
        })}
      </View>

      {/* Header */}
      <View className="absolute top-14 left-0 right-0 flex-row items-center px-4 pt-4 z-10">
        <View className="flex-row items-center flex-1">
          {currentGroup.profileImageUrl ? (
            <Image
              source={{ uri: currentGroup.profileImageUrl }}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
              <Text className="text-primary-foreground font-bold">
                {currentGroup.firstName[0]}{currentGroup.lastName[0]}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-white font-semibold text-base" data-testid="story-user-name">
              {currentGroup.firstName} {currentGroup.lastName}
            </Text>
            <Text className="text-white/70 text-xs">
              {new Date(currentStory.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2"
          data-testid="button-close-story"
        >
          <Text className="text-white text-2xl">✕</Text>
        </TouchableOpacity>
      </View>

      {/* Story content */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
        onPressIn={() => setPaused(true)}
        onPressOut={() => setPaused(false)}
        className="flex-1"
        data-testid="story-content-area"
      >
        {currentStory.mediaType === 'video' ? (
          <Video
            source={{ uri: currentStory.mediaUrl }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={!paused}
            isLooping={false}
            onLoad={() => setIsLoading(false)}
            onPlaybackStatusUpdate={handleVideoProgress}
            progressUpdateIntervalMillis={100}
          />
        ) : (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode="contain"
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
          />
        )}

        {isLoading && (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Caption */}
      {currentStory.content && (
        <View className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-black/60">
          <Text className="text-white text-base" data-testid="story-caption">
            {currentStory.content}
          </Text>
        </View>
      )}
    </View>
  );
}