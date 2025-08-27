/**
 * Standalone function to get Pyth price feed account addresses using Solana Kit
 * This replaces the web3.js dependency from @pythnetwork/pyth-solana-receiver
 */

import { getProgramDerivedAddress, address } from "@solana/addresses";
import type { Address } from "@solana/addresses";

// Default Pyth Push Oracle program ID
// Source: @pythnetwork/pyth-solana-receiver/lib/address.js
const DEFAULT_PUSH_ORACLE_PROGRAM_ID = "pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT" as Address;

/**
 * Derive the address of a price feed account
 * @param shardId The shard ID of the set of price feed accounts. This shard ID allows for multiple price feed accounts for the same price feed id to exist.
 * @param priceFeedId The price feed ID, as either a 32-byte buffer or hexadecimal string with or without a leading "0x" prefix.
 * @param pushOracleProgramId The program ID of the Pyth Push Oracle program. If not provided, the default deployment will be used.
 * @returns The address of the price feed account
 */
export async function getPriceFeedAccountAddress(
	shardId: number,
	priceFeedId: Buffer | string,
	pushOracleProgramId: Address = DEFAULT_PUSH_ORACLE_PROGRAM_ID
): Promise<Address> {
	// Convert string to Buffer if needed
	let feedIdBuffer: Uint8Array;
	if (typeof priceFeedId === "string") {
		if (priceFeedId.startsWith("0x")) {
			feedIdBuffer = new Uint8Array(Buffer.from(priceFeedId.slice(2), "hex"));
		} else {
			feedIdBuffer = new Uint8Array(Buffer.from(priceFeedId, "hex"));
		}
	} else {
		feedIdBuffer = new Uint8Array(priceFeedId);
	}

	// Validate feed ID length
	if (feedIdBuffer.length !== 32) {
		throw new Error("Feed ID should be 32 bytes long");
	}

	// Create shard buffer (2 bytes, little-endian)
	const shardBuffer = new Uint8Array(2);
	const view = new DataView(shardBuffer.buffer);
	view.setUint16(0, shardId, true); // true for little-endian

	// Use Solana Kit's getProgramDerivedAddress
	const [pda] = await getProgramDerivedAddress({
		programAddress: pushOracleProgramId,
		seeds: [shardBuffer, feedIdBuffer],
	});

	return pda;
}

/**
 * Common price feed IDs (hex format)
 */
export const PYTH_FEED_IDS = {
	BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
	ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
	SOL_USD: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
	USDC_USD: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
} as const;

/**
 * Example usage:
 * 
 * ```typescript
 * import { getPriceFeedAccountAddress, PYTH_FEED_IDS } from './utils/pyth-account-address';
 * 
 * const SHARD_ID = 0;
 * const btcPriceFeedAddress = getPriceFeedAccountAddress(SHARD_ID, PYTH_FEED_IDS.BTC_USD);
 * console.log('BTC/USD Price Feed Address:', btcPriceFeedAddress.toBase58());
 * ```
 */
