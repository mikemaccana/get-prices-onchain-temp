// Stops Rust Analyzer complaining about missing configs
// See https://solana.stackexchange.com/questions/17777
#![allow(unexpected_cfgs)]
// Fix warning: use of deprecated method `anchor_lang::prelude::AccountInfo::<'a>::realloc`: Use AccountInfo::resize() instead
// See https://solana.stackexchange.com/questions/22979
#![allow(deprecated)]

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;

declare_id!("Cqy4Tnv7htPwDAudDLTT5fXXgCr2Qn19Gr4dfpqFVmxt");

#[program]
pub mod get_prices_onchain {
    use super::*;

    pub fn get_price(context: Context<GetPriceAccounts>) -> Result<()> {
        get_price::handler(context)
    }
}
