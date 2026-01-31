import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { AppText } from '../../src/ui/components';
import { theme } from '../../src/ui/theme';

/**
 * Web で表示。生徒用は専用アプリ利用を案内（Webは管理者・補助用）
 */
function WebOnlyBanner() {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={styles.banner}>
      <AppText variant="caption" style={styles.bannerText}>
        生徒用は専用アプリ（iOS TestFlight / Android APK）をご利用ください。{'\n'}Webは管理者・補助用です。
      </AppText>
    </View>
  );
}

export default function ULayout() {
  return (
    <View style={styles.container}>
      <WebOnlyBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.gray100,
  },
  bannerText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
