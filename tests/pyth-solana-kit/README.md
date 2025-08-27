# Pyth Account Address Utilities

This directory contains utilities for working with Pyth Network price feed account addresses using Solana Kit instead of web3.js.

## Files

### `pyth-account-address.ts`

A standalone implementation of `getPriceFeedAccountAddress` that uses Solana Kit instead of web3.js.

#### Features

- ✅ **No web3.js dependency**: Uses Solana Kit's `@solana/addresses` package
- ✅ **Async/await support**: Modern async function signature
- ✅ **Type safety**: Full TypeScript support with proper types
- ✅ **Flexible input**: Accepts both Buffer and string inputs
- ✅ **Hex string support**: Handles hex strings with or without `0x` prefix
- ✅ **Shard support**: Works with different shard IDs for load balancing

#### Usage

```typescript
import { getPriceFeedAccountAddress, PYTH_FEED_IDS } from './utils/pyth-account-address';

// Basic usage
const SHARD_ID = 0;
const btcAddress = await getPriceFeedAccountAddress(SHARD_ID, PYTH_FEED_IDS.BTC_USD);
console.log('BTC/USD Price Feed Address:', btcAddress);

// With custom program ID
const customProgramId = "pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT" as Address;
const ethAddress = await getPriceFeedAccountAddress(SHARD_ID, PYTH_FEED_IDS.ETH_USD, customProgramId);

// With hex string without 0x prefix
const solAddress = await getPriceFeedAccountAddress(SHARD_ID, "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d");
```

#### API Reference

```typescript
function getPriceFeedAccountAddress(
  shardId: number,
  priceFeedId: Buffer | string,
  pushOracleProgramId?: Address
): Promise<Address>
```

**Parameters:**
- `shardId`: The shard ID (0-65535) for load balancing across multiple accounts
- `priceFeedId`: The price feed ID as a Buffer or hex string
- `pushOracleProgramId`: Optional custom program ID (defaults to Pyth's mainnet program)

**Returns:**
- `Promise<Address>`: The derived price feed account address

#### Common Price Feed IDs

```typescript
export const PYTH_FEED_IDS = {
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  SOL_USD: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  USDC_USD: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
} as const;
```

## Testing

Run the test scripts to verify the function works correctly:

```bash
# Test basic functionality
npx tsx scripts/test-pyth-account-address.ts

# Verify against known addresses
npx tsx scripts/verify-addresses.ts
```

## Migration from PythSolanaReceiver

**Before (using PythSolanaReceiver):**
```typescript
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";

const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });
const address = pythSolanaReceiver
  .getPriceFeedAccountAddress(SHARD_ID, BTC_USD_PRICE_FEED_ID)
  .toBase58();
```

**After (using standalone function):**
```typescript
import { getPriceFeedAccountAddress, PYTH_FEED_IDS } from "./utils/pyth-account-address";

const address = await getPriceFeedAccountAddress(SHARD_ID, PYTH_FEED_IDS.BTC_USD);
```

## Benefits

1. **Reduced dependencies**: No need for `@pythnetwork/pyth-solana-receiver` just for address derivation
2. **Modern tooling**: Uses Solana Kit instead of web3.js
3. **Better performance**: No need to instantiate a full PythSolanaReceiver object
4. **Type safety**: Full TypeScript support with proper types
5. **Flexibility**: Can be used in any context without connection/wallet setup

## Implementation Details

The function uses Solana Kit's `getProgramDerivedAddress` function to derive the price feed account address using:

1. **Seeds**: `[shardBuffer, feedIdBuffer]`
   - `shardBuffer`: 2-byte little-endian representation of the shard ID
   - `feedIdBuffer`: 32-byte price feed ID

2. **Program ID**: Pyth Push Oracle program (`pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT`)

This matches the exact implementation used by PythSolanaReceiver but without the web3.js dependency.
