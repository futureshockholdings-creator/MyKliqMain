import React from 'react';
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`bg-card rounded-lg border border-border shadow-sm ${className}`}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <View className={`p-4 border-b border-border ${className}`}>
      {children}
    </View>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <View className={`p-4 ${className}`}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <View className={`p-4 border-t border-border ${className}`}>
      {children}
    </View>
  );
}
