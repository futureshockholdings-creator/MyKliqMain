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
    response: "The Headlines page (🏠 Home icon) is your central social hub displaying all content from your kliq members. This includes posts, polls, events, live stream notifications, location check-ins, and auto-posted content. You can create new posts with text, photos, videos, GIFs, or moviecons. The feed shows real-time activity with like and comment interactions that update instantly.",
    relatedTopics: ['posts', 'polls', 'feed', 'navigation', 'auto-posting']
  },
  posts: {
    keywords: ['post', 'create post', 'share', 'content', 'writing', 'like', 'comment'],
    response: "To create a post: 1) Click the text area at the top of Headlines, 2) Write your message, 3) Optionally add media (photos, videos, GIFs, moviecons), 4) Click Post. Your content is shared with all kliq members. Posts support real-time likes and comments with instant UI updates. You can also post daily horoscopes and bible verses with one-click from the daily content section.",
    relatedTopics: ['home', 'gifs', 'moviecons', 'daily-content', 'interactions']
  },
  kliq: {
    keywords: ['kliq', 'friends', 'pyramid', 'rank', 'add friends', 'friend ranking', 'my kliq', 'users icon', 'emoji', 'close kliq', 'closure'],
    response: "My Kliq page (👥 Users icon) shows your friend pyramid with up to 28 friends ranked 1-28 by closeness. Key features: 1) Drag friends to rerank them, 2) Add custom emoji to your kliq name (16 options: 🏆 🚀 🎆 ✨ 🔥 💫 ❤️ 👏 🌟 💎 🎉 ⚡ 🎯 💪 👑 🦄), 3) Manage kliq closure settings (open/closed for new members), 4) Add new friends with KLIQ-XXXX-XXXX invite codes, 5) Remove friends. The emoji appears in both the header and pyramid display.",
    relatedTopics: ['friends', 'invites', 'ranking', 'navigation', 'closure']
  },
  events: {
    keywords: ['events', 'create event', 'attendance', 'going', 'maybe', 'event details', 'calendar icon', 'auto-post'],
    response: "Events page (📅 Calendar icon) manages kliq gatherings and activities. To create: 1) Set title, date, time, location, description, 2) Event automatically posts to Headlines feed, 3) Members mark attendance (Going/Maybe/Can't Go), 4) View RSVP counts and attendee lists. Events have built-in auto-posting - when created or updated, they generate posts in the Headlines feed to keep everyone informed.",
    relatedTopics: ['attendance', 'calendar', 'navigation', 'auto-posting']
  },
  messages: {
    keywords: ['messages', 'chat', 'dm', 'direct message', 'conversation', 'im', 'message circle icon', 'incognito', 'private'],
    response: "Messages/IM page (💬 MessageCircle icon) offers two types of private conversations: 1) Regular messaging - standard private chats with text, photos, videos, GIFs, and moviecons, 2) Incognito messaging - ultra-private conversations that auto-delete after 7 days for maximum privacy. All message types show notification badges for unread messages and support rich media sharing.",
    relatedTopics: ['chat', 'media', 'navigation', 'incognito', 'privacy']
  },
  incognito: {
    keywords: ['incognito', 'private', 'secret', 'auto-delete', 'temporary messages', 'disappearing', 'privacy'],
    response: "Incognito messaging is MyKliq's ultra-private chat feature. Key features: 1) Complete auto-deletion - entire conversations and all messages are permanently deleted after 7 days, 2) Enhanced privacy protection - no permanent record kept in database, 3) Automatic cleanup runs hourly, 4) Same rich media support as regular messages, 5) Perfect for sensitive or temporary conversations that require maximum confidentiality.",
    relatedTopics: ['messages', 'privacy', 'auto-delete', 'security']
  },
  meetup: {
    keywords: ['meetup', 'location', 'check in', 'gps', 'where', 'share location', 'bulletin'],
    response: "Meetup page enables location sharing with your kliq. How it works: 1) Click 'Share Location' to access your GPS coordinates, 2) Your location automatically posts to the Headlines feed, 3) Friends can see where you are in real-time, 4) Great for coordinating meetups or letting friends know your whereabouts. Location posts appear in the Bulletin section of the Headlines feed.",
    relatedTopics: ['location', 'headlines', 'gps', 'auto-posting']
  },
  actions: {
    keywords: ['actions', 'live stream', 'streaming', 'go live', 'video icon', 'real-time'],
    response: "Actions page (🎥 Video icon) is MyKliq's live streaming platform. Features: 1) Start live video streams to broadcast to your kliq, 2) Real-time chat during streams, 3) Automatic posting to Headlines when you go live, 4) Friends receive notifications about your stream, 5) Interactive viewing experience with live comments. Perfect for sharing live moments, events, or just hanging out virtually with your kliq.",
    relatedTopics: ['streaming', 'live', 'navigation', 'auto-posting', 'real-time']
  },
  profile: {
    keywords: ['profile', 'edit profile', 'bio', 'avatar', 'profile picture', 'user icon', 'wallpaper', 'settings', 'birthdate', 'security'],
    response: "Profile page (👤 User icon) is your personal customization hub. Key sections: 1) Profile Photo - upload with camera icon, 2) Wallpaper backgrounds - customize your profile backdrop, 3) Bio and personal information, 4) Birthdate (required for horoscope features), 5) Security settings including PIN and security questions for password recovery, 6) Account management. Located at the top of navigation for easy access.",
    relatedTopics: ['avatar', 'customization', 'navigation', 'security', 'horoscope']
  },
  themes: {
    keywords: ['themes', 'customize', 'colors', 'appearance', 'design', 'palette icon', 'surprise me', 'fonts', 'backgrounds'],
    response: "Themes page (🎨 Palette icon) offers extensive UI customization. Features: 1) Background options - solid colors, gradients, patterns, 2) Font customization - multiple typefaces and sizes, 3) Primary/secondary color schemes, 4) Border styles and visual effects, 5) 'Surprise Me' randomizer - generates random themes ensuring readability, 6) Real-time preview, 7) Global application across entire app using CSS variables. Create a truly personalized MyKliq experience.",
    relatedTopics: ['customization', 'colors', 'navigation', 'personalization']
  },
  moviecons: {
    keywords: ['moviecons', 'video reactions', 'custom videos', 'emotes', 'upload', 'library'],
    response: "Moviecons are MyKliq's custom video reaction system. How they work: 1) Upload your own short video clips as reactions, 2) Use them in posts and messages like emojis, 3) Build your personal moviecon library, 4) Access through Moviecon Manager page, 5) Perfect for personalized reactions, inside jokes, or expressing emotions with custom video content. They add a unique, personal touch to your communications.",
    relatedTopics: ['videos', 'reactions', 'posts', 'messages', 'customization']
  },
  polls: {
    keywords: ['polls', 'voting', 'create poll', 'survey', 'questions', 'time limit', 'results', 'percentages'],
    response: "Polls enable interactive decision-making within your kliq. Features: 1) Create multiple choice questions, 2) Set custom time limits for voting, 3) Real-time results with live percentages, 4) Vote tracking shows who participated, 5) Auto-posting to Headlines feed, 6) Perfect for group decisions, opinions, or fun questions. Results update instantly as members vote, creating engaging interactive content.",
    relatedTopics: ['voting', 'questions', 'real-time', 'interaction', 'auto-posting']
  },
  stories: {
    keywords: ['stories', 'temporary', '24 hours', 'disappearing', 'ephemeral'],
    response: "Stories are temporary content that disappears after 24 hours. Perfect for: 1) Sharing moments you don't want to keep permanently, 2) Behind-the-scenes content, 3) Daily updates or thoughts, 4) Photos/videos with temporary relevance. Stories support the same media types as posts (photos, videos, text) but automatically delete, giving you freedom to share more casually without permanent record.",
    relatedTopics: ['temporary', 'media', 'casual-sharing', 'privacy']
  },
  ads: {
    keywords: ['ads', 'sponsored', 'advertising', 'promotions', 'manager'],
    response: "MyKliq's advertising system delivers personalized sponsored content. Features: 1) Interest-based ad targeting, 2) Ads Manager page for admin control, 3) Analytics and performance tracking, 4) Preference management for users, 5) Non-intrusive integration with regular feed content. Admins can manage ad campaigns, while users can customize their ad experience through preference settings.",
    relatedTopics: ['advertising', 'preferences', 'analytics', 'personalization']
  },
  invites: {
    keywords: ['invite', 'invite code', 'join kliq', 'add friends', 'KLIQ'],
    response: "MyKliq uses unique invite codes for secure friend connections. System details: 1) Format: KLIQ-XXXX-XXXX (e.g., KLIQ-1234-5678), 2) One-time use only - each code works once, 3) Creates mutual friendship when used, 4) Secure method to control kliq growth, 5) Generate codes on My Kliq page, 6) Share codes outside the app to invite new members. This ensures your kliq remains close-knit and trusted.",
    relatedTopics: ['kliq', 'friends', 'security', 'growth']
  },
  notifications: {
    keywords: ['notifications', 'alerts', 'bell', 'updates', 'badge'],
    response: "MyKliq's comprehensive notification system keeps you updated. Types include: 1) Friend activities (posts, comments, likes), 2) Event invitations and updates, 3) Message notifications, 4) Live stream alerts, 5) Poll participation, 6) Kliq changes. The bell icon (🔔) shows total unread count, while individual page badges show specific counts (messages, events, etc.).",
    relatedTopics: ['alerts', 'updates', 'badges', 'real-time']
  },
  navigation: {
    keywords: ['navigation', 'nav', 'menu', 'sidebar', 'icons', 'layout', 'where', 'how to find', 'left side'],
    response: "MyKliq navigation is a left sidebar with clear icons from top to bottom: 1) Profile (👤 User) - your personal settings, 2) Headlines (🏠 Home) - main social feed, 3) My Kliq (👥 Users) - friend pyramid and management, 4) Messages (💬 MessageCircle) - private conversations, 5) Events (📅 Calendar) - kliq gatherings, 6) Actions (🎥 Video) - live streaming, 7) Themes (🎨 Palette) - visual customization. Notification bell (🔔) at top shows alerts.",
    relatedTopics: ['icons', 'alerts', 'layout', 'organization']
  },
  alerts: {
    keywords: ['alerts', 'bell icon', 'notification bell', 'badge', 'unread', 'notification panel', 'red badge'],
    response: "The Alerts system (🔔 Bell icon) is your notification command center. Features: 1) Centralized view of all notifications, 2) Organized by type (friends, events, messages, activities), 3) Red badges indicate unread counts, 4) Click to open notification panel, 5) Mark all as read functionality, 6) Delete all option for cleanup, 7) Real-time updates for new alerts. Essential for staying connected with your kliq's activity.",
    relatedTopics: ['navigation', 'friends', 'events', 'messages', 'real-time']
  },
  badges: {
    keywords: ['badges', 'red circles', 'notification badges', 'unread count', 'numbers', 'red numbers'],
    response: "Red notification badges provide instant visual feedback across MyKliq. Locations: 1) Messages icon - unread chat count, 2) My Kliq icon - friend request count, 3) Events icon - event invite count, 4) Main Alerts bell - total unread across all categories. Badges update in real-time and help you quickly identify where attention is needed without opening each section.",
    relatedTopics: ['alerts', 'navigation', 'notifications', 'visual-feedback']
  },
  'daily-content': {
    keywords: ['daily', 'horoscope', 'bible verse', 'inspiration', 'zodiac', 'astrology', 'spiritual'],
    response: "MyKliq offers daily inspirational content features: 1) Daily Horoscope - personalized readings based on your birthdate/zodiac sign, includes lucky numbers and colors, 2) Daily Bible Verse - curated inspirational verses with reflections, 3) One-click posting to Headlines feed to share with your kliq, 4) Timezone-aware generation ensures fresh content daily, 5) Requires birthdate in profile for horoscope functionality.",
    relatedTopics: ['posts', 'profile', 'inspiration', 'sharing']
  },
  horoscope: {
    keywords: ['horoscope', 'zodiac', 'astrology', 'sign', 'birthdate', 'lucky numbers', 'colors'],
    response: "Daily Horoscope system provides personalized astrological content. Features: 1) Zodiac sign auto-calculated from your profile birthdate, 2) Daily personalized readings, 3) Lucky numbers and colors, 4) One-click posting to Headlines, 5) Fresh content generated daily with timezone awareness. Note: Birthdate is required in your profile to access horoscope features - update your profile if you haven't set it yet.",
    relatedTopics: ['daily-content', 'profile', 'zodiac', 'personalization']
  },
  'bible-verse': {
    keywords: ['bible', 'verse', 'spiritual', 'inspiration', 'daily verse', 'christian', 'faith'],
    response: "Daily Bible Verse feature provides spiritual inspiration. Includes: 1) 15 carefully curated inspirational verses, 2) Daily reflections and commentary, 3) Timezone-aware rotation ensuring fresh content, 4) One-click posting to Headlines to share inspiration with your kliq, 5) Perfect for users seeking daily spiritual encouragement and community sharing of faith-based content.",
    relatedTopics: ['daily-content', 'inspiration', 'spiritual', 'sharing']
  },
  'auto-posting': {
    keywords: ['auto-post', 'automatic', 'automated posting', 'feed updates', 'kliq feed'],
    response: "MyKliq's intelligent auto-posting system keeps your kliq informed of important activities. Auto-posts include: 1) Event creation and updates, 2) Live stream notifications when someone goes live, 3) Location check-ins from Meetup, 4) Poll creations, 5) System activities. All auto-posts appear in the Headlines feed with clear indicators of their source, ensuring your kliq stays connected without manual updates.",
    relatedTopics: ['events', 'actions', 'meetup', 'polls', 'headlines']
  },
  'social-media': {
    keywords: ['social media', 'integration', 'instagram', 'tiktok', 'youtube', 'twitch', 'discord', 'reddit', 'oauth'],
    response: "MyKliq features comprehensive social media integration. Supported platforms: 1) Instagram, 2) TikTok, 3) YouTube, 4) Twitch, 5) Discord, 6) Reddit. Features include: OAuth 2.0 secure connection, AES-256 encryption for tokens, unified social feed displaying all connected content, platform-specific styling, connection status indicators, and settings interface for management. Aggregate all your social presence in one place.",
    relatedTopics: ['integration', 'oauth', 'security', 'aggregation']
  },
  closure: {
    keywords: ['closure', 'kliq closure', 'open kliq', 'closed kliq', 'new members', 'privacy'],
    response: "Kliq Closure settings control who can join your kliq. Options: 1) Open Kliq - anyone with an invite code can join, 2) Closed Kliq - no new members allowed, existing members only. Manage this setting on the My Kliq page. Closure helps maintain your desired group size and privacy level, ensuring your kliq remains as intimate or open as you prefer.",
    relatedTopics: ['kliq', 'privacy', 'members', 'settings']
  },
  security: {
    keywords: ['security', 'password', 'recovery', 'pin', 'security questions', 'authentication'],
    response: "MyKliq employs multi-layer security for account protection. Security features: 1) 4-step password recovery (phone → security questions → PIN → new password), 2) Security PIN for account verification, 3) Three required security questions, 4) PIN-based secure verification, 5) Encrypted credential storage, 6) Session management. Set up all security features in your Profile page for maximum protection.",
    relatedTopics: ['profile', 'recovery', 'authentication', 'privacy']
  },
  'mobile-app': {
    keywords: ['mobile', 'app', 'ios', 'android', 'app store', 'google play', 'native', 'react native'],
    response: "MyKliq is developing native mobile apps for iOS and Android. Features: 1) Full feature parity with web version, 2) JWT authentication for mobile, 3) Optimized mobile API endpoints, 4) Push notification support, 5) Native camera and photo integration, 6) Planned App Store and Google Play release. The mobile experience will provide all MyKliq features optimized for touch interfaces and mobile usage patterns.",
    relatedTopics: ['ios', 'android', 'native', 'notifications']
  },
  'video-calls': {
    keywords: ['video call', 'video calling', 'call', 'calling', 'video chat', 'webrtc', 'camera', 'microphone'],
    response: "MyKliq features WebRTC-based video calling for face-to-face conversations with friends. How it works: 1) Click on friends in the pyramid chart to start a video call, 2) Uses browser camera and microphone (permission required), 3) Real-time video and audio streaming, 4) Call controls include mute, video toggle, and end call, 5) Supports multiple participants in group calls, 6) Video calls boost your friendship ranking scores significantly (8.0 weight). No phone system access needed - works entirely through your web browser.",
    relatedTopics: ['kliq', 'friends', 'webrtc', 'real-time', 'ranking']
  },
  'gifs': {
    keywords: ['gifs', 'animated images', 'gif library', 'reactions', 'giphy', 'animated'],
    response: "GIF support enhances your messaging and posting experience. Features: 1) Extensive GIF library integration, 2) Search for perfect animated reactions, 3) Use in posts and messages, 4) Popular categories and trending GIFs, 5) Easy integration with posts and comments. GIFs add fun and expressiveness to your communications, perfect for reactions, emotions, or just adding humor to conversations.",
    relatedTopics: ['posts', 'messages', 'reactions', 'media']
  },
  'friend-ranking': {
    keywords: ['friend ranking', 'ranking system', 'friendship score', 'pyramid ranking', 'closest friends', 'rank friends'],
    response: "MyKliq's intelligent friend ranking system automatically calculates friendship closeness using advanced algorithms. Factors include: 1) Message exchanges (highest weight), 2) Video calls (8.0 weight - very important), 3) Post interactions (likes, comments), 4) Story views, 5) Live stream participation, 6) Meetup attendance together, 7) Response time patterns. The system learns from your interactions and suggests optimal friend positions in your 1-28 pyramid, but you can always drag to manually rerank.",
    relatedTopics: ['kliq', 'pyramid', 'algorithms', 'interactions', 'video-calls']
  }
};

