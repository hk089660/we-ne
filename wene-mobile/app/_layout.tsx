import '../src/polyfills';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:5',message:'RootLayout entry',data:{platform:Platform.OS,isDev:typeof __DEV__!=='undefined'?__DEV__:'undefined',hasBuffer:typeof (global as any)?.Buffer!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
// #endregion

export default function RootLayout() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:11',message:'RootLayout render',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  return (
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
  );
}
