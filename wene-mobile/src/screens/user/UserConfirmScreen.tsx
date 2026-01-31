import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Button, Card } from '../../ui/components';
import { theme } from '../../ui/theme';
import { setStarted } from '../../data/participationStore';

export const UserConfirmScreen: React.FC = () => {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const targetEventId = eventId ?? 'evt-001';

  useEffect(() => {
    if (!targetEventId) return;
    setStarted(targetEventId).catch(() => {});
  }, [targetEventId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <AppText variant="h2" style={styles.title}>
          内容を確認
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          参加内容を確認して参加してください
        </AppText>

        <Card style={styles.card}>
          <AppText variant="h3">地域清掃ボランティア</AppText>
          <AppText variant="caption">2026/02/02 09:00-10:30</AppText>
          <AppText variant="caption">主催: 生徒会</AppText>
        </Card>

        <Button title="参加する" onPress={() => router.push(`/u/success?eventId=${targetEventId}` as any)} />
        <Button
          title="戻る"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.secondaryButton}
        />

        <AppText variant="caption" style={styles.errorText}>
          受付時間外です。担当の先生に確認してください。
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
  card: {
    marginBottom: theme.spacing.lg,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});
