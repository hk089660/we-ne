#!/usr/bin/env node
/**
 * We-ne Mobile Doctor Script
 * 
 * 一般的な問題を自動検出・修正するスクリプト
 * 
 * 使い方:
 *   node scripts/doctor.js        # 問題を検出
 *   node scripts/doctor.js --fix  # 問題を自動修正
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FIX_MODE = process.argv.includes('--fix');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  fix: (msg) => console.log(`${colors.green}🔧 ${msg}${colors.reset}`),
};

let issues = 0;
let fixed = 0;

// ========================================
// Check 1: Polyfills
// ========================================
function checkPolyfills() {
  log.info('Checking polyfills.ts...');
  const polyfillsPath = path.join(ROOT, 'src/polyfills.ts');
  
  if (!fs.existsSync(polyfillsPath)) {
    log.error('polyfills.ts not found');
    issues++;
    if (FIX_MODE) {
      const content = `/**
 * React Native 用ポリフィル
 * 必ず最初にインポートすること
 */

// crypto.getRandomValues polyfill - tweetnacl等が使用
import 'react-native-get-random-values';

// Buffer polyfill - @solana/web3.js が使用
import { Buffer } from 'buffer';

if (typeof global !== 'undefined') {
  (global as typeof globalThis & { Buffer?: typeof Buffer }).Buffer = Buffer;
}
`;
      fs.writeFileSync(polyfillsPath, content);
      log.fix('Created polyfills.ts');
      fixed++;
    }
    return;
  }
  
  const content = fs.readFileSync(polyfillsPath, 'utf8');
  
  // Check for react-native-get-random-values
  if (!content.includes("react-native-get-random-values")) {
    log.error('polyfills.ts missing react-native-get-random-values import');
    issues++;
    if (FIX_MODE) {
      const newContent = `// crypto.getRandomValues polyfill - tweetnacl等が使用
import 'react-native-get-random-values';

