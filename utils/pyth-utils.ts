/**
 * Pyth Network utilities for getting price feed account addresses
 * 
 * Official sources for account addresses:
 * 1. https://pyth.network/price-feeds (main price feeds page)
 * 2. https://api.pyth.network/api/price_feeds (API endpoint)
 * 3. Pyth SDK documentation
 */

export interface PythPriceFeed {
    id: string;
    price_account: string;
    product_account: string;
    ema_price_account: string;
    ema_confidence_account: string;
    metadata_account: string;
    metadata: {
        symbol: string;
        asset_type: string;
        base: string;
        quote: string;
        description: string;
        decimals: number;
        min_publishers: number;
        status: string;
        price_type: string;
        base_decimal_places: number;
        quote_decimal_places: number;
    };
}

/**
 * Get all available price feeds from Pyth Network API
 */
export async function getPythPriceFeeds(): Promise<PythPriceFeed[]> {
    try {
        const response = await fetch('https://api.pyth.network/api/price_feeds');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch Pyth price feeds:', error);
        throw error;
    }
}

/**
 * Get a specific price feed by its hex ID
 */
export async function getPythPriceFeedById(feedId: string): Promise<PythPriceFeed | null> {
    const feeds = await getPythPriceFeeds();
    return feeds.find(feed => feed.id === feedId) || null;
}

/**
 * Get the account address for a price feed by its hex ID
 */
export async function getPythAccountAddress(feedId: string): Promise<string> {
    const feed = await getPythPriceFeedById(feedId);
    if (!feed) {
        throw new Error(`No price feed found for ID: ${feedId}`);
    }
    return feed.price_account;
}

/**
 * Common price feed IDs (hex format)
 */
export const PYTH_FEED_IDS = {
    BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    SOL_USD: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
} as const;

/**
 * Fallback mapping for common feeds (in case API is unavailable)
 * These addresses should be verified from official sources
 */
export const PYTH_FALLBACK_ADDRESSES: Record<string, string> = {
    [PYTH_FEED_IDS.BTC_USD]: "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG", // BTC/USD
    [PYTH_FEED_IDS.SOL_USD]: "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexeFVtiix", // SOL/USD
    [PYTH_FEED_IDS.ETH_USD]: "EdVCmQ9FSPcVe5YySXDPCRmc5o3wjqo1N9VtxJ4xCSdk", // ETH/USD
};

/**
 * Get account address with fallback to hardcoded mapping
 */
export async function getPythAccountAddressWithFallback(feedId: string): Promise<string> {
    try {
        return await getPythAccountAddress(feedId);
    } catch (error) {
        console.warn('Failed to fetch from Pyth API, using fallback mapping:', error);
        const fallbackAddress = PYTH_FALLBACK_ADDRESSES[feedId];
        if (!fallbackAddress) {
            throw new Error(`No fallback address found for feed ID: ${feedId}`);
        }
        return fallbackAddress;
    }
}
