import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert } from 'react-native';
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

        <View className="mb-10">
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

        <Text className="text-muted-foreground text-center text-xs">
          MyKliq Mobile v1.0
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}