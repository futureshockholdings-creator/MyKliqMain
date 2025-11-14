import React from 'react';
import { TextInput, View, Text } from 'react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  label?: string;
  error?: string;
  className?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  label,
  error,
  className = '',
}: InputProps) {
  return (
    <View className={`${className}`}>
      {label && (
        <Text className="text-foreground font-medium mb-2">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        className={`bg-input border border-border rounded-lg px-4 py-3 text-foreground ${
          error ? 'border-destructive' : ''
        }`}
      />
      {error && (
        <Text className="text-destructive text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
