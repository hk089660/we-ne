import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:4',message:'importing @solana/web3.js',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
// #endregion

import { PublicKey } from '@solana/web3.js';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:8',message:'@solana/web3.js imported',data:{hasPublicKey:typeof PublicKey!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
// #endregion
import { useRecipientStore } from '../store/recipientStore';
import { usePhantomStore } from '../store/phantomStore';
import { getGrantByCampaignId } from '../api/getGrant';
import type { Grant } from '../types/grant';
import { AppText, Button, Card, Pill } from '../ui/components';
import { theme } from '../ui/theme';
import { buildClaimTx } from '../solana/txBuilders';
import { signTransaction, initiatePhantomConnect, buildPhantomConnectUrl } from '../utils/phantom';
import { sendSignedTx } from '../solana/sendTx';

export const ReceiveScreen: React.FC = () => {
  const { campaignId, code } = useLocalSearchParams<{
    campaignId: string;
    code?: string;
  }>();
  const router = useRouter();
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:20',message:'ReceiveScreen mounted',data:{platform:Platform.OS,campaignId,code,hasCampaignId:!!campaignId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [campaignId, code]);
  // #endregion
  const {
    state,
    lastError,
    isClaimed,
    walletPubkey,
    phantomSession,
    lastSignature,
    setCampaign,
    setState,
    setError,
    setLastSignature,
    checkClaimed,
    markAsClaimed,
  } = useRecipientStore();
  const {
    dappEncryptionPublicKey,
    dappSecretKey,
    phantomEncryptionPublicKey,
    loadKeyPair,
    getOrCreateKeyPair,
    saveKeyPair,
  } = usePhantomStore();
  const [showDetails, setShowDetails] = useState(false);
  const [grant, setGrant] = useState<Grant | null>(null);
  const [grantNotFound, setGrantNotFound] = useState(false);
  const [grantLoading, setGrantLoading] = useState(true);
  const [txDebugInfo, setTxDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      setCampaign(campaignId, code);
      checkClaimed(campaignId, walletPubkey);
    }
  }, [campaignId, code, walletPubkey, setCampaign, checkClaimed]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:57',message:'keypair init start',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const init = async () => {
      try {
        const kp = await loadKeyPair();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:62',message:'loadKeyPair result',data:{hasKeyPair:kp!==null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        if (!kp) {
          const created = getOrCreateKeyPair();
          await saveKeyPair(created);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:67',message:'keypair created and saved',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:72',message:'keypair init error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }
    };
    init();
  }, [loadKeyPair, getOrCreateKeyPair, saveKeyPair]);

  useEffect(() => {
    if (!campaignId) {
      setGrant(null);
      setGrantNotFound(false);
      setGrantLoading(false);
      return;
    }
    setGrantLoading(true);
    setGrantNotFound(false);
    getGrantByCampaignId(campaignId)
      .then((g) => {
        if (g) {
          setGrant(g);
          setGrantNotFound(false);
        } else {
          setGrant(null);
          setGrantNotFound(true);
        }
      })
      .catch(() => {
        setGrant(null);
        setGrantNotFound(true);
      })
      .finally(() => setGrantLoading(false));
  }, [campaignId]);

  const getButtonTitle = (): string => {
    switch (state) {
      case 'Idle':
        return 'このクレジットを受け取る';
      case 'Connecting':
        return 'Phantomを開いています…';
      case 'Claiming':
        return '処理中…';
      case 'Error':
        return '再試行';
      default:
        return '受け取る';
    }
  };

  const handleConnect = async () => {
    if (!dappEncryptionPublicKey || !dappSecretKey) return;
    setState('Connecting');
    try {
      // connectUrlを生成（デバッグ用）
      const connectUrl = buildPhantomConnectUrl({
        dappEncryptionPublicKey,
        redirectLink: 'wene://phantom/connect',
        cluster: 'devnet',
        appUrl: 'https://wene.app',
      });
      
      // デバッグ: connectUrlをログ出力
      console.log('[handleConnect] connectUrl:', connectUrl);
      
      // デバッグ: 先頭だけToastで表示（空文字/undefined対策）
      if (Platform.OS === 'android') {
        const { ToastAndroid } = require('react-native');
        const urlPreview = connectUrl && connectUrl.length > 0 
          ? connectUrl.substring(0, 30) + '...' 
          : 'URL未設定';
        ToastAndroid.show(`URL: ${urlPreview}`, ToastAndroid.SHORT);
      }
      
      await initiatePhantomConnect(
        dappEncryptionPublicKey,
        dappSecretKey,
        'wene://phantom/connect',
        'devnet',
        'https://wene.app'
      );
    } catch (e) {
      setState('Idle');
      setError(e instanceof Error ? e.message : 'Phantomを開けません');
    }
  };

  const handleClaim = async () => {
    if (state === 'Error') {
      setState('Idle');
      setTxDebugInfo(null);
      return;
    }
    
    // 受給済みの場合はウォレット画面へ遷移
    if (isClaimed || state === 'Claimed') {
      router.replace('/wallet' as any);
      return;
    }
    
    if (state !== 'Idle') return;

    setState('Claiming');
    setTxDebugInfo(null);

    if (!walletPubkey || !phantomSession || !phantomEncryptionPublicKey || !dappEncryptionPublicKey || !dappSecretKey) {
      setError('Phantomに接続してください');
      setState('Idle');
      return;
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:175',message:'handleClaim: before buildClaimTx',data:{platform:Platform.OS,campaignId,hasWalletPubkey:!!walletPubkey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const recipientPubkey = new PublicKey(walletPubkey);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:179',message:'PublicKey created',data:{publicKey:recipientPubkey.toBase58().substring(0,8)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const result = await buildClaimTx({
        campaignId: campaignId || '',
        code,
        recipientPubkey,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReceiveScreen.tsx:187',message:'buildClaimTx success',data:{instructionCount:result.meta.instructionCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      const debugLines = [
        `Fee Payer: ${result.meta.feePayer?.toBase58() || 'N/A'}`,
        `Recent Blockhash: ${result.meta.recentBlockhash ? '✓' : '✗'}`,
        `Instructions: ${result.meta.instructionCount}`,
      ];
      setTxDebugInfo(debugLines.join('\n'));

      const signed = await signTransaction({
        tx: result.tx,
        session: phantomSession,
        dappEncryptionPublicKey,
        dappSecretKey,
        phantomEncryptionPublicKey,
        redirectLink: 'wene://phantom/signTransaction',
        cluster: 'devnet',
        appUrl: 'https://wene.app',
      });

      const signature = await sendSignedTx(signed);
      setLastSignature(signature);
      await markAsClaimed(campaignId || '', walletPubkey);
      setState('Claimed');
      router.replace('/wallet' as any);
    } catch (error) {
      console.error('Claim failed:', error);
      setError(error instanceof Error ? error.message : '受け取り処理に失敗しました');
    }
  };

  const getStatePill = () => {
    switch (state) {
      case 'Claimed':
        return <Pill label="受給済み" variant="active" />;
      case 'Expired':
        return <Pill label="期限切れ" variant="expired" />;
      case 'Error':
        return <Pill label="エラー" variant="error" />;
      default:
        return null;
    }
  };

  if (grantLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <AppText variant="body" style={styles.secondaryText}>
            読み込み中…
          </AppText>
        </View>
      </View>
    );
  }

  if (grantNotFound) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <AppText variant="h3" style={styles.title}>
            見つかりません
          </AppText>
          <AppText variant="body" style={styles.secondaryText}>
            このクレジットは見つかりません。
          </AppText>
          <Button title="ホームに戻る" onPress={() => router.replace('/')} variant="secondary" style={styles.claimedButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <AppText variant="h2" style={styles.title}>
            {grant ? grant.title : 'クレジットを受け取る'}
          </AppText>

          {getStatePill() && <View style={styles.pillContainer}>{getStatePill()}</View>}

          <Card style={styles.mainCard}>
            <AppText variant="body" style={styles.cardDescription}>
              {grant ? grant.description : 'このリンクから支援クレジットを受け取ることができます。'}
            </AppText>
            {grant?.issuerName && (
              <AppText variant="caption" style={styles.issuerName}>
                {grant.issuerName}
              </AppText>
            )}

            <TouchableOpacity
              onPress={() => setShowDetails(!showDetails)}
              style={styles.detailsToggle}
            >
              <AppText variant="caption" style={styles.detailsToggleText}>
                {showDetails ? '詳細を閉じる' : '詳細を表示'}
              </AppText>
            </TouchableOpacity>

            {showDetails && (
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <AppText variant="caption" style={styles.detailLabel}>
                    Campaign ID
                  </AppText>
                  <AppText variant="body" style={styles.detailValue}>
                    {campaignId || 'N/A'}
                  </AppText>
                </View>
                {code && (
                  <View style={styles.detailRow}>
                    <AppText variant="caption" style={styles.detailLabel}>
                      Code
                    </AppText>
                    <AppText variant="body" style={styles.detailValue}>
                      {code}
                    </AppText>
                  </View>
                )}
              </View>
            )}
          </Card>

          {lastError && state === 'Error' && (
            <Card style={styles.errorCard}>
              <AppText variant="caption" style={styles.errorText}>
                {lastError}
              </AppText>
            </Card>
          )}

          {txDebugInfo && state === 'Claiming' && (
            <Card style={styles.debugCard}>
              <AppText variant="caption" style={styles.debugLabel}>
                TX構築情報（デバッグ）
              </AppText>
              <AppText variant="small" style={styles.debugText}>
                {txDebugInfo}
              </AppText>
            </Card>
          )}

          {(!walletPubkey || !phantomSession || !phantomEncryptionPublicKey) && !(isClaimed || state === 'Claimed') ? (
            <Card style={styles.debugCard}>
              <AppText variant="caption" style={styles.debugLabel}>
                Phantomに接続してください
              </AppText>
              <AppText variant="small" style={styles.debugText}>
                接続後に「このクレジットを受け取る」で受給できます。
              </AppText>
              <Button
                title={
                  state === 'Connecting'
                    ? '接続中…'
                    : walletPubkey
                    ? '接続済み'
                    : 'Phantomを開いて接続'
                }
                onPress={handleConnect}
                variant="secondary"
                loading={state === 'Connecting'}
                disabled={state === 'Connecting' || !!walletPubkey}
                style={styles.claimButton}
              />
            </Card>
          ) : null}

          {isClaimed || state === 'Claimed' ? (
            <View style={styles.claimedActions}>
              {lastSignature ? (
                <Card style={styles.debugCard}>
                  <AppText variant="caption" style={styles.debugLabel}>
                    署名 (devnet)
                  </AppText>
                  <AppText variant="small" style={styles.debugText} numberOfLines={2}>
                    {lastSignature}
                  </AppText>
                </Card>
              ) : null}
              <Button
                title="ウォレットを見る"
                onPress={() => router.replace('/wallet' as any)}
                variant="primary"
                style={styles.claimedButton}
              />
              <Button
                title="ホームに戻る"
                onPress={() => router.replace('/')}
                variant="secondary"
                style={styles.claimedButton}
              />
            </View>
          ) : (
            <Button
              title={getButtonTitle()}
              onPress={handleClaim}
              variant="primary"
              loading={state === 'Claiming' || state === 'Connecting'}
              disabled={state === 'Expired' || state === 'Claiming' || state === 'Connecting'}
              style={styles.claimButton}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.lg,
  },
  pillContainer: {
    marginBottom: theme.spacing.md,
  },
  mainCard: {
    marginBottom: theme.spacing.lg,
  },
  cardDescription: {
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  detailsToggle: {
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  detailsToggleText: {
    color: theme.colors.textTertiary,
    textDecorationLine: 'underline',
  },
  details: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  detailRow: {
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    color: theme.colors.text,
  },
  claimButton: {
    marginTop: theme.spacing.md,
  },
  errorCard: {
    backgroundColor: theme.colors.gray50,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
  },
  claimedActions: {
    marginTop: theme.spacing.md,
  },
  claimedButton: {
    marginBottom: theme.spacing.sm,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  secondaryText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  issuerName: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textTertiary,
  },
  debugCard: {
    backgroundColor: theme.colors.gray50,
    marginBottom: theme.spacing.md,
  },
  debugLabel: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  debugText: {
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 14,
  },
});
