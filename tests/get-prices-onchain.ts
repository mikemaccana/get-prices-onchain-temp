import { before, describe, test, it } from "node:test";
import assert from "node:assert";
import * as programClient from "../dist/js-client";
import { connect } from "solana-kite";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";

const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });

// See https://docs.pyth.network/price-feeds/use-real-time-data/solana#price-feed-accounts
// There are up to 2^16 different accounts for any given price feed id.
// The 0 value below is the shard id that indicates which of these accounts you would like to use.
// However, you may choose to use a different shard to prevent Solana congestion on another app from affecting your app.
const SHARD_ID = 0

const BTC_USD_PRICE_FEED_ID = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"

const btcUsdPriceFeedAccount = pythSolanaReceiver
  .getPriceFeedAccountAddress(SHARD_ID, BTC_USD_PRICE_FEED_ID)
  .toBase58();

describe("get-prices-onchain", async () => {
  const connection = connect()
  const user = await connection.createWallet()


  // const getPrice = connection.getAccountsFactory(
  //   programClient.GET_PRICES_ONCHAIN_PROGRAM_ADDRESS,
  //   OFFER_DISCRIMINATOR,
  //   getPriceDecoder(),
  // );

  it("gets SOL prices", async () => {
    // Add your test here.
    const instruction = await programClient.getGetPriceInstruction({
      payer: user,
      priceUpdate
    })
    const signature = await connection.sendTransactionFromInstructions({
      feePayer: user,
      instructions: [instruction]
    })
    const logs = await connection.getLogs(signature)
    console.log(logs)
  });
});