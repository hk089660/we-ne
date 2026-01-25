import { ReceiveScreen } from '../../src/screens/ReceiveScreen';
import { Platform } from 'react-native';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/r/[campaignId].tsx:3',message:'deeplink route loaded',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion

export default ReceiveScreen;
