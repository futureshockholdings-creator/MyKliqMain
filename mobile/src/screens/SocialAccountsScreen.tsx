import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../lib/apiClient';

type Provider = 'youtube' | 'twitch' | 'discord' | 'reddit' | 'pinterest' | 'bluesky';

type Connection = {
  id: string;
  platform: Provider;
  platformUsername: string;
  isActive: boolean;
  lastSyncAt?: string | null;
};

const OAUTH_PROVIDERS: Array<{ id: Exclude<Provider, 'bluesky'>; label: string; detail: string }> = [
  { id: 'youtube', label: 'YouTube', detail: 'Import videos from your own channel.' },
  { id: 'twitch', label: 'Twitch', detail: 'Import videos from your own channel.' },
  { id: 'discord', label: 'Discord', detail: 'Show your personal server activity summary.' },
  { id: 'reddit', label: 'Reddit', detail: 'Import your submitted posts.' },
  { id: 'pinterest', label: 'Pinterest', detail: 'Import your pins.' },
];

const MOBILE_REDIRECT_URI = 'mykliq://oauth/callback';
const PENDING_CONNECTION_KEY = 'pending_social_connection';

function readCallback(url: string): { code?: string; state?: string; error?: string; description?: string } | null {
  if (!url.startsWith(MOBILE_REDIRECT_URI)) return null;
  const queryString = url.split('?')[1] || '';
  const query = new URLSearchParams(queryString);
  return {
    code: query.get('code') || undefined,
    state: query.get('state') || undefined,
    error: query.get('error') || undefined,
    description: query.get('error_description') || undefined,
  };
}

