import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Button, Card } from '../../ui/components';
import { theme } from '../../ui/theme';

export const UserScanScreen: React.FC = () => {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const targetEventId = eventId ?? 'evt-001';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <AppText variant="h2" style={styles.title}>
          QRを読み取る
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          受付のQRを読み取ってください
        </AppText>

        <Card style={styles.cameraBox}>
          <AppText variant="caption" style={styles.cameraText}>
            カメラプレビュー（モック）
          </AppText>
        </Card>

        <Button title="読み取り開始" onPress={() => router.push(`/u/confirm?eventId=${targetEventId}` as any)} />
        <Button
          title="もう一度読み取る"
          variant="secondary"
          onPress={() => router.replace(`/u/scan?eventId=${targetEventId}` as any)}
          style={styles.secondaryButton}
        />

        <AppText variant="caption" style={styles.errorText}>
          QRが期限切れです。受付のQRをもう一度読み取ってください。
        </AppText>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  cameraBox: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  cameraText: {
    color: theme.colors.textTertiary,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});
