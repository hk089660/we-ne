import '../src/polyfills';
import { Stack } from 'expo-router';
import { Platform, Linking, ToastAndroid } from 'react-native';
import { useEffect, useRef, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePhantomStore } from '../src/store/phantomStore';
import { useRecipientStore } from '../src/store/recipientStore';
import { handlePhantomConnectRedirect, handleRedirect } from '../src/utils/phantom';

export default function RootLayout() {
  const initRef = useRef(false);
  
  const { dappSecretKey, savePhantomConnectResult, setPhantomEncryptionPublicKey, loadPhantomConnectResult, loadKeyPair } = usePhantomStore();
  const { setWalletPubkey, setPhantomSession, setState, setError } = useRecipientStore();

  const waitForDappSecretKey = useCallback(async (timeoutMs: number): Promise<boolean> => {
    const startTime = Date.now();
    while ((Date.now() - startTime) < timeoutMs) {
      const store = usePhantomStore.getState();
      if (store.dappSecretKey) {
        return true;
      }
      if (!store.encryptionKeyPair) {
        await store.loadKeyPair();
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }, []);

  const handlePhantomDeeplink = useCallback(async (url: string) => {
    console.log('[RootLayout] Received deeplink:', url);
    
    const store = usePhantomStore.getState();
    if (!store.dappSecretKey && !store.encryptionKeyPair) {
      await store.loadKeyPair();
    }
    
    const hasKey = await waitForDappSecretKey(5000);
    if (!hasKey) {
      setError('キーが利用できません');
      if (Platform.OS === 'android') {
        ToastAndroid.show('接続エラー: キーが利用できません', ToastAndroid.LONG);
      }
      return;
    }
    
    const { dappSecretKey: currentDappSecretKey } = usePhantomStore.getState();
    if (!currentDappSecretKey) {
      setError('キーが利用できません');
      if (Platform.OS === 'android') {
        ToastAndroid.show('接続エラー: キーが利用できません', ToastAndroid.LONG);
      }
      return;
    }

    try {
      if (url.includes('/connect')) {
        const result = handlePhantomConnectRedirect(url, currentDappSecretKey);
        if (result.ok) {
          await savePhantomConnectResult(result.result.publicKey, result.result.session, result.phantomPublicKey);
          setPhantomEncryptionPublicKey(result.phantomPublicKey);
          setWalletPubkey(result.result.publicKey);
          setPhantomSession(result.result.session);
          setState('Connected');
          console.log('[RootLayout] Phantom connected successfully');
          if (Platform.OS === 'android') {
            ToastAndroid.show('Phantomに接続しました', ToastAndroid.SHORT);
          }
        } else {
          const errorMessage = `[${result.stage}] ${result.error}`;
          console.error('[RootLayout] Phantom connect failed:', errorMessage);
          setError(errorMessage);
          if (Platform.OS === 'android') {
            ToastAndroid.show(`接続エラー: ${errorMessage}`, ToastAndroid.LONG);
          }
        }
      } else if (url.includes('/signTransaction')) {
        const result = handleRedirect(url, currentDappSecretKey);
        if (!result.ok) {
          if (Platform.OS === 'android') {
            ToastAndroid.show(`署名エラー: ${result.error}`, ToastAndroid.LONG);
          }
        }
      }
    } catch (e) {
      const errorMsg = (e as any)?.message ?? String(e);
      const errorPreview = errorMsg.length > 120 ? errorMsg.substring(0, 120) + '...' : errorMsg;
      setError(errorPreview);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`エラー: ${errorPreview}`, ToastAndroid.LONG);
      }
    }
  }, [waitForDappSecretKey, savePhantomConnectResult, setPhantomEncryptionPublicKey, setWalletPubkey, setPhantomSession, setState, setError]);

  // 初期化: 保存された接続結果を読み込む（一度だけ実行）
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const loadSavedConnection = async () => {
      await loadKeyPair();
      const saved = await loadPhantomConnectResult();
      if (saved) {
        console.log('[RootLayout] Loaded saved connection:', saved.publicKey.substring(0, 8) + '...');
        setWalletPubkey(saved.publicKey);
        setPhantomSession(saved.session);
        setPhantomEncryptionPublicKey(saved.phantomPublicKey);
        setState('Connected');
      }
    };
    loadSavedConnection();
  }, []);

  // コールドスタート時のdeeplink処理
  useEffect(() => {
    const checkInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL && initialURL.startsWith('wene://phantom/')) {
          console.log('[RootLayout] Initial URL (cold start):', initialURL);
          await handlePhantomDeeplink(initialURL);
        }
      } catch (error) {
        console.error('[RootLayout] Error checking initial URL:', error);
      }
    };
    checkInitialURL();
  }, [handlePhantomDeeplink]);

  // ホットスタート時のdeeplink処理
  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      if (url.startsWith('wene://phantom/')) {
        console.log('[RootLayout] URL event (hot start):', url);
        await handlePhantomDeeplink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handlePhantomDeeplink]);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="r/[campaignId]" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="use/[campaignId]" />
        <Stack.Screen name="phantom/[action]" />
      </Stack>
    </SafeAreaProvider>
  );
}
