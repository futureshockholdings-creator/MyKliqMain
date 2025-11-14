import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface CreatePostScreenProps {
  navigation: any;
}

export default function CreatePostScreen({ navigation }: CreatePostScreenProps) {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: (postData: any) => apiClient.createPost(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/feed'] });
      Alert.alert('Success', 'Post created successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create post');
    },
  });

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required');
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library permission is required');
      return false;
    }
    return true;
  };

  const requestLocationPermission = async () => {
    const { status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required');
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleAddLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Location Permission Required',
        'To tag your location, please enable location access in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode[0]) {
        const { city, region, country } = reverseGeocode[0];
        setLocationName(`${city || ''}, ${region || ''}, ${country || ''}`.replace(/^,\s*/, '').replace(/,\s*,/g, ','));
      }
    } catch (error) {
      Alert.alert(
        'Location Error',
        'Failed to get your current location. Please try again or post without a location.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaUri) {
      Alert.alert('Error', 'Please add some content or a photo');
      return;
    }

    const postData: any = {
      content: content.trim(),
    };

    if (mediaUri) {
      postData.mediaUrl = mediaUri;
    }

    if (location) {
      postData.latitude = location.latitude;
      postData.longitude = location.longitude;
      postData.locationName = locationName;
    }

    createPostMutation.mutate(postData);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Card className="mb-4">
            <TextInput
              className="text-foreground text-base p-4 min-h-[120px]"
              placeholder="What's on your mind?"
              placeholderTextColor="#666"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              data-testid="input-post-content"
            />

            {mediaUri && (
              <View className="relative">
                <Image 
                  source={{ uri: mediaUri }} 
                  className="w-full h-64 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-black/70 rounded-full p-2"
                  onPress={() => setMediaUri(null)}
                >
                  <Text className="text-white text-lg">✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {location && (
              <View className="bg-muted rounded-lg p-3 mt-3 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-sm">
                    📍 {locationName || 'Current Location'}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setLocation(null)}>
                  <Text className="text-muted-foreground text-lg">✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          <View className="mb-4">
            <Text className="text-muted-foreground text-sm mb-3 font-medium">
              Add to your post
            </Text>
            
            <View className="flex-row flex-wrap gap-3">
              <TouchableOpacity
                className={`bg-card border border-border rounded-lg p-4 flex-1 min-w-[45%] items-center ${createPostMutation.isPending ? 'opacity-50' : ''}`}
                onPress={handleTakePhoto}
                disabled={createPostMutation.isPending}
                data-testid="button-take-photo"
              >
                <Text className="text-3xl mb-2">📷</Text>
                <Text className="text-foreground text-sm font-medium">Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`bg-card border border-border rounded-lg p-4 flex-1 min-w-[45%] items-center ${createPostMutation.isPending ? 'opacity-50' : ''}`}
                onPress={handlePickImage}
                disabled={createPostMutation.isPending}
                data-testid="button-pick-image"
              >
                <Text className="text-3xl mb-2">🖼️</Text>
                <Text className="text-foreground text-sm font-medium">Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`bg-card border border-border rounded-lg p-4 flex-1 min-w-[45%] items-center ${createPostMutation.isPending ? 'opacity-50' : ''}`}
                onPress={handleAddLocation}
                disabled={createPostMutation.isPending}
                data-testid="button-add-location"
              >
                <Text className="text-3xl mb-2">📍</Text>
                <Text className="text-foreground text-sm font-medium">Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-card border border-border rounded-lg p-4 flex-1 min-w-[45%] items-center opacity-50"
                disabled
              >
                <Text className="text-3xl mb-2">📊</Text>
                <Text className="text-foreground text-sm font-medium">Poll</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title={createPostMutation.isPending ? "Posting..." : "Post"}
            onPress={handlePost}
            loading={createPostMutation.isPending}
            disabled={createPostMutation.isPending || (!content.trim() && !mediaUri)}
            size="lg"
            data-testid="button-submit-post"
          />
          
          {createPostMutation.isPending && (
            <Text className="text-muted-foreground text-center mt-2 text-sm">
              Sharing with your kliq...
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}