import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const baseClasses = 'rounded-lg flex-row items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border-2 border-primary bg-transparent',
    ghost: 'bg-transparent',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };
  
  const textVariantClasses = {
    primary: 'text-primary-foreground font-semibold',
    secondary: 'text-secondary-foreground font-semibold',
    outline: 'text-primary font-semibold',
    ghost: 'text-primary font-semibold',
  };
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const disabledClass = (disabled || loading) ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClass} ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#000' : '#fff'} />
      ) : (
        <Text className={`${textVariantClasses[variant]} ${textSizeClasses[size]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
