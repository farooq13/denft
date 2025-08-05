use anchor_lang::prelude::*;


use crate::state::{UploadFile, UserAccount};


#[derive(Accounts)]
#[instruction(file_has: [u8; 32])]
pub struct UploadFile<'info> {
  #[account(mut)]
  pub authority: Signer<'info>,

  #[account(
    
  )]
  pub user_account: Account<'info, UserAccount>,
}