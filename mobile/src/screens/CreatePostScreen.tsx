import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import ApiService from '../services/api';

interface CreatePostScreenProps {
  navigation: any;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation }) => {
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera access is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType('image');
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Photo library access is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const handleRemoveMedia = () => {
    setMediaUri(null);
    setMediaType(null);
  };

  const uploadMedia = async (uri: string, type: 'image' | 'video'): Promise<string> => {
    // This is a simplified upload - in production you'd upload to your backend/S3
    // For now, we'll simulate the upload and return the URI
    // In real implementation, use ApiService.prepareFileUpload() then upload to presigned URL
    
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'media';
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `${type}/${match[1]}` : `${type}`;

    formData.append('file', {
      uri,
      name: filename,
      type: fileType,
    } as any);

    // In production, upload to your backend here
    // For now, return the local URI (backend should handle this)
    return uri;
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaUri) {
      Alert.alert('Empty Post', 'Please add some content or media to your post');
      return;
    }

    setUploading(true);
    try {
      let mediaUrl: string | undefined;
      
      if (mediaUri && mediaType) {
        mediaUrl = await uploadMedia(mediaUri, mediaType);
      }

      await ApiService.createPost({
        content: content.trim() || undefined,
        mediaUrl,
        mediaType: mediaType || undefined,
      });

      Alert.alert('Success', 'Your post has been shared with your kliq!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Post</Text>
            <TouchableOpacity
              onPress={handlePost}
              disabled={uploading || (!content.trim() && !mediaUri)}
            >
              <Text
                style={[
                  styles.postButton,
                  (uploading || (!content.trim() && !mediaUri)) && styles.postButtonDisabled,
                ]}
              >
                {uploading ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Text Input */}
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          {/* Media Preview */}
          {mediaUri && (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: mediaUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeMediaButton}
                onPress={handleRemoveMedia}
              >
                <Text style={styles.removeMediaText}>✕</Text>
              </TouchableOpacity>
              {mediaType === 'video' && (
                <View style={styles.videoIndicator}>
                  <Text style={styles.videoIndicatorText}>🎥 Video</Text>
                </View>
              )}
            </View>
          )}

          {/* Media Options */}
          <View style={styles.mediaOptions}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleTakePhoto}
              disabled={uploading}
            >
              <Text style={styles.mediaIcon}>📷</Text>
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handlePickImage}
              disabled={uploading}
            >
              <Text style={styles.mediaIcon}>🖼️</Text>
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mediaButton, styles.mediaButtonDisabled]}
              disabled
            >
              <Text style={styles.mediaIcon}>🎬</Text>
              <Text style={styles.mediaButtonText}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mediaButton, styles.mediaButtonDisabled]}
              disabled
            >
              <Text style={styles.mediaIcon}>😊</Text>
              <Text style={styles.mediaButtonText}>GIF</Text>
            </TouchableOpacity>
          </View>

          {/* Character Count */}
          <Text style={styles.charCount}>
            {content.length}/2000 characters
          </Text>

          {/* Loading Indicator */}
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color="#00FF00" size="large" />
              <Text style={styles.uploadingText}>Posting to your kliq...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  cancelButton: {
    color: '#888',
    fontSize: 16,
  },
  title: {
    color: '#00FF00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postButton: {
    color: '#00FF00',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonDisabled: {
    color: '#333',
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  mediaPreview: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  videoIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  mediaButton: {
    alignItems: 'center',
    padding: 8,
  },
  mediaButtonDisabled: {
    opacity: 0.4,
  },
  mediaIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  mediaButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 30,
  },
  uploadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
});

export default CreatePostScreen;