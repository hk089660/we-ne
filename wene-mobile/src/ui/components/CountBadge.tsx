import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../theme';

interface CountBadgeProps {
  value: number;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  value,
  backgroundColor = theme.colors.gray100,
  textColor = theme.colors.textSecondary,
  style,
}) => {
  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <AppText variant="small" style={[styles.text, { color: textColor }] as unknown as TextStyle}>
        {value}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 24,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  text: {
  },
});
