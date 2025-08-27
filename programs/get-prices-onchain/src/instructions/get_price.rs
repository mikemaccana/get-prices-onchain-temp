use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

const BTC_PRICE_FEED_ID: &str =
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

#[derive(Accounts)]
pub struct GetPriceAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    // This account contains the latest price data from Pyth Network
    pub price_update: Account<'info, PriceUpdateV2>,
}

pub fn handler(ctx: Context<GetPriceAccounts>) -> Result<()> {
    let price_update = &ctx.accounts.price_update;

    // We don't want stale prices - 30 seconds max
    let maximum_age: u64 = 30;

    // Convert the hex feed ID to bytes
    let feed_id: [u8; 32] = get_feed_id_from_hex(BTC_PRICE_FEED_ID)?;

    // This is where the magic happens - fetching live prices
    let price = price_update.get_price_no_older_than(&Clock::get()?, maximum_age, &feed_id)?;

    // Log the price information
    msg!(
        "Price: ({} ± {}) * 10^{}",
        price.price,
        price.conf,
        price.exponent
    );

    // Log additional details for debugging
    msg!("Feed ID: {:?}", feed_id);
    msg!("Publish Time: {}", price.publish_time);

    Ok(())
}
