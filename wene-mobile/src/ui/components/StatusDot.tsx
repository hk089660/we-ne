import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface StatusDotProps {
  color: string;
  size?: number;
  style?: ViewStyle;
}

export const StatusDot: React.FC<StatusDotProps> = ({ color, size = 10, style }) => {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    marginRight: 8,
  },
});
