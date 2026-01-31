# Devnet 接続状態の事実確認レポート

**目的**: Android + Phantom + devnet において「どこまで正常に動作しているか」「どこで devnet 接続が破綻しているか」をログとコードから事実ベースで確定する。  
**前提**: Phantom(Android) 接続・署名は成功、grant_program は devnet デプロイ済み、devnet_setup で mint/grant/vault 作成・残高確認済み、アプリは devnetConfig 参照可能、`__DEV__` で DEV_ENV / DEV_GRANT が出力される。

---

## 1) Devnet 接続状態の事実をログから整理する

### 1.1 claim 実行時に出力されるログ（抽出項目）

`buildClaimTx` 内（`wene-mobile/src/solana/txBuilders.ts` 86–110 行）で、`__DEV__` 時に以下が出力される。

| 項目 | ログプレフィックス / 内容 | コード上の出所 |
|------|---------------------------|----------------|
| **cluster** | `[DEV_ENV] cluster=` + `DEFAULT_CLUSTER` | `cluster.ts` の `DEFAULT_CLUSTER`（DEV 時は `devnet`） |
| **RPC endpoint** | `[DEV_ENV] rpc=` + `RPC_URL` | `singleton.ts` の `RPC_URL`（= `getRpcUrl(DEFAULT_CLUSTER)`） |
| **programId** | `[DEV_ENV] programId=` + `GRANT_PROGRAM_ID.toBase58()` | `config.ts` の `GRANT_PROGRAM_ID`（= `getGrantProgramId(DEFAULT_CLUSTER)`） |
| **grantSource** | `[DEV_ENV] source=` + `devnetConfig` or `dummy` | `useDevnetConfig`（`DEFAULT_CLUSTER === 'devnet' && DEVNET_GRANT_CONFIG !== null`） |
| **grantId** | `[DEV_GRANT] grantId=` | `DEVNET_GRANT_CONFIG.grantId`（devnetConfig 使用時のみ） |
| **mint** | `[DEV_GRANT] mint=` | `DEVNET_GRANT_CONFIG.mint`（同上） |
| **vault** | `[DEV_GRANT] vault=` | `getVaultPda(grantPda)` の PDA（同上） |
| **vaultBalance** | `[DEV_GRANT] vaultBalance=` + 数値 or `UNKNOWN (grant/vault 未存在?)` | vault ATA の `getAccount` 成功時は `amount.toString()`、失敗時は上記文字列 |

### 1.2 ログから「devnet として一貫しているか」を確認する手順

claim 実行後、次のコマンドで該当行を抽出する。

```bash
grep -E 'DEV_ENV|DEV_GRANT' /tmp/wene_claim_flow.log
```

**一貫性のチェック:**

- `cluster=devnet` であること  
- `rpc=` が devnet 用 RPC（例: `https://solana-devnet.api.onfinality.io/public` または `EXPO_PUBLIC_SOLANA_RPC_URL` で指定した devnet URL）であること  
- `programId=` が devnet デプロイの Program ID（`config.ts` の `DEVNET_PROGRAM_ID` = `GZcUoGHk8SfAArTKicL1jiRHZEQa3EuzgYcC2u4yWfSR`）であること  
- `source=devnetConfig` であること（dummy の場合は devnet の「本物の」grant を使っていない）  
- `vaultBalance=` が数値で 0 より大きいこと（`UNKNOWN` は grant/vault 未存在の疑い）

これらがすべて満たされていれば、**アプリ側の cluster/RPC/programId/grant は devnet として一貫している**と判断できる。

---

## 2) Phantom 側との整合性を確認する

### 2.1 Phantom connect / sign に渡している deep link の URL

| 処理 | 関数 | cluster の渡し方 | コード箇所 |
|------|------|------------------|------------|
| **Connect** | `buildPhantomConnectUrl` | 引数 `cluster`（未指定時は `'devnet'`）→ `url.searchParams.set('cluster', cluster)` | `phantom.ts` 50, 78 行 |
| **Connect 呼び出し** | `ReceiveScreen` | `buildPhantomConnectUrl({ ..., cluster: 'devnet' })`、`initiatePhantomConnect(..., 'devnet', ...)` | `ReceiveScreen.tsx` 272–276, 288–292 行 |
| **Sign** | `buildPhantomSignTransactionUrl` | 引数 `cluster`（未指定時は `'devnet'`）→ `url.searchParams.set('cluster', cluster)` | `phantom.ts` 325, 378 行 |
| **Sign 呼び出し** | `ReceiveScreen` | `signTransaction({ ..., cluster: 'devnet' })`（初回・再試行とも） | `ReceiveScreen.tsx` 395–402, 483–490 行 |
| **PhantomWalletAdapter** | `signTransaction` | `cluster: 'devnet'` を渡している | `PhantomWalletAdapter.ts` 76 行 |

