import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
}

interface ConversationScreenProps {
  route: {
    params: {
      friendId: string;
      friendName: string;
    };
  };
  navigation: any;
}

const ConversationScreen: React.FC<ConversationScreenProps> = ({ route, navigation }) => {
  const { friendId, friendName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [gifModalVisible, setGifModalVisible] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ headerTitle: friendName });
    loadMessages(false); // Initial load
    
    // Set up polling for real-time message updates (silent polling)
    const pollInterval = setInterval(() => {
      loadMessages(true);
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  }, []);

  const loadMessages = async (silent = false) => {
    try {
      const response = await ApiService.getMessages(friendId);
      // Only update if we have new messages or it's not silent
      if (!silent || response.length !== messages.length) {
        setMessages(response || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (messages.length === 0) setMessages([]);
    }
  };

  const handleAttachment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadAndSendMedia(asset.uri, asset.type || 'image');
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }
  };

  const uploadAndSendMedia = async (uri: string, type: string) => {
    try {
      setSending(true);
      
      // Create FormData for upload
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'media';
      const mediaType = type.includes('video') ? 'video' : 'image';
      
      formData.append('media', {
        uri,
        type: type.includes('video') ? 'video/mp4' : 'image/jpeg',
        name: filename,
      } as any);

      // Upload media and send message
      const response = await ApiService.sendMediaMessage(friendId, formData, mediaType);
      
      // Add to messages
      if (response.message) {
        setMessages(prev => [...prev, response.message]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      Alert.alert('Upload Failed', 'Could not send media. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleGif = () => {
    setGifModalVisible(true);
    setGifUrl('');
  };

  const handleGifSubmit = async () => {
    if (gifUrl.trim()) {
      setGifModalVisible(false);
      await sendGif(gifUrl.trim());
    }
  };

  const sendGif = async (gifUrl: string) => {
    try {
      setSending(true);
      
      const response = await ApiService.sendGifMessage(friendId, gifUrl);
      
      if (response.message) {
        setMessages(prev => [...prev, response.message]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Error sending GIF:', error);
      Alert.alert('Send Failed', 'Could not send GIF. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const tempMessage: Message = {
      id: Date.now().toString(),
      senderId: user?.id || '',
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setSending(true);
    try {
      // Optimistically add message
      setMessages((prev) => [...prev, tempMessage]);
      setInputText('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      await ApiService.sendMessage(friendId, inputText.trim());
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showTimestamp = !prevMessage || 
      new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000; // 5 min

    return (
      <View>
        {showTimestamp && (
          <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}
        >
          {item.mediaUrl && (
            item.mediaType === 'video' ? (
              <Video
                source={{ uri: item.mediaUrl }}
                style={styles.messageMedia}
                useNativeControls
                resizeMode="contain"
                shouldPlay={false}
              />
            ) : (
              <Image 
                source={{ uri: item.mediaUrl }}
                style={styles.messageMedia}
                resizeMode={item.mediaType === 'gif' ? 'contain' : 'cover'}
              />
            )
          )}
          {item.content && (
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👋</Text>
      <Text style={styles.emptyText}>
        Start the conversation with {friendName}!
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={handleAttachment}
        >
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.gifButton}
          onPress={handleGif}
        >
          <Text style={styles.gifIcon}>GIF</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Text style={styles.sendIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={gifModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGifModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send GIF</Text>
            <Text style={styles.modalSubtitle}>Enter GIF URL from Giphy or Tenor:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://media.giphy.com/media/..."
              placeholderTextColor="#666"
              value={gifUrl}
              onChangeText={setGifUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setGifModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSend]}
                onPress={handleGifSubmit}
                disabled={!gifUrl.trim()}
              >
                <Text style={[styles.modalButtonText, !gifUrl.trim() && styles.modalButtonTextDisabled]}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 2,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#00FF00',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#000',
  },
  theirMessageText: {
    color: '#fff',
  },
  messageMedia: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  attachIcon: {
    fontSize: 20,
  },
  gifButton: {
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  gifIcon: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#00FF00',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#333',
  },
  modalButtonSend: {
    backgroundColor: '#00FF00',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextDisabled: {
    opacity: 0.5,
  },
});

export default ConversationScreen;