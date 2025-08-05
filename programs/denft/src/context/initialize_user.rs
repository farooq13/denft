use anchor_lang::prelude::*;


use crate::state::UserAccount;

#[derive(Accounts)]
pub struct InitializeUser<'info> {
  #[account(mut)]
  pub authority: Signer<'info>,


  #[account(
    init,
    payer = user,
    seeds = [b"user", authority.key().as_ref()],
    space = 8 + UserAccount::INIT_SPACE,
    bump,
  )]
  pub user_account: Account<'info, UserAccount>,

  pub system_program: Program<'info, System>,
}