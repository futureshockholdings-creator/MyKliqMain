import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

interface KnowledgeBase {
  [key: string]: {
    keywords: string[];
    response: string;
    relatedTopics?: string[];
  };
}

const knowledgeBase: KnowledgeBase = {
  home: {
    keywords: ['home', 'headlines', 'feed', 'post', 'create post', 'main page', 'home icon'],
    response: "The Headlines page (🏠 Home icon) is your main feed where you can see all posts, polls, events, and activities from your kliq members. You can create new posts, add GIFs or moviecons, and interact with content from your friends.",
    relatedTopics: ['posts', 'polls', 'feed', 'navigation']
  },
  posts: {
    keywords: ['post', 'create post', 'share', 'content', 'writing'],
    response: "To create a post, click the text area at the top of Headlines, write your message, and optionally add a GIF or moviecon. Your post will be shared with all your kliq members.",
    relatedTopics: ['home', 'gifs', 'moviecons']
  },
  kliq: {
    keywords: ['kliq', 'friends', 'pyramid', 'rank', 'add friends', 'friend ranking', 'my kliq', 'users icon'],
    response: "My Kliq page (👥 Users icon) shows your friend pyramid with up to 28 friends ranked by closeness. You can drag friends to rerank them, add new friends with invite codes, manage kliq closure settings, and remove friends.",
    relatedTopics: ['friends', 'invites', 'ranking', 'navigation']
  },
  events: {
    keywords: ['events', 'create event', 'attendance', 'going', 'maybe', 'event details', 'calendar icon'],
    response: "Events page (📅 Calendar icon) lets you create and manage kliq events. Set the title, date, time, location, and description. Other kliq members can mark their attendance as Going, Maybe, or Can't Go. Events automatically post to the Headlines feed when created.",
    relatedTopics: ['attendance', 'calendar', 'navigation']
  },
  messages: {
    keywords: ['messages', 'chat', 'dm', 'direct message', 'conversation', 'im', 'message circle icon'],
    response: "Messages or IM page (💬 MessageCircle icon) is for private conversations with individual kliq members. You can send text, photos, videos, GIFs, and moviecons in your chats. Shows notification badges for unread messages.",
    relatedTopics: ['chat', 'media', 'navigation']
  },
  meetup: {
    keywords: ['meetup', 'location', 'check in', 'gps', 'where'],
    response: "Meetup page lets you share your current location with your kliq. Click 'Share Location' to post your GPS coordinates to the Headlines feed for friends to see where you are.",
    relatedTopics: ['location', 'headlines']
  },
  actions: {
    keywords: ['actions', 'live stream', 'streaming', 'go live', 'video icon'],
    response: "Actions page (🎥 Video icon) is for live streaming to your kliq. Start a live stream to share real-time video with your friends, and they can join to watch and chat. Streams automatically post to Headlines when started.",
    relatedTopics: ['streaming', 'live', 'navigation']
  },
  profile: {
    keywords: ['profile', 'edit profile', 'bio', 'avatar', 'profile picture', 'user icon'],
    response: "Profile page (👤 User icon) lets you customize your personal information, upload profile pictures with camera icon, set wallpaper backgrounds, manage your bio, and update account settings. Located at the top of navigation.",
    relatedTopics: ['avatar', 'customization', 'navigation']
  },
  themes: {
    keywords: ['themes', 'customize', 'colors', 'appearance', 'design', 'palette icon'],
    response: "Themes page (🎨 Palette icon) allows you to personalize your MyKliq experience with custom colors, fonts, backgrounds, and UI styles. Use 'Surprise Me' for random themes that ensure readability.",
    relatedTopics: ['customization', 'colors', 'navigation']
  },
  moviecons: {
    keywords: ['moviecons', 'video reactions', 'custom videos', 'emotes'],
    response: "Moviecons are custom video reactions you can upload and use in posts and messages. Manage your moviecon library on the Moviecon Manager page.",
    relatedTopics: ['videos', 'reactions']
  },
  polls: {
    keywords: ['polls', 'voting', 'create poll', 'survey', 'questions'],
    response: "Create polls with multiple choice options and time limits. Your kliq members can vote, and results are shown in real-time with percentages.",
    relatedTopics: ['voting', 'questions']
  },
  stories: {
    keywords: ['stories', 'temporary', '24 hours', 'disappearing'],
    response: "Stories are temporary posts that disappear after 24 hours. Share photos, videos, or text that you want to be temporary rather than permanent.",
    relatedTopics: ['temporary', 'media']
  },
  ads: {
    keywords: ['ads', 'sponsored', 'advertising', 'promotions'],
    response: "Sponsored ads appear in your feed based on your interests. Manage your ad preferences and view ad analytics on the Ads Manager page.",
    relatedTopics: ['advertising', 'preferences']
  },
  invites: {
    keywords: ['invite', 'invite code', 'join kliq', 'add friends'],
    response: "Use unique invite codes (format: KLIQ-XXXX-XXXX) to invite new friends to your kliq. Each code can only be used once and connects you as friends.",
    relatedTopics: ['kliq', 'friends']
  },
  notifications: {
    keywords: ['notifications', 'alerts', 'bell', 'updates'],
    response: "Notifications show you updates like new posts, event attendance changes, friend activities, and messages. Check the bell icon for recent alerts.",
    relatedTopics: ['alerts', 'updates']
  },
  navigation: {
    keywords: ['navigation', 'nav', 'menu', 'sidebar', 'icons', 'layout', 'where', 'how to find', 'left side'],
    response: "MyKliq navigation is on the left side with these icons from top to bottom: Profile (👤 User), Headlines (🏠 Home), My Kliq (👥 Users), Messages (💬 MessageCircle), Events (📅 Calendar), Actions (🎥 Video), and Themes (🎨 Palette). The notification bell (🔔) at the very top shows alerts.",
    relatedTopics: ['icons', 'alerts', 'layout']
  },
  alerts: {
    keywords: ['alerts', 'bell icon', 'notification bell', 'badge', 'unread', 'notification panel', 'red badge'],
    response: "The Alerts system (🔔 Bell icon at top of navigation) shows all your notifications including friend requests, event invites, and messages. Red badges indicate unread items. Click the bell to open the notification panel and see all your alerts organized by type.",
    relatedTopics: ['navigation', 'friends', 'events', 'messages']
  },
  badges: {
    keywords: ['badges', 'red circles', 'notification badges', 'unread count', 'numbers', 'red numbers'],
    response: "Red notification badges appear on navigation icons to show unread items: Messages icon shows unread chat count, My Kliq shows friend request count, Events shows event invite count, and the main Alerts bell shows total unread count across all categories.",
    relatedTopics: ['alerts', 'navigation', 'notifications']
  }
};