const greetingMessages = [
  "Hi! I'm your MyKliq expert assistant. I can help you with everything from basic navigation to advanced features like video calling, incognito messaging, live streaming, auto-posting, and social media integration. What would you like to know?",
  "Hello! I know all about MyKliq's features - from the friend pyramid and video calling to daily horoscopes, polls, themes, GIFs, and mobile app development. Ask me anything!",
  "Hey there! I'm here to help you master MyKliq. Whether you need help with video calls, messaging, events, live streaming, friend ranking algorithms, or any other feature, I've got detailed answers for you!"
];

const fallbackResponses = [
  "I have comprehensive knowledge about MyKliq! Try asking about: Headlines feed, friend pyramid, video calling, incognito messaging, live streaming, auto-posting, daily horoscopes, polls, events, themes, security settings, social media integration, kliq closure, or mobile app features.",
  "I can provide detailed help with all MyKliq features! Ask about: navigation, notification badges, kliq customization with emojis, video calls, password recovery, moviecons, stories, meetup location sharing, bible verses, GIFs, or any specific functionality you're curious about.",
  "Need detailed guidance? I know about: video calling with WebRTC, posting and interactions, real-time features, privacy settings, auto-deletion, live streaming with chat, event management, theme customization, friend ranking algorithms, security PINs, social media connections, or the upcoming mobile apps for iOS and Android.",
  "I'm your complete MyKliq guide! I can explain: video calling system, friend ranking algorithms, kliq closure settings, incognito conversations, daily content features, notification system, profile customization, live actions, poll creation, GIF integration, or any advanced functionality step-by-step."
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

      // Email sending removed - will be handled when chatbot is closed
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const sendConversationEmail = async () => {
    // Only send if there's a meaningful conversation (more than just the greeting)
    if (messages.length <= 1) return;
    
    try {
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'bot')
        .map(msg => `${msg.type.toUpperCase()}: ${msg.message}`)
        .join('\n\n');
      
      const response = await fetch('/api/chatbot/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory,
          timestamp: new Date().toISOString(),
          messageCount: messages.length
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('Conversation email sent successfully');
    } catch (error) {
      console.error('Failed to send conversation email:', error);
    }
  };

  const toggleChatbot = () => {
    if (isOpen) {
      // Closing chatbot - send conversation email
      sendConversationEmail();
    }
    
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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50 text-xs font-semibold"
          data-testid="button-chatbot-toggle"
        >
          HELP
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-64 h-[350px] shadow-xl z-50 flex flex-col">
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