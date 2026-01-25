import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

type PillVariant = 'active' | 'expired' | 'error';

interface PillProps {
  label: string;
  variant?: PillVariant;
  style?: ViewStyle;
}

export const Pill: React.FC<PillProps> = ({ label, variant = 'active', style }) => {
  return (
    <View style={[styles.pill, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    alignSelf: 'flex-start',
  },
  active: {
    backgroundColor: theme.colors.black,
  },
  expired: {
    backgroundColor: theme.colors.gray200,
  },
  error: {
    backgroundColor: theme.colors.black,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: theme.colors.white,
  },
  expiredText: {
    color: theme.colors.textSecondary,
  },
  errorText: {
    color: theme.colors.white,
  },
});
