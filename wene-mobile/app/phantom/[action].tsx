import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Loading } from '../../src/ui/components';
import { theme } from '../../src/ui/theme';

/**
 * Phantom redirect 画面。
 * ネイティブでは deeplink は _layout の setupPhantomDeeplinkListener で受け取り、
 * この画面には遷移しない。Web で /phantom/connect 等に直接来た場合のフォールバック表示。
 */
export default function PhantomRedirectScreen() {
  const { action } = useLocalSearchParams<{ action: string }>();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/');
    }, 3000);
    return () => clearTimeout(t);
  }, [router]);

  const loadingMessage =
    action === 'signTransaction' ? '署名を待っています...' : 'Phantomから戻ってきています...';

  return (
    <View style={styles.container}>
      <Loading message={loadingMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
});
