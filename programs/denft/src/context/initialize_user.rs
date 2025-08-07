use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_lang::emit;

use crate::state::{UserAccount};
use crate::state::constants::{MAX_STORAGE_PER_USER, MAX_FILES_PER_USER};
use crate::events::UserInitialized;

#[derive(Accounts)]
pub struct InitializeUser<'info> {
  #[account(mut)]
  pub authority: Signer<'info>,


  #[account(
    init,
    payer = authority,
    seeds = [b"user", authority.key().as_ref()],
    space = 8 + UserAccount::LEN,
    bump,
  )]
  pub user_account: Account<'info, UserAccount>,

  pub system_program: Program<'info, System>,
}


pub mod handler {
  use anchor_lang::prelude::*;
  use super::InitializeUser;
  use crate::state::constants::{MAX_STORAGE_PER_USER, MAX_FILES_PER_USER};
  use crate::events::UserInitialized;
  use anchor_lang::emit;

  pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let clock = Clock::get()?;

    user_account.owner = ctx.accounts.authority.key();
    user_account.file_count = 0;
    user_account.storage_used = 0;
    user_account.storage_limit = MAX_STORAGE_PER_USER;
    user_account.file_limit = MAX_FILES_PER_USER;
    user_account.created_at = clock.unix_timestamp;
    user_account.is_active = true;
    user_account.reserved = [0; 64];

    emit!(UserInitialized {
      user: ctx.accounts.authority.key(),
      timestamp: clock.unix_timestamp,
    });

    Ok(())
  }
}