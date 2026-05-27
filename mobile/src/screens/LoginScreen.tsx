import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Linking } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Error', 'Please enter both phone number and password');
      return;
    }

    setLoading(true);
    try {
      await login(phoneNumber, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid phone number or password');
    } finally {
      setLoading(false);
    }
  };

  const openTerms = () => {
    Linking.openURL('https://mykliq.app/terms-of-use').catch(() => {
      Alert.alert('Error', 'Unable to open Terms of Use. Please visit mykliq.app/terms-of-use in your browser.');
    });
  };

  const openPrivacy = () => {
    Linking.openURL('https://mykliq.app/privacy-policy').catch(() => {
      Alert.alert('Error', 'Unable to open Privacy Policy. Please visit mykliq.app/privacy-policy in your browser.');
    });
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-background" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-8">
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-primary mb-2">
            Welcome to MyKliq
          </Text>
          <Text className="text-base text-muted-foreground text-center">
            Connect with your closest friends
          </Text>
        </View>

        <View className="mb-6">
          <Input
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            autoCapitalize="none"
            className="mb-4"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            className="mb-6"
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            size="lg"
          />
        </View>

        <View className="items-center mb-4">
          <Text className="text-muted-foreground text-xs text-center leading-5">
            By continuing you agree to our{' '}
            <Text
              className="text-primary underline"
              onPress={openTerms}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="Terms of Use"
            >
              Terms of Use
            </Text>
            {' '}and{' '}
            <Text
              className="text-primary underline"
              onPress={openPrivacy}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy"
            >
              Privacy Policy
            </Text>
          </Text>
        </View>

        <Text className="text-muted-foreground text-center text-xs">
          MyKliq Mobile v1.0
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
