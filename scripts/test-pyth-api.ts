#!/usr/bin/env tsx

/**
 * Test script to demonstrate how to get Pyth account addresses
 * Run with: npx tsx scripts/test-pyth-api.ts
 */

import { getPythPriceFeeds, getPythPriceFeedById, PYTH_FEED_IDS } from '../utils/pyth-utils';

async function main() {
    console.log('🔍 Testing Pyth Network API...\n');

    try {
        // Get all price feeds
        console.log('📊 Fetching all price feeds...');
        const feeds = await getPythPriceFeeds();
        console.log(`✅ Found ${feeds.length} price feeds\n`);

        // Find BTC/USD feed
        console.log('🔍 Looking for BTC/USD feed...');
        const btcFeed = await getPythPriceFeedById(PYTH_FEED_IDS.BTC_USD);

        if (btcFeed) {
            console.log('✅ Found BTC/USD feed:');
            console.log(`   Feed ID: ${btcFeed.id}`);
            console.log(`   Price Account: ${btcFeed.price_account}`);
            console.log(`   Symbol: ${btcFeed.metadata.symbol}`);
            console.log(`   Description: ${btcFeed.metadata.description}`);
            console.log(`   Status: ${btcFeed.metadata.status}`);
        } else {
            console.log('❌ BTC/USD feed not found');
        }

        // Show a few other popular feeds
        console.log('\n📈 Other popular feeds:');
        const popularFeeds = feeds.filter(feed =>
            ['BTC/USD', 'SOL/USD', 'ETH/USD', 'USDC/USD'].includes(feed.metadata.symbol)
        ).slice(0, 4);

        popularFeeds.forEach(feed => {
            console.log(`   ${feed.metadata.symbol}: ${feed.price_account}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        console.log('\n💡 If the API is unavailable, you can use the fallback addresses in utils/pyth-utils.ts');
    }
}

main().catch(console.error);