const greetingMessages = [
  "Hi! I'm here to help you understand MyKliq's features. What would you like to know?",
  "Hello! Ask me about any page or feature in MyKliq and I'll explain how it works.",
  "Hey there! I can help you navigate MyKliq's functionality. What questions do you have?"
];

const fallbackResponses = [
  "I can help you with MyKliq features! Try asking about Headlines, My Kliq, Events, Messages, Profile, Themes, Actions, or the navigation icons and alert badges.",
  "I'm here to help you navigate MyKliq! Ask me about any page, icon, notification badge, or feature you'd like to understand better.",
  "Need help with MyKliq? I can explain how to use posts, polls, events, messaging, themes, navigation icons, notification badges, and more!",
  "I can guide you through MyKliq features. Try asking about creating content, managing friends, customizing themes, or understanding the navigation layout and alert system."
];

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial greeting when chatbot opens for the first time
      const greeting = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
      setMessages([{
        id: '1',
        type: 'bot',
        message: greeting,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const findBestMatch = (userInput: string): string => {
    const input = userInput.toLowerCase();
    let bestMatch = '';
    let highestScore = 0;

    // Check each knowledge base entry
    Object.entries(knowledgeBase).forEach(([key, data]) => {
      let score = 0;
      
      // Check for exact keyword matches
      data.keywords.forEach(keyword => {
        if (input.includes(keyword.toLowerCase())) {
          score += keyword.length; // Longer matches get higher scores
        }
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = key;
      }
    });

    // If we found a good match, return the response
    if (highestScore > 0) {
      const response = knowledgeBase[bestMatch].response;
      const relatedTopics = knowledgeBase[bestMatch].relatedTopics;
      
      if (relatedTopics && relatedTopics.length > 0) {
        return `${response}\n\nRelated topics: ${relatedTopics.join(', ')}`;
      }
      return response;
    }

    // No match found, return fallback
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userQuestion = inputValue;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: userQuestion,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay for more natural feel
    setTimeout(async () => {
      const botResponse = findBestMatch(userQuestion);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      // Send conversation to backend for email forwarding
      try {
        const response = await fetch('/api/chatbot/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userQuestion,
            botResponse
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to send conversation to backend:', error);
        // Don't show error to user - email forwarding is background functionality
      }
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={toggleChatbot}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          data-testid="button-chatbot-toggle"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                MyKliq Support
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChatbot}
                data-testid="button-chatbot-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 px-4 h-full">
              <div className="space-y-3 pb-3 min-h-full">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.type === 'bot' && (
                          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        {message.type === 'user' && (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground p-3 rounded-lg max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="flex-shrink-0 p-4 pt-2 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about MyKliq features..."
                  className="flex-1"
                  data-testid="input-chatbot-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  data-testid="button-chatbot-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}