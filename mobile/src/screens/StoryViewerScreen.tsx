import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
const LONG_PRESS_THRESHOLD = 275; // 275ms for optimal UX (architect recommendation)

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
  const elapsedTimeRef = useRef(0); // Track elapsed time for precise pause/resume
  const startTimeRef = useRef(0); // Track when timer started
  const pressStartTimeRef = useRef(0); // Track press start for long-press detection
  const pressLocationRef = useRef({ x: 0, y: 0 }); // Track tap location

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const totalStories = currentGroup?.stories.length || 0;

  // Pure helper functions for deterministic navigation (architect recommendation)
  const getNextIndices = useCallback((groupIdx: number, storyIdx: number): { groupIdx: number; storyIdx: number; shouldClose: boolean } => {
    const currentGroupStories = storyGroups[groupIdx].stories;
    
    if (storyIdx < currentGroupStories.length - 1) {
      // Next story in same group
      return { groupIdx, storyIdx: storyIdx + 1, shouldClose: false };
    } else if (groupIdx < storyGroups.length - 1) {
      // First story of next group
      return { groupIdx: groupIdx + 1, storyIdx: 0, shouldClose: false };
    } else {
      // End of all stories
      return { groupIdx, storyIdx, shouldClose: true };
    }
  }, [storyGroups]);

  const getPreviousIndices = useCallback((groupIdx: number, storyIdx: number): { groupIdx: number; storyIdx: number } => {
    if (storyIdx > 0) {
      // Previous story in same group
      return { groupIdx, storyIdx: storyIdx - 1 };
    } else if (groupIdx > 0) {
      // Last story of previous group
      return { groupIdx: groupIdx - 1, storyIdx: storyGroups[groupIdx - 1].stories.length - 1 };
    }
    // Already at first story
    return { groupIdx, storyIdx };
  }, [storyGroups]);

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

  // Auto-advance timer for images with precise pause/resume (architect recommendation)
  useEffect(() => {
    if (!currentStory || currentStory.mediaType === 'video') return;

    const progressAnim = getProgressAnim(currentGroupIndex, currentStoryIndex, currentGroup.stories);
    
    if (paused) {
      // On pause: stop animation and timer, track elapsed time
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      progressAnim.stopAnimation();
      elapsedTimeRef.current += Date.now() - startTimeRef.current;
      return;
    }

    // On start/resume: calculate remaining time and start timer
    const remainingTime = Math.max(0, STORY_DURATION - elapsedTimeRef.current); // Clamp to min 0
    startTimeRef.current = Date.now();
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingTime,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      handleNext();
    }, remainingTime);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      progressAnim.stopAnimation();
    };
  }, [currentStoryIndex, currentGroupIndex, paused]);

  // Reset loading, progress, and elapsed time when story changes
  useEffect(() => {
    setIsLoading(true);
    elapsedTimeRef.current = 0; // Reset elapsed time for new story
    startTimeRef.current = Date.now();
    const progressAnim = getProgressAnim(currentGroupIndex, currentStoryIndex, currentGroup.stories);
    progressAnim.setValue(0);
  }, [currentStory?.id]);

  const handleNext = useCallback(() => {
    // Clear timer before state change
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Use helper function for deterministic navigation (architect recommendation)
    const result = getNextIndices(currentGroupIndex, currentStoryIndex);
    
    if (result.shouldClose) {
      navigation.goBack();
      return;
    }

    // Mark current story as completed
    const progressAnim = getProgressAnim(currentGroupIndex, currentStoryIndex, currentGroup.stories);
    progressAnim.setValue(1);

    // Atomic state update for race-free navigation
    setCurrentGroupIndex(result.groupIdx);
    setCurrentStoryIndex(result.storyIdx);
    elapsedTimeRef.current = 0; // Reset elapsed time for next story
  }, [currentGroupIndex, currentStoryIndex, getNextIndices, currentGroup]);

  const handlePrevious = useCallback(() => {
    // Clear timer before state change
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Use helper function for deterministic navigation (architect recommendation)
    const result = getPreviousIndices(currentGroupIndex, currentStoryIndex);

    // Reset current story progress
    const progressAnim = getProgressAnim(currentGroupIndex, currentStoryIndex, currentGroup.stories);
    progressAnim.setValue(0);

    // Atomic state update for race-free navigation
    setCurrentGroupIndex(result.groupIdx);
    setCurrentStoryIndex(result.storyIdx);
    elapsedTimeRef.current = 0; // Reset elapsed time for previous story
  }, [currentGroupIndex, currentStoryIndex, getPreviousIndices, currentGroup]);

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

  // Gesture handlers with tap/long-press separation (architect recommendation)
  const handlePressIn = useCallback((e: any) => {
    pressStartTimeRef.current = Date.now();
    pressLocationRef.current = { x: e.nativeEvent.locationX, y: 0 };
    setPaused(true); // Pause immediately on press
  }, []);

  const handlePressOut = useCallback(() => {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    
    if (pressDuration < LONG_PRESS_THRESHOLD) {
      // Quick tap = navigate (left/right)
      if (pressLocationRef.current.x < SCREEN_WIDTH / 2) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    // Long press = just unpause (no navigation)
    setPaused(false);
  }, [handleNext, handlePrevious]);

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
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View className="flex-1" data-testid="story-content-area">
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
        </View>
      </TouchableWithoutFeedback>

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