export default function SocialAccountsScreen() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<Provider | null>(null);
  const [showBlueskyForm, setShowBlueskyForm] = useState(false);
  const [blueskyHandle, setBlueskyHandle] = useState('');
  const [blueskyAppPassword, setBlueskyAppPassword] = useState('');

  const loadConnections = useCallback(async () => {
    try {
      const result = await apiClient.request<{ connections: Connection[] }>(
        `/api/mobile/social/connections?refresh=${Date.now()}`,
      );
      setConnections(result.connections || []);
    } catch (error) {
      Alert.alert('Could not load accounts', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const completeOAuth = useCallback(async (url: string) => {
    const callback = readCallback(url);
    if (!callback) return;

    const pendingRaw = await SecureStore.getItemAsync(PENDING_CONNECTION_KEY);
    await SecureStore.deleteItemAsync(PENDING_CONNECTION_KEY);
    const pending = pendingRaw ? JSON.parse(pendingRaw) as { platform?: Provider; state?: string } : null;

    if (!pending?.platform || pending.platform === 'bluesky' || !callback.state || !callback.code) {
      if (callback.error) {
        Alert.alert('Connection cancelled', callback.description || callback.error);
      } else {
        Alert.alert('Connection failed', 'The authorization result could not be verified. Please try again.');
      }
      return;
    }

    if (pending.state !== callback.state) {
      Alert.alert('Connection failed', 'The authorization result did not match the connection you started.');
      return;
    }

    setWorking(pending.platform);
    try {
      const result = await apiClient.post<{ syncWarning?: boolean }>(
        `/api/mobile/oauth/${pending.platform}/callback`,
        { code: callback.code, state: callback.state },
      );
      await loadConnections();
      Alert.alert(
        'Account connected',
        result.syncWarning
          ? 'Your account is connected. The first sync will retry shortly.'
          : 'Your latest content has been synced.',
      );
    } catch (error) {
      Alert.alert('Connection failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setWorking(null);
    }
  }, [loadConnections]);

  useEffect(() => {
    void loadConnections();
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void completeOAuth(url);
    });
    void Linking.getInitialURL().then((url) => {
      if (url) void completeOAuth(url);
    });
    return () => subscription.remove();
  }, [completeOAuth, loadConnections]);

  const startOAuth = async (platform: Exclude<Provider, 'bluesky'>) => {
    setWorking(platform);
    try {
      const result = await apiClient.post<{ authUrl: string; state: string }>(
        `/api/mobile/oauth/${platform}/init`,
        { redirectUri: MOBILE_REDIRECT_URI },
      );
      await SecureStore.setItemAsync(
        PENDING_CONNECTION_KEY,
        JSON.stringify({ platform, state: result.state }),
      );
      await Linking.openURL(result.authUrl);
    } catch (error) {
      Alert.alert('Connection unavailable', error instanceof Error ? error.message : 'Please try again.');
      setWorking(null);
    }
  };

  const connectBluesky = async () => {
    if (!blueskyHandle.trim() || !blueskyAppPassword) {
      Alert.alert('Missing details', 'Enter your Bluesky handle and an app password.');
      return;
    }

    setWorking('bluesky');
    try {
      const result = await apiClient.post<{ syncWarning?: boolean }>('/api/mobile/social/bluesky/connect', {
        handle: blueskyHandle.trim(),
        appPassword: blueskyAppPassword,
      });
      setBlueskyAppPassword('');
      setShowBlueskyForm(false);
      await loadConnections();
      Alert.alert(
        'Bluesky connected',
        result.syncWarning ? 'Your account is connected. The first sync will retry shortly.' : 'Your latest posts have been synced.',
      );
    } catch (error) {
      Alert.alert('Connection failed', error instanceof Error ? error.message : 'Check your handle and app password.');
    } finally {
      setWorking(null);
    }
  };

  const disconnect = (connection: Connection) => {
    Alert.alert(
      `Disconnect ${connection.platform}?`,
      'Imported content from this account will be removed from MyKliq.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setWorking(connection.platform);
            try {
              await apiClient.request(`/api/mobile/oauth/${connection.platform}/disconnect`, { method: 'DELETE' });
              await loadConnections();
            } catch (error) {
              Alert.alert('Could not disconnect', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setWorking(null);
            }
          },
        },
      ],
    );
  };

  const connectionFor = (platform: Provider) => connections.find((connection) => connection.platform === platform && connection.isActive);

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4" contentContainerStyle={{ paddingBottom: 36 }}>
      <Text className="text-foreground text-2xl font-bold">Social accounts</Text>
      <Text className="text-muted-foreground mt-2 mb-6">
        Connect your own accounts. Your imported content is private to your MyKliq profile.
      </Text>

      {loading ? (
        <ActivityIndicator color="#00FF00" size="large" />
      ) : (
        <>
          {OAUTH_PROVIDERS.map((provider) => {
            const connection = connectionFor(provider.id);
            const isWorking = working === provider.id;
            return (
              <View key={provider.id} className="bg-card border border-border rounded-xl p-4 mb-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <Text className="text-foreground text-lg font-semibold">{provider.label}</Text>
                    <Text className="text-muted-foreground mt-1">{connection ? `Connected as ${connection.platformUsername}` : provider.detail}</Text>
                  </View>
                  {isWorking ? <ActivityIndicator color="#00FF00" /> : null}
                </View>
                <TouchableOpacity
                  className={`rounded-lg py-3 mt-4 ${connection ? 'bg-destructive' : 'bg-primary'}`}
                  onPress={() => connection ? disconnect(connection) : startOAuth(provider.id)}
                  disabled={isWorking}
                >
                  <Text className="text-center text-primary-foreground font-semibold">
                    {connection ? 'Disconnect' : `Connect ${provider.label}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View className="bg-card border border-border rounded-xl p-4 mb-3">
            <Text className="text-foreground text-lg font-semibold">Bluesky</Text>
            <Text className="text-muted-foreground mt-1">
              {connectionFor('bluesky') ? `Connected as ${connectionFor('bluesky')?.platformUsername}` : 'Connect with a Bluesky app password, not your main password.'}
            </Text>
            {showBlueskyForm && !connectionFor('bluesky') ? (
              <View className="mt-4">
                <TextInput
                  className="bg-background border border-border rounded-lg px-3 py-3 text-foreground mb-3"
                  placeholder="handle.bsky.social"
                  placeholderTextColor="#777"
                  autoCapitalize="none"
                  value={blueskyHandle}
                  onChangeText={setBlueskyHandle}
                />
                <TextInput
                  className="bg-background border border-border rounded-lg px-3 py-3 text-foreground mb-3"
                  placeholder="Bluesky app password"
                  placeholderTextColor="#777"
                  secureTextEntry
                  autoCapitalize="none"
                  value={blueskyAppPassword}
                  onChangeText={setBlueskyAppPassword}
                />
              </View>
            ) : null}
            <TouchableOpacity
              className={`rounded-lg py-3 mt-4 ${connectionFor('bluesky') ? 'bg-destructive' : 'bg-primary'}`}
              onPress={() => {
                const connection = connectionFor('bluesky');
                if (connection) disconnect(connection);
                else if (showBlueskyForm) void connectBluesky();
                else setShowBlueskyForm(true);
              }}
              disabled={working === 'bluesky'}
            >
              <Text className="text-center text-primary-foreground font-semibold">
                {working === 'bluesky'
                  ? 'Connecting…'
                  : connectionFor('bluesky')
                    ? 'Disconnect'
                    : showBlueskyForm
                      ? 'Connect Bluesky'
                      : 'Connect Bluesky'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}