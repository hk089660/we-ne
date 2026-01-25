# we-ne

[日本語版 README はこちら](./README.ja.md)

**A Solana-based infrastructure for instant, verifiable, and low-cost benefit distribution in Japan**

we-ne is an on-chain foundation designed to execute "benefits," "support," and "distribution" in Japanese society with an emphasis on **immediacy, low cost, and transparency**.

This repository integrates the existing `solana-grant-program` at its core and provides a **minimum viable product (MVP)** for implementing **SPL token-based fixed-rate periodic benefits (subscription-style)**.

---

## Philosophy

In Japan, there is often a significant delay, administrative overhead, and intermediary costs between identifying a need for support and actually delivering it.

- Heavy procedures that cannot respond to urgent needs
- Small-scale support often becomes cost-prohibitive
- Low transparency in execution makes verification difficult

we-ne aims to **simplify these through technology**.

> **Support should be creatable the moment you think of it,**  
> **delivered instantly to those who meet the conditions,**  
> **and its execution should be verifiable by anyone**

This project is not intended for speculation or financial products.  
It focuses on **real-world use cases in Japan** such as livelihood support, community activities, and proof-of-concept experiments.

---

## Why Solana?

The most important factors in benefits and support are **"speed of delivery" and "practical accessibility"**.

Solana has characteristics that align well with this philosophy:

- **Fast finality**: Creates an "it just arrived" experience instead of "pending"
- **Low fees**: Makes small-scale, high-frequency benefits viable
- **On-chain execution**: Verifiable who, when, and under what conditions distributions occurred
- **Global infrastructure**: Flexible enough to work for small-scale use cases in Japan

we-ne adopts Solana to **treat benefits as living infrastructure, not financial products**.

---

## Current Capabilities (MVP)

The current we-ne is a **working MVP** with the following specifications:

### Smart Contract (grant_program)

- SPL token-only benefit program
- Fixed-rate method (e.g., operated as 1 token = 1 yen equivalent)
- Periodic benefits (claimable only once per period)
- Double-claim prevention (period index + ClaimReceipt PDA)
- Complete implementation from funding to claiming to pausing

```text
Create Grant → Fund Grant → Periodic Claim → Pause / Resume
```

Anchor `build / test` passes successfully.

### Mobile App (wene-mobile)

- Recipient-facing UI built with React Native (Expo + TypeScript)
- Solana wallet integration (Phantom Wallet support)
- Connection to grant programs and claiming functionality
- Deep Link support (`wene://r/<campaignId>` and `https://wene.app/r/<campaignId>`)
- iOS / Android compatible

For mobile app details, see [`wene-mobile/README.md`](./wene-mobile/README.md).

---

## Periodic Benefits (Period-Based) Concept

we-ne is designed to handle **daily, weekly, monthly, and other periodic benefits** using the same mechanism, not just monthly benefits.

The benefit frequency is determined by `period_seconds` set when creating the Grant.  
This specifies how often benefits are distributed in seconds.

Examples:
- Daily benefits: `period_seconds = 86,400`
- Weekly benefits: `period_seconds = 604,800`
- Monthly benefits (approximate): `period_seconds = 2,592,000`

Each period calculates a `period_index`, and the ClaimReceipt keyed by `(grant, claimer, period_index)` **prevents double-claiming within the same period**.

This mechanism enables we-ne to:

- Flexibly change benefit frequency according to use case
- Extend to daily/weekly/monthly without additional implementation
- Clearly explain periodic benefits as "time-based rules"

we-ne is designed as a **recurring benefit engine divided by time**, not bound to specific cycles.

---

## Conditional Benefits (Allowlist) Concept

we-ne is designed with the premise of **combining conditions with periodic benefits**.

In conditional benefits, instead of judging "who can receive" with complex logic, control is based on **a pre-defined target list (Allowlist)**.

The Allowlist is intended to be linked to the Grant using a Merkle Tree.

- Register the Merkle Root of the Allowlist when creating the Grant
- When claiming, recipients prove they are on the list
- Those who don't meet conditions cannot claim

This approach enables we-ne to:

- Provide conditional benefits without handling KYC or personal information
- Work well with roster-based operations for schools, regions, organizations, etc.
- Naturally combine with periodic benefits (daily/weekly/monthly)

we-ne emphasizes **benefits that work by explicitly identifying "who is eligible"**, rather than complicating conditions.

---

## Repository Structure

```text
we-ne/
├─ README.md              # This file (English)
├─ README.ja.md           # Japanese README
├─ grant_program/         # Solana smart contract (Anchor)
│  ├─ Anchor.toml
│  ├─ programs/
│  │  └─ grant_program/
│  │     └─ src/
│  │        └─ lib.rs     # Core implementation: Grant / Claim / Allowlist / Receipt
│  └─ tests/              # Anchor tests
└─ wene-mobile/           # Mobile app (React Native + Expo)
   ├─ app/                # Screen definitions with Expo Router
   ├─ src/                # Application logic
   │  ├─ solana/          # Solana client implementation
   │  ├─ screens/         # Screen components
   │  └─ wallet/          # Wallet adapters
   ├─ android/            # Android native project
   └─ ios/                # iOS native project
```

---

## Development Environment

### Smart Contract (grant_program)

- Rust
- Solana CLI
- Anchor
- anchor-lang / anchor-spl

#### Build
```bash
cd grant_program
anchor build
```

#### Test
```bash
cd grant_program
anchor test
```

### Mobile App (wene-mobile)

- Node.js (recommended: v18+)
- npm or yarn
- Expo CLI
- iOS development: Xcode (macOS only)
- Android development: Android Studio / Android SDK

#### Setup
```bash
cd wene-mobile
npm install
```

#### Start Development Server
```bash
npm start
```

#### Build
```bash
# Android APK
npm run build:apk

# iOS Simulator
npm run build:ios
```

For detailed instructions, see [`wene-mobile/README.md`](./wene-mobile/README.md).

---

## Security & Disclaimers

- No KYC / identity verification (wallet-based)
- Smart contract has not been audited
- Not intended for production use

**Use only for research and verification purposes.**

---

## Status

- Anchor build: ✅
- Anchor test: ✅
- SPL fixed-rate periodic grant (MVP): ✅
- Mobile app (React Native + Expo): ✅
- Wallet integration (Phantom): ✅
- Deep Link support: ✅

---

## Contact

Feedback via Issues / Discussions is welcome.
