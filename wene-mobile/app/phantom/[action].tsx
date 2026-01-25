import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRecipientStore } from '../../src/store/recipientStore';
import { usePhantomStore } from '../../src/store/phantomStore';
import {
  parsePhantomRedirect,
  decryptPhantomResponse,
  handleRedirect as handleSignTransactionRedirect,
} from '../../src/utils/phantom';
import { AppText, Loading } from '../../src/ui/components';
import { theme } from '../../src/ui/theme';

export default function PhantomRedirectScreen() {
  const { action } = useLocalSearchParams<{ action: string }>();
  const router = useRouter();
  const { setWalletPubkey, setPhantomSession, setState, setError, campaignId } = useRecipientStore();
  const { dappSecretKey, loadKeyPair, setPhantomEncryptionPublicKey } = usePhantomStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (action !== 'connect' && action !== 'signTransaction') {
      return;
    }

    let listener: ReturnType<typeof Linking.addEventListener> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const processConnectUrl = async (url: string, secretKey: Uint8Array) => {
      try {
        const parsed = parsePhantomRedirect(url);
        if (!parsed) {
          throw new Error('Invalid redirect URL');
        }

        // URLからphantom_encryption_public_keyを取得
        const urlObj = new URL(url);
        const phantomPublicKey = urlObj.searchParams.get('phantom_encryption_public_key');
        if (!phantomPublicKey) {
          throw new Error('Phantom public key not found');
        }

        const result = decryptPhantomResponse(
          parsed.data,
          parsed.nonce,
          secretKey,
          phantomPublicKey
        );

        if (!result) {
          throw new Error('Failed to decrypt Phantom response');
        }

        setWalletPubkey(result.publicKey);
        setPhantomSession(result.session);
        setPhantomEncryptionPublicKey(phantomPublicKey);
        setState('Connected');
        setStatus('success');

        // 受給画面に戻る
        setTimeout(() => {
          if (campaignId) {
            router.replace(`/r/${campaignId}` as any);
          } else {
            router.replace('/');
          }
        }, 500);
      } catch (error) {
        setStatus('error');
        const errorMsg = error instanceof Error ? error.message : 'Failed to process Phantom response';
        setErrorMessage(errorMsg);
        setError(errorMsg);
      }
    };

    const processSignTransactionUrl = (url: string, secretKey: Uint8Array) => {
      const result = handleSignTransactionRedirect(url, secretKey);
      if (result.ok) {
        setStatus('success');
        // 遷移は Receive の handleClaim 側（sendSignedTx → replace /wallet）で行う
        if (campaignId) {
          setTimeout(() => router.replace(`/r/${campaignId}` as any), 50);
        }
      } else {
        setStatus('error');
        setErrorMessage(result.error);
        setError(result.error);
      }
    };

    const run = async () => {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'phantom/[action].tsx:95',message:'phantom route run start',data:{action,platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        const keyPair = await loadKeyPair();
        if (!keyPair || !dappSecretKey) {
          throw new Error('Encryption key pair not found');
        }

        let url: string | null = await Linking.getInitialURL();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'phantom/[action].tsx:102',message:'getInitialURL result',data:{hasUrl:url!==null,url:url?.substring(0,50)||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        if (action === 'signTransaction') {
          if (url) {
            processSignTransactionUrl(url, dappSecretKey);
            return;
          }
          listener = Linking.addEventListener('url', (event) => {
            if (listener) {
              listener.remove();
              listener = null;
            }
            if (timeoutId) clearTimeout(timeoutId);
            processSignTransactionUrl(event.url, dappSecretKey);
          });
          timeoutId = setTimeout(() => {
            if (listener) listener.remove();
            setStatus('error');
            const msg = 'Phantomからのリダイレクトがタイムアウトしました';
            setErrorMessage(msg);
            setError(msg);
          }, 60000);
          return;
        }

        if (action === 'connect') {
          if (!url) {
            listener = Linking.addEventListener('url', async (event) => {
              if (listener) {
                listener.remove();
                listener = null;
              }
              if (timeoutId) clearTimeout(timeoutId);
              await processConnectUrl(event.url, dappSecretKey);
            });
            timeoutId = setTimeout(() => {
              if (listener) listener.remove();
              setStatus((s) => {
                if (s === 'processing') {
                  const msg = 'Phantomからのリダイレクトがタイムアウトしました';
                  setError(msg);
                  setErrorMessage(msg);
                  return 'error';
                }
                return s;
              });
            }, 30000);
            return;
          }
          await processConnectUrl(url, dappSecretKey);
        }
      } catch (error) {
        setStatus('error');
        const msg = error instanceof Error ? error.message : 'Phantom処理に失敗しました';
        setErrorMessage(msg);
        setError(msg);
      }
    };

    run();

    return () => {
      if (listener) listener.remove();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [action, dappSecretKey, loadKeyPair, setWalletPubkey, setPhantomSession, setPhantomEncryptionPublicKey, setState, setError, campaignId, router]);

  const loadingMessage =
    action === 'signTransaction' ? '署名を待っています...' : 'Phantomから戻ってきています...';

  return (
    <View style={styles.container}>
      {status === 'processing' && <Loading message={loadingMessage} />}
      {status === 'error' && (
        <View style={styles.errorContainer}>
          <AppText variant="h3" style={styles.errorTitle}>
            {action === 'signTransaction' ? '署名エラー' : '接続エラー'}
          </AppText>
          <AppText variant="body" style={styles.errorMessage}>
            {errorMessage || 'Phantomへの接続に失敗しました'}
          </AppText>
        </View>
      )}
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
  errorContainer: {
    alignItems: 'center',
  },
  errorTitle: {
    marginBottom: theme.spacing.md,
  },
  errorMessage: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
