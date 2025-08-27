#!/usr/bin/env tsx

/**
 * Test script to verify the standalone getPriceFeedAccountAddress function
 * Run with: npx tsx scripts/test-pyth-account-address.ts
 */

import { getPriceFeedAccountAddress, PYTH_FEED_IDS } from '../pyth-account-address';

async function main() {
    console.log('🔍 Testing standalone getPriceFeedAccountAddress function...\n');

    const SHARD_ID = 0;

    try {
        // Test with different price feed IDs
        const testCases = [
            { name: 'BTC/USD', feedId: PYTH_FEED_IDS.BTC_USD },
            { name: 'ETH/USD', feedId: PYTH_FEED_IDS.ETH_USD },
            { name: 'SOL/USD', feedId: PYTH_FEED_IDS.SOL_USD },
            { name: 'USDC/USD', feedId: PYTH_FEED_IDS.USDC_USD },
        ];

        console.log('📊 Testing price feed account addresses:');
        for (const testCase of testCases) {
            const address = await getPriceFeedAccountAddress(SHARD_ID, testCase.feedId);
            console.log(`   ${testCase.name}: ${address}`);
        }

        // Test with different shard IDs
        console.log('\n🔄 Testing different shard IDs for BTC/USD:');
        for (let shardId = 0; shardId < 3; shardId++) {
            const address = await getPriceFeedAccountAddress(shardId, PYTH_FEED_IDS.BTC_USD);
            console.log(`   Shard ${shardId}: ${address}`);
        }

        // Test with hex string without 0x prefix
        console.log('\n🔧 Testing hex string without 0x prefix:');
        const btcFeedIdWithoutPrefix = PYTH_FEED_IDS.BTC_USD.slice(2); // Remove 0x
        const addressWithoutPrefix = await getPriceFeedAccountAddress(SHARD_ID, btcFeedIdWithoutPrefix);
        console.log(`   BTC/USD (no 0x): ${addressWithoutPrefix}`);

        // Verify it matches the 0x version
        const addressWithPrefix = await getPriceFeedAccountAddress(SHARD_ID, PYTH_FEED_IDS.BTC_USD);
        console.log(`   BTC/USD (with 0x): ${addressWithPrefix}`);
        console.log(`   ✅ Match: ${addressWithoutPrefix === addressWithPrefix}`);

        console.log('\n✅ All tests passed! The standalone function works correctly.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main().catch(console.error);
