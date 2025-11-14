import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import StoriesScreen from '../screens/StoriesScreen';
import StoryViewerScreen from '../screens/StoryViewerScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ConversationScreen from '../screens/ConversationScreen';
import KliqKoinScreen from '../screens/KliqKoinScreen';
import CommentsScreen from '../screens/CommentsScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';

// Providers
import { useAuth } from '../providers/AuthProvider';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab icons using emoji (replace with proper icons in production)
const TabIcon = ({ focused, emoji }: { focused: boolean; emoji: string }) => (
  <Text style={{ 
    fontSize: 24, 
    opacity: focused ? 1 : 0.6,
    transform: [{ scale: focused ? 1.1 : 1 }]
  }}>
    {emoji}
  </Text>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#00FF00',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#000',
          borderBottomColor: '#333',
          borderBottomWidth: 1,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏠" />,
          headerTitle: 'My Feed',
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="➕" />,
          headerTitle: 'Create Post',
          tabBarLabel: 'Post',
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreatePostModal');
          },
        })}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👥" />,
          headerTitle: 'My Kliq',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="💬" />,
          headerTitle: 'Messages',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👤" />,
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const RootStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreatePostModal"
        component={CreatePostScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="StoryViewerModal"
        component={StoryViewerScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="ConversationScreen"
        component={ConversationScreen}
        options={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#00FF00',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="KliqKoinScreen"
        component={KliqKoinScreen}
        options={{
          headerTitle: 'Kliq Koin & Streaks',
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#00FF00',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="CommentsScreen"
        component={CommentsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationPreferencesScreen"
        component={NotificationPreferencesScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can replace this with a proper loading screen
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <RootStackNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};