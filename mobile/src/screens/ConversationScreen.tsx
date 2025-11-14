import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '../components/ui/Button';
import type { MessageData } from '../../shared/api-contracts';

interface ConversationScreenProps {
  route: {
    params: {
      friendId: string;
      friendName: string;
    };
  };
  navigation: any;
}

export default function ConversationScreen({ route, navigation }: ConversationScreenProps) {
  const { friendId, friendName } = route.params;
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [gifModalVisible, setGifModalVisible] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    navigation.setOptions({ headerTitle: friendName });
  }, [friendName, navigation]);

  const { data: messages = [], isLoading, error, refetch } = useQuery<MessageData[]>({
    queryKey: ['/api/mobile/messages', friendId],
    queryFn: () => apiClient.getMessages(friendId),
    refetchInterval: 3000,
  });

  const sendTextMutation = useMutation({
    mutationFn: (content: string) => apiClient.sendMessage(friendId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/messages', friendId] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/messages/conversations'] });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send message');
    },
  });

  const sendGifMutation = useMutation({
    mutationFn: (gifUrl: string) => apiClient.sendGifMessage(friendId, gifUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/messages', friendId] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/messages/conversations'] });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send GIF');
    },
  });

  const sendMediaMutation = useMutation({
    mutationFn: (formData: FormData) => apiClient.sendMediaMessage(friendId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/messages', friendId] });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/messages/conversations'] });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to send image');
    },
  });

  const handleSend = () => {
    if (!inputText.trim() || sendTextMutation.isPending) return;
    
    const message = inputText.trim();
    setInputText('');
    sendTextMutation.mutate(message);
  };

  const handleAttachment = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable photo library access in settings');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const formData = new FormData();
        formData.append('media', {
          uri: result.assets[0].uri,
          name: 'image.jpg',
          type: 'image/jpeg',
        } as any);

        sendMediaMutation.mutate(formData);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to select image');
    }
  };

  const handleGif = () => {
    setGifModalVisible(true);
    setGifUrl('');
  };

  const handleGifSubmit = () => {
    if (gifUrl.trim()) {
      setGifModalVisible(false);
      sendGifMutation.mutate(gifUrl.trim());
      setGifUrl('');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: MessageData; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showTimestamp = !prevMessage || 
      new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000;

    return (
      <View>
        {showTimestamp && (
          <Text className="text-muted-foreground text-xs text-center my-4">
            {formatTime(item.createdAt)}
          </Text>
        )}
        <View
          className={`max-w-[80%] p-3 rounded-2xl my-0.5 ${
            isMyMessage 
              ? 'self-end bg-primary rounded-br' 
              : 'self-start bg-card rounded-bl'
          }`}
        >
          {item.mediaUrl && (
            <Image 
              source={{ uri: item.mediaUrl }}
              className="w-48 h-48 rounded-lg mb-2"
              resizeMode={item.mediaType === 'gif' ? 'contain' : 'cover'}
            />
          )}
          {item.content && (
            <Text
              className={`text-base leading-5 ${
                isMyMessage ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#00FF00" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="text-destructive text-xl font-bold mb-2" data-testid="error-messages">
          Failed to load messages
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          {error instanceof Error ? error.message : 'Something went wrong'}
        </Text>
        <Button onPress={() => refetch()} data-testid="button-retry-messages">
          <Text className="text-white font-semibold">Try Again</Text>
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerClassName="p-4 flex-grow"
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-10">
            <Text className="text-5xl mb-3">👋</Text>
            <Text className="text-muted-foreground text-base text-center">
              Start the conversation with {friendName}!
            </Text>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View className="flex-row items-center px-4 py-3 border-t border-border">
        <TouchableOpacity 
          className="p-2 mr-2"
          onPress={handleAttachment}
          disabled={sendTextMutation.isPending}
          data-testid="button-attach-media"
        >
          <Text className="text-2xl">📎</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="px-2 py-1 mr-2 bg-card rounded"
          onPress={handleGif}
          disabled={sendTextMutation.isPending}
          data-testid="button-gif"
        >
          <Text className="text-primary text-xs font-bold">GIF</Text>
        </TouchableOpacity>
        
        <TextInput
          className="flex-1 bg-card text-foreground px-4 py-2 rounded-full mr-2"
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          data-testid="input-message"
        />
        
        <TouchableOpacity
          className={`p-2 ${(!inputText.trim() || sendTextMutation.isPending) ? 'opacity-50' : ''}`}
          onPress={handleSend}
          disabled={!inputText.trim() || sendTextMutation.isPending}
          data-testid="button-send-message"
        >
          <Text className="text-2xl">📤</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={gifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGifModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-card rounded-2xl p-6 w-[80%] max-w-md">
            <Text className="text-foreground text-xl font-bold mb-2">Send GIF</Text>
            <Text className="text-muted-foreground text-sm mb-4">
              Enter GIF URL from Giphy or Tenor:
            </Text>
            <TextInput
              className="bg-background text-foreground border border-border rounded-lg px-4 py-3 mb-4"
              placeholder="https://media.giphy.com/media/..."
              placeholderTextColor="#666"
              value={gifUrl}
              onChangeText={setGifUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-muted py-3 rounded-lg"
                onPress={() => setGifModalVisible(false)}
              >
                <Text className="text-foreground text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 bg-primary py-3 rounded-lg ${!gifUrl.trim() ? 'opacity-50' : ''}`}
                onPress={handleGifSubmit}
                disabled={!gifUrl.trim()}
              >
                <Text className="text-primary-foreground text-center font-semibold">Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}