**結論（事実）:**  
Connect も Sign も、呼び出し元で **すべて `cluster: 'devnet'` を明示**しており、deep link の URL には `cluster=devnet` が含まれる。

### 2.2 Phantom が mainnet 扱いになり得る経路の有無

- **アプリコード**: connect/sign のいずれも `cluster` を省略せず `'devnet'` 固定で渡している。mainnet を渡している箇所はない。  
- **Phantom のデフォルト**: `phantom.ts` の `buildPhantomConnectUrl`（50 行）と `buildPhantomSignTransactionUrl`（325 行）では、未指定時に `cluster = 'devnet'` を使用。  
- **環境による切り替え**: `EXPO_PUBLIC_SOLANA_CLUSTER` や `DEFAULT_CLUSTER` は **Phantom の URL には使っていない**。Phantom 用は常に上記の `'devnet'` 固定。

**結論（事実）:**  
コード上、Phantom の deep link で mainnet を指定している経路は存在しない。  
体感で「mainnet に見える」場合は、**Phantom アプリ内の表示設定（開発者設定 → ネットワーク）が Mainnet のまま**になっている可能性がある。その場合でも、dapp から渡す `cluster=devnet` により署名対象の tx は devnet のものになる。

---

## 3) devnetConfig の有効性を確認する

### 3.1 devnet_setup.ts の _RAW 出力と devnetConfig.ts の対応

**devnet_setup.ts の _RAW 出力（貼り付け用）:**

- 出力されるのは `authority`, `mint`, `grantId`, `startTs`, `periodSeconds` の 5 項目のみ。  
- `vault` は「検証ログ」では出力するが、**貼り付け用 _RAW ブロックには含まれない**。  
- `programId` は検証ログで `program.programId.toBase58()` として出るが、_RAW には含まれない。

**devnetConfig.ts の _RAW:**

- 保持しているのは `authority`, `mint`, `grantId`, `startTs`, `periodSeconds` の 5 項目のみ。  
- vault は持たず、アプリ側で `getVaultPda(grantPda)` から計算している。  
- programId は `config.ts` の `DEVNET_PROGRAM_ID` で固定。

### 3.2 比較すべき項目と一致条件

| 項目 | devnet_setup での出所 | devnetConfig / アプリでの出所 | 一致の取り方 |
|------|------------------------|--------------------------------|--------------|
| **programId** | 検証ログの `programId:`（Anchor の program.programId） | `config.ts` の `DEVNET_PROGRAM_ID`（= grant_program の `declare_id!`） | 両者が同じ base58 であること。現在は `GZcUoGHk8SfAArTKicL1jiRHZEQa3EuzgYcC2u4yWfSR` で一致。 |
| **authority** | _RAW の `config.authority` | `devnetConfig.ts` の `_RAW.authority` | 完全一致。 |
| **mint** | _RAW の `config.mint` | `devnetConfig.ts` の `_RAW.mint` | 完全一致。 |
| **grantId** | _RAW の `config.grantId` | `devnetConfig.ts` の `_RAW.grantId` | 完全一致。 |
| **vault** | 検証ログの `vault:`（PDA） | アプリでは `getVaultPda(grantPda)` で計算 | authority, mint, grantId, programId が一致していれば、同じ PDA になるため vault も一致。 |

### 3.3 現在の devnetConfig.ts の値（比較用）

```ts
authority: '6MVimhATeGJrvNWYJcozsxMCWQK78oEM1sd6KqpMq3Kz'
mint:      '9g6BSqJBefXHLPhhdBTyGXNBuRPNqmJ9BedNc8ENnHL'
grantId:   '1'
startTs:   '1738281600'
periodSeconds: '2592000'
```

**確認手順:**  
`grant_program` で `devnet_setup` を実行し、表示される「検証ログ」の `programId` / `authority` / `mint` / `grantId` および「_RAW ブロック」の 5 項目と、上記および `config.ts` の `DEVNET_PROGRAM_ID` を照合する。  
**差分がある場合:**  
- _RAW を再度 devnetConfig に貼り直す。  
- programId が違う場合は、Anchor のデプロイ先（declare_id / Anchor.toml）と `config.ts` の `DEVNET_PROGRAM_ID` を一致させる。

---

## 4) 接続の結論：「成功しているが分かりにくい」か「どこかで devnet から外れている」か

### 4.1 コード上わかっていること

