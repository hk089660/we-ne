import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../theme';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodyLarge' | 'caption' | 'small';

interface AppTextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  style?: TextStyle;
  numberOfLines?: number;
}

export const AppText: React.FC<AppTextProps> = ({
  children,
  variant = 'body',
  style,
  numberOfLines,
}) => {
  return (
    <Text
      style={[styles.base, theme.typography[variant], style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    // ベーススタイル
  },
});
