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

// Context
import { useAuth } from '../contexts/AuthContext';

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
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👥" />,
          headerTitle: 'My Kliq',
        }}
      />
      <Tab.Screen
        name="Stories"
        component={() => (
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
            Stories feature coming soon! 📱
          </Text>
        )}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📖" />,
          headerTitle: 'Stories',
          headerStyle: {
            backgroundColor: '#000',
            borderBottomColor: '#333',
            borderBottomWidth: 1,
          },
          headerTintColor: '#fff',
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

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // You can replace this with a proper loading screen
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainTabNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;