${content}`;
      fs.writeFileSync(polyfillsPath, newContent);
      log.fix('Added react-native-get-random-values to polyfills.ts');
      fixed++;
    }
  } else {
    log.success('polyfills.ts has react-native-get-random-values');
  }
  
  // Check for Buffer
  if (!content.includes("buffer")) {
    log.error('polyfills.ts missing Buffer import');
    issues++;
  } else {
    log.success('polyfills.ts has Buffer polyfill');
  }
  
  // Check for debug logs
  if (content.includes('fetch(') && content.includes('/ingest/')) {
    log.warn('polyfills.ts contains debug fetch calls');
    issues++;
    if (FIX_MODE) {
      // Remove agent log blocks
      let cleaned = content.replace(/\/\/ #region agent log[\s\S]*?\/\/ #endregion\n?/g, '');
      fs.writeFileSync(polyfillsPath, cleaned);
      log.fix('Removed debug fetch calls from polyfills.ts');
      fixed++;
    }
  }
}

// ========================================
// Check 2: SafeAreaView in Screens
// ========================================
function checkSafeAreaView() {
  log.info('Checking SafeAreaView usage in screens...');
  const screensDir = path.join(ROOT, 'src/screens');
  
  if (!fs.existsSync(screensDir)) {
    log.warn('src/screens directory not found');
    return;
  }
  
  const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));
  
  for (const file of files) {
    const filePath = path.join(screensDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it's a screen component (has React.FC or export default)
    if (!content.includes('React.FC') && !content.includes('export default')) {
      continue;
    }
    
    // Check for SafeAreaView usage
    const hasSafeAreaView = content.includes('SafeAreaView') || content.includes('useSafeAreaInsets');
    
    if (!hasSafeAreaView) {
      log.error(`${file} does not use SafeAreaView or useSafeAreaInsets`);
      issues++;
      // Auto-fix is complex for this, so just warn
    } else {
      log.success(`${file} uses SafeAreaView`);
    }
    
    // Check for debug logs
    if (content.includes('fetch(') && content.includes('/ingest/')) {
      log.warn(`${file} contains debug fetch calls`);
      issues++;
      if (FIX_MODE) {
        let cleaned = content.replace(/\/\/ #region agent log[\s\S]*?\/\/ #endregion\n?/g, '');
        fs.writeFileSync(filePath, cleaned);
        log.fix(`Removed debug fetch calls from ${file}`);
        fixed++;
      }
    }
  }
}

// ========================================
// Check 3: Dependencies
// ========================================
function checkDependencies() {
  log.info('Checking required dependencies...');
  const packagePath = path.join(ROOT, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    log.error('package.json not found');
    issues++;
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  const required = [
    'react-native-get-random-values',
    'react-native-safe-area-context',
    'buffer',
    'bs58',
    'tweetnacl',
  ];
  
  const missing = [];
  for (const dep of required) {
    if (deps[dep]) {
      log.success(`${dep} is installed`);
    } else {
      log.error(`${dep} is missing`);
      missing.push(dep);
      issues++;
    }
  }
  
  if (FIX_MODE && missing.length > 0) {
    log.fix(`Installing missing dependencies: ${missing.join(', ')}`);
    try {
      execSync(`npm install ${missing.join(' ')} --legacy-peer-deps`, { 
        cwd: ROOT, 
        stdio: 'inherit' 
      });
      fixed += missing.length;
    } catch (e) {
      log.error('Failed to install dependencies');
    }
  }
}

// ========================================
// Check 4: Android local.properties
// ========================================
function checkAndroidConfig() {
  log.info('Checking Android configuration...');
  const androidDir = path.join(ROOT, 'android');
  const localPropsPath = path.join(androidDir, 'local.properties');
  
  if (!fs.existsSync(androidDir)) {
    log.warn('android directory not found (run prebuild first)');
    return;
  }
  
  if (!fs.existsSync(localPropsPath)) {
    log.error('android/local.properties not found');
    issues++;
    if (FIX_MODE) {
      // Try to find Android SDK
      const possibleSdkPaths = [
        process.env.ANDROID_HOME,
        process.env.ANDROID_SDK_ROOT,
        '/opt/homebrew/share/android-commandlinetools',
        `${process.env.HOME}/Library/Android/sdk`,
        `${process.env.HOME}/Android/Sdk`,
      ].filter(Boolean);
      
      let sdkPath = null;
      for (const p of possibleSdkPaths) {
        if (p && fs.existsSync(p)) {
          sdkPath = p;
          break;
        }
      }
      
      if (sdkPath) {
        fs.writeFileSync(localPropsPath, `sdk.dir=${sdkPath}\n`);
        log.fix(`Created local.properties with sdk.dir=${sdkPath}`);
        fixed++;
      } else {
        log.error('Could not find Android SDK path');
      }
    }
  } else {
    const content = fs.readFileSync(localPropsPath, 'utf8');
    if (content.includes('sdk.dir')) {
      log.success('local.properties has sdk.dir');
    } else {
      log.error('local.properties missing sdk.dir');
      issues++;
    }
  }
}

// ========================================
// Check 5: Phantom Base58 encoding
// ========================================
function checkPhantomUtils() {
  log.info('Checking Phantom utils...');
  const phantomPath = path.join(ROOT, 'src/utils/phantom.ts');
  
  if (!fs.existsSync(phantomPath)) {
    log.warn('src/utils/phantom.ts not found');
    return;
  }
  
  const content = fs.readFileSync(phantomPath, 'utf8');
  
  // Check buildPhantomConnectUrl uses Base58
  if (content.includes('buildPhantomConnectUrl')) {
    if (content.includes('bs58.encode') && content.includes('dappKeyBase58')) {
      log.success('buildPhantomConnectUrl converts to Base58');
    } else {
      log.error('buildPhantomConnectUrl may not be converting to Base58');
      issues++;
    }
  }
  
  // Check for handlePhantomConnectRedirect
  if (content.includes('handlePhantomConnectRedirect')) {
    log.success('handlePhantomConnectRedirect is defined');
  } else {
    log.error('handlePhantomConnectRedirect is missing');
    issues++;
  }
  
  // Check for debug logs
  if (content.includes('fetch(') && content.includes('/ingest/')) {
    log.warn('phantom.ts contains debug fetch calls');
    issues++;
    if (FIX_MODE) {
      let cleaned = content.replace(/\/\/ #region agent log[\s\S]*?\/\/ #endregion\n?/g, '');
      fs.writeFileSync(phantomPath, cleaned);
      log.fix('Removed debug fetch calls from phantom.ts');
      fixed++;
    }
  }
}

// ========================================
// Check 6: App Layout SafeAreaProvider
// ========================================
function checkAppLayout() {
  log.info('Checking app/_layout.tsx...');
  const layoutPath = path.join(ROOT, 'app/_layout.tsx');
  
  if (!fs.existsSync(layoutPath)) {
    log.warn('app/_layout.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(layoutPath, 'utf8');
  
  // Check SafeAreaProvider
  if (content.includes('SafeAreaProvider')) {
    log.success('_layout.tsx has SafeAreaProvider');
  } else {
    log.error('_layout.tsx missing SafeAreaProvider');
    issues++;
  }
  
  // Check polyfills import is first
  const lines = content.split('\n');
  const firstImportLine = lines.findIndex(l => l.startsWith('import'));
  if (firstImportLine >= 0 && lines[firstImportLine].includes('polyfills')) {
    log.success('polyfills is imported first');
  } else {
    log.warn('polyfills should be imported first in _layout.tsx');
  }
  
  // Check for debug logs
  if (content.includes('fetch(') && content.includes('/ingest/')) {
    log.warn('_layout.tsx contains debug fetch calls');
    issues++;
    if (FIX_MODE) {
      let cleaned = content.replace(/\/\/ #region agent log[\s\S]*?\/\/ #endregion\n?/g, '');
      fs.writeFileSync(layoutPath, cleaned);
      log.fix('Removed debug fetch calls from _layout.tsx');
      fixed++;
    }
  }
}

// ========================================
// Check 7: node_modules existence
// ========================================
function checkNodeModules() {
  log.info('Checking node_modules...');
  const nodeModulesPath = path.join(ROOT, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log.error('node_modules not found');
    issues++;
    if (FIX_MODE) {
      log.fix('Running npm install...');
      try {
        execSync('npm install --legacy-peer-deps', { cwd: ROOT, stdio: 'inherit' });
        fixed++;
      } catch (e) {
        log.error('npm install failed');
      }
    }
  } else {
    log.success('node_modules exists');
  }
}

// ========================================
// Check 8: Assets (icon)
// ========================================
function checkAssets() {
  log.info('Checking assets...');
  const assetsDir = path.join(ROOT, 'assets');
  
  if (!fs.existsSync(assetsDir)) {
    log.error('assets directory not found');
    issues++;
    if (FIX_MODE) {
      fs.mkdirSync(assetsDir, { recursive: true });
      log.fix('Created assets directory');
      fixed++;
    }
    return;
  }
  
  const requiredAssets = ['icon.png', 'adaptive-icon.png'];
  for (const asset of requiredAssets) {
    const assetPath = path.join(assetsDir, asset);
    if (fs.existsSync(assetPath)) {
      log.success(`${asset} exists`);
    } else {
      log.warn(`${asset} not found`);
    }
  }
}

// ========================================
// Main
// ========================================
console.log('\n🏥 We-ne Mobile Doctor\n');
console.log(`Mode: ${FIX_MODE ? 'FIX' : 'CHECK'}\n`);
console.log('─'.repeat(50));

checkNodeModules();
console.log('');
checkDependencies();
console.log('');
checkPolyfills();
console.log('');
checkAppLayout();
console.log('');
checkSafeAreaView();
console.log('');
checkPhantomUtils();
console.log('');
checkAndroidConfig();
console.log('');
checkAssets();

console.log('\n' + '─'.repeat(50));
console.log(`\n📊 Summary: ${issues} issue(s) found`);
if (FIX_MODE) {
  console.log(`🔧 Fixed: ${fixed} issue(s)`);
}

if (issues > 0 && !FIX_MODE) {
  console.log(`\n💡 Run with --fix to auto-fix some issues:`);
  console.log(`   node scripts/doctor.js --fix\n`);
}

process.exit(issues > 0 ? 1 : 0);
