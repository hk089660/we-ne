/**
 * DEV専用: @solana/web3.js スモークテスト
 * どの API/依存で落ちているかを確定するため。Phantom/Claim 導線とは独立。
 * __DEV__ でのみ表示される導線からアクセスすること。
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PublicKey,
  Keypair,
  Transaction,
  Connection,
  SystemProgram,
} from '@solana/web3.js';
import { AppText, Button } from '../../ui/components';
import { theme } from '../../ui/theme';

type StepId = 'A' | 'B' | 'C' | 'D' | 'E';
type StepStatus = 'idle' | 'running' | 'ok' | 'fail';

interface StepResult {
  step: StepId;
  status: StepStatus;
  errorPreview?: string; // 先頭100文字（コピー用）
}

const STEP_LABELS: Record<StepId, string> = {
  A: "new PublicKey('11111...')",
  B: 'Keypair.generate()',
  C: 'Transaction + feePayer + recentBlockhash + serialize',
  D: "Connection('...').getLatestBlockhash()",
  E: 'SystemProgram.transfer + tx.add(ix) + serialize',
};

function runStepA(): void {
  new PublicKey('11111111111111111111111111111111');
}

function runStepB(): Keypair {
  return Keypair.generate();
}

function runStepC(): Buffer {
  const tx = new Transaction();
  const feePayer = new PublicKey('11111111111111111111111111111111');
  tx.feePayer = feePayer;
  tx.recentBlockhash = 'EtW9ABQYJV7dNk1wgWXzYaEPp5TcyQxsiJEDHQA2DXP';
  return tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
}

async function runStepD(): Promise<{ blockhash: string }> {
  const conn = new Connection('https://api.devnet.solana.com');
  return conn.getLatestBlockhash();
}

function runStepE(): Buffer {
  const tx = new Transaction();
  const from = new PublicKey('11111111111111111111111111111111');
  const to = new PublicKey('11111111111111111111111111111111');
  tx.feePayer = from;
  tx.recentBlockhash = 'EtW9ABQYJV7dNk1wgWXzYaEPp5TcyQxsiJEDHQA2DXP';
  const ix = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: 0,
  });
  tx.add(ix);
  return tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
}

function errorPreview(e: unknown): string {
  const s = e instanceof Error ? e.message : String(e);
  return s.slice(0, 100);
}

export const Web3SmokeTestScreen: React.FC = () => {
  const router = useRouter();
  const [results, setResults] = useState<StepResult[]>([]);
  const [running, setRunning] = useState(false);

  const runAll = async () => {
    setRunning(true);
    const next: StepResult[] = [];

    const run = async (step: StepId, fn: () => unknown | Promise<unknown>) => {
      try {
        await Promise.resolve(fn());
        next.push({ step, status: 'ok' });
        return true;
      } catch (e) {
        const preview = errorPreview(e);
        next.push({ step, status: 'fail', errorPreview: preview });
        console.error('[WEB3_SMOKE] step=' + step + ' error obj', e);
        console.error('[WEB3_SMOKE] step=' + step + ' error stack', (e as Error)?.stack);
        return false;
      }
    };

    setResults([]);

    let ok = await run('A', runStepA);
    setResults([...next]);
    if (!ok) {
      setRunning(false);
      return;
    }

    ok = await run('B', runStepB);
    setResults([...next]);
    if (!ok) {
      setRunning(false);
      return;
    }

    ok = await run('C', runStepC);
    setResults([...next]);
    if (!ok) {
      setRunning(false);
      return;
    }

    ok = await run('D', runStepD);
    setResults([...next]);
    if (!ok) {
      setRunning(false);
      return;
    }

    ok = await run('E', runStepE);
    setResults([...next]);
    setRunning(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <AppText variant="caption" style={styles.backText}>
            ← 戻る
          </AppText>
        </TouchableOpacity>
        <AppText variant="h3" style={styles.title}>
          Web3 Smoke Test
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="small" style={styles.hint}>
          どの Step で落ちるかで原因を特定。Phantom/Claim とは独立。
        </AppText>
        <Button
          title={running ? '実行中...' : 'Run all (A→E)'}
          onPress={runAll}
          variant="primary"
          disabled={running}
          style={styles.runBtn}
        />
        {running ? (
          <ActivityIndicator size="small" style={styles.loader} />
        ) : null}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {results.map((r) => (
            <View key={r.step} style={styles.row}>
              <AppText variant="caption" style={styles.stepLabel}>
                Step {r.step}: {STEP_LABELS[r.step]}
              </AppText>
              <AppText
                variant="small"
                style={r.status === 'ok' ? styles.statusOk : styles.statusFail}
              >
                {r.status === 'ok' ? 'OK' : 'FAIL'}
              </AppText>
              {r.errorPreview != null ? (
                <Text style={styles.errorText} selectable>
                  {r.errorPreview}
                </Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    marginRight: theme.spacing.md,
  },
  backText: {
    color: theme.colors.textSecondary,
  },
  title: {
    color: theme.colors.text,
  },
  body: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  hint: {
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.md,
  },
  runBtn: {
    marginBottom: theme.spacing.sm,
  },
  loader: {
    marginBottom: theme.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  row: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray50,
    borderRadius: theme.radius.sm,
  },
  stepLabel: {
    color: theme.colors.text,
    marginBottom: 2,
  },
  statusOk: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  statusFail: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
});
