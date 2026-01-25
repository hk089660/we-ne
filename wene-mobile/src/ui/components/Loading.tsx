import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { AppText } from './AppText';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({ message, size = 'small' }) => {
  if (message) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={size} color={theme.colors.black} />
        <AppText variant="caption" style={styles.message}>
          {message}
        </AppText>
      </View>
    );
  }

  // シンプルな "..." 表示
  return (
    <View style={styles.simpleContainer}>
      <AppText variant="body" style={styles.dots}>
        ...
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  simpleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  message: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  dots: {
    color: theme.colors.textSecondary,
  },
});
