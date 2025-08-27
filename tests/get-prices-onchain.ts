import { before, describe, test, it } from "node:test";
import assert from "node:assert";
import * as programClient from "../dist/js-client";
import { connect } from "solana-kite";
import { getPriceFeedAccountAddress, PYTH_FEED_IDS } from "./pyth-solana-kit/pyth-account-address";


// See https://docs.pyth.network/price-feeds/use-real-time-data/solana#price-feed-accounts
// However Pyth's tech is old and still uses the legacy web3.js library.
// There are up to 2^16 different accounts for any given price feed id.
// The 0 value below is the shard id that indicates which of these accounts you would like to use.
// However, you may choose to use a different shard to prevent Solana congestion on another app from affecting your app.
const SHARD_ID = 0
const btcUsdPriceFeed = await getPriceFeedAccountAddress(SHARD_ID, PYTH_FEED_IDS.BTC_USD);

describe("get-prices-onchain", async () => {
  const connection = connect()
  const user = await connection.createWallet()

  it("gets BTC prices", async () => {
    const instruction = await programClient.getGetPriceInstruction({
      payer: user,
      priceUpdate: btcUsdPriceFeed
    })
    const signature = await connection.sendTransactionFromInstructions({
      feePayer: user,
      instructions: [instruction]
    })
    const logs = await connection.getLogs(signature)
    console.log(logs)
  });
});