- **cluster**: `DEFAULT_CLUSTER` は DEV 時は `devnet`（`cluster.ts`）。  
- **RPC**: `singleton` の `RPC_URL` は `getRpcUrl(DEFAULT_CLUSTER)` で、devnet 時は devnet 用 URL。  
- **programId**: `GRANT_PROGRAM_ID` は `getGrantProgramId(DEFAULT_CLUSTER)` で、devnet 時は `DEVNET_PROGRAM_ID`。  
- **Phantom**: connect/sign ともに `cluster=devnet` を明示。mainnet を渡す経路はない。  
- **Grant 情報**: `DEVNET_GRANT_CONFIG` が設定されていれば、claim は devnet の authority/mint/grantId/vault を使用。

このため、**「コード上は devnet として一貫した経路だけが使われている」**と言える。

### 4.2 体感の「不安定・分かりにくい」の要因となり得る点

- **ログが __DEV__ 限定**: DEV_ENV / DEV_GRANT は開発ビルドでしか出ない。  
- **Phantom の表示**: アプリ内のネットワーク表示が Mainnet のままだと、ユーザーは mainnet と勘違いしうる。  
- **devnetConfig の鮮度**: devnet_setup をやり直したあと devnetConfig を更新していないと、vaultBalance=UNKNOWN や mint 不一致になりうる。  
- **RPC の不安定さ**: devnet の RPC が遅い・落ちる場合、送信や confirm が失敗し「接続がおかしい」と感じられうる。

### 4.3 「devnet から外れている」と言える可能性がある点

- **vaultBalance=UNKNOWN**: grant または vault が devnet 上に存在しない（devnet_setup 未実行・別 programId・別 authority/mint/grantId、または devnetConfig の貼り忘れ・古い値）。  
- **vaultBalance=0**: vault は存在するが残高 0（fund_grant 未実行または失敗）。  
- **simulate 失敗 / 送信エラー**: programId・mint・grant の組み合わせが、実際にデプロイされている devnet の状態と一致していない（設定ミスまたはデプロイし直し後の設定未更新）。

---

## 5) 結果サマリ（指定フォーマット）

### ✅ devnet 接続は成立している点

- **cluster**: DEV 時は `DEFAULT_CLUSTER` が `devnet` に固定され、RPC・programId・buildClaimTx の grant 参照はすべてこの cluster に紐づいている。  
- **RPC**: `singleton` の `RPC_URL` は `getRpcUrl(DEFAULT_CLUSTER)` により devnet 用になっている。  
- **programId**: devnet 時は `DEVNET_PROGRAM_ID`（`GZcUoGHk8SfAArTKicL1jiRHZEQa3EuzgYcC2u4yWfSR`）が使われ、grant_program の `declare_id!` と一致している。  
- **Phantom**: connect / sign の deep link にいずれも `cluster=devnet` を明示しており、mainnet を指定するコード経路はない。  
- **Grant 参照**: `DEVNET_GRANT_CONFIG` が設定されていれば、claim は devnet の authority / mint / grantId / vault（PDA）を使用する。

### ⚠️ devnet 接続を不安定に感じさせている要因

- **ログが __DEV__ 限定**: 本番ビルドでは DEV_ENV / DEV_GRANT が出ず、接続状態の確認がしづらい。  
- **Phantom の画面表示**: アプリ側は devnet を指定していても、Phantom の「ネットワーク」表示が Mainnet のままだとユーザーが混乱しうる。  
- **devnetConfig の更新忘れ**: devnet_setup を再実行したあと _RAW を貼り直していないと、vault 不一致・vaultBalance=UNKNOWN などで失敗する。  
- **devnet RPC の品質**: 遅延や障害で送信・confirm が失敗すると、接続不安定に感じられうる。

### ❌ devnet から外れている可能性がある点（条件付き）

- **vaultBalance=UNKNOWN が出る場合**: devnet 上に grant/vault が存在しない、または devnetConfig（authority/mint/grantId）が実際の devnet_setup 結果と一致していない可能性がある。  
- **vaultBalance=0 の場合**: vault は存在するが入金されておらず、claim はプログラム的には devnet 接続だが、実行結果としては失敗する。  
- **simulate 失敗や送信エラーが「account not found」「wrong program」系の場合**: programId / mint / grantId のいずれかが、現在デプロイされている devnet の状態とずれている可能性がある。

---

## 次のステップ（修正案は別途）

- 上記「⚠️」「❌」に対する改善（ログの常時出力オプション、Phantom のネットワーク表示案内、devnetConfig と devnet_setup 出力の照合手順の明文化など）は、必要に応じて別タスクで実